// ==UserScript==
// @name         Archive.org Downloader v3.6 [BETA]
// @namespace    http://tampermonkey.net/
// @version      3.6
// @description  Download borrowed books from Archive.org. v3.6 ultra-aggressive detection + orange UI fix.
// @author       AllLiveSupport
// @match        *://archive.org/details/*
// @match        *://archive.org/stream/*
// @match        *://archive.org/embed/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=archive.org
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = "3.6";
    console.log(`%c ARCHIVE DOWNLOADER v${VERSION} STARTING... `, "background:#ff5722;color:#fff;font-weight:bold;padding:5px;");

    /* --- ARCHIVE DOWNLOADER v3.6 --- */
    (async function () {
        /* --- SIMPLE PDF GENERATOR --- */
        class SimplePDF {
            constructor() { this.objects = []; this.pages = []; this.pageObjs = []; }
            addPage(imgDataURL, width, height) { this.pages.push({ data: imgDataURL, width, height }); }
            async generate(filename) {
                const chunks = []; let offset = 0;
                const write = (str) => { const bytes = new TextEncoder().encode(str + '\n'); chunks.push(bytes); offset += bytes.length; };
                const writeBytes = (bytes) => { chunks.push(bytes); offset += bytes.length; };
                write('%PDF-1.4'); write('%\xFF\xFF\xFF\xFF');
                const offsets = [0]; const catalogOffset = offset; offsets.push(catalogOffset);
                write('1 0 obj'); write('<< /Type /Catalog /Pages 2 0 R >>'); write('endobj');
                const pagesOffset = offset; offsets.push(pagesOffset);
                write('2 0 obj'); const pageRefs = this.pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
                write(`<< /Type /Pages /Kids [${pageRefs}] /Count ${this.pages.length} >>`); write('endobj');
                for (let i = 0; i < this.pages.length; i++) {
                    const page = this.pages[i]; const pageNum = 3 + i * 3; const contentNum = pageNum + 1; const imageNum = pageNum + 2;
                    const base64Data = page.data.split(',')[1]; const binaryString = atob(base64Data);
                    const imageBytes = new Uint8Array(binaryString.length);
                    for (let j = 0; j < binaryString.length; j++) { imageBytes[j] = binaryString.charCodeAt(j); }
                    const view = new DataView(imageBytes.buffer); let colorSpace = 'DeviceRGB'; let bitsPerComponent = 8;
                    if (view.getUint16(0) === 0xFFD8) {
                        let pos = 2; while (pos < view.byteLength - 10) {
                            const marker = view.getUint16(pos);
                            if (marker >= 0xFFC0 && marker <= 0xFFCF && marker !== 0xFFC4 && marker !== 0xFFC8) {
                                bitsPerComponent = view.getUint8(pos + 4); const channels = view.getUint8(pos + 9);
                                if (channels === 1) colorSpace = 'DeviceGray'; else if (channels === 3) colorSpace = 'DeviceRGB'; else if (channels === 4) colorSpace = 'DeviceCMYK';
                                break;
                            } pos += 2 + view.getUint16(pos + 2);
                        }
                    }
                    const pageOffset = offset; offsets.push(pageOffset);
                    write(`${pageNum} 0 obj`); write(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}]`);
                    write(`/Contents ${contentNum} 0 R /Resources << /XObject << /Im${i} ${imageNum} 0 R >> >> >>`); write('endobj');
                    const contentOffset = offset; offsets.push(contentOffset);
                    const stream = `q\n${page.width} 0 0 ${page.height} 0 0 cm\n/Im${i} Do\nQ\n`;
                    write(`${contentNum} 0 obj`); write(`<< /Length ${stream.length} >>`); write('stream'); write(stream.trim()); write('endstream'); write('endobj');
                    const imageOffset = offset; offsets.push(imageOffset);
                    write(`${imageNum} 0 obj`); write(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height}`);
                    write(`/ColorSpace /${colorSpace} /BitsPerComponent ${bitsPerComponent}`); write(`/Filter /DCTDecode /Length ${imageBytes.length} >>`);
                    write('stream'); writeBytes(imageBytes); writeBytes(new TextEncoder().encode('\n')); write('endstream'); write('endobj');
                }
                const xrefOffset = offset; write('xref'); write(`0 ${offsets.length}`); write('0000000000 65535 f ');
                for (let i = 1; i < offsets.length; i++) { write(String(offsets[i]).padStart(10, '0') + ' 00000 n '); }
                write('trailer'); write(`<< /Size ${offsets.length} /Root 1 0 R >>`); write('startxref'); write(String(xrefOffset)); write('%%EOF');
                const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0); const pdfBytes = new Uint8Array(totalLength);
                let position = 0; for (const chunk of chunks) { pdfBytes.set(chunk, position); position += chunk.length; }
                const blob = new Blob([pdfBytes], { type: 'application/pdf' }); const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            }
        }

        const originalTitle = document.title;
        const config = { loopInterval: 200, waitTimeout: 15000, selectors: { zoomIn: '.icon.icon-magnify.plus', zoomOut: '.BRicon.zoom_out', oneUp: '.icon.icon-onepg', nextBtn: ['.book_flip_next', '.flip-btn.next', '.icon-right-arrow', 'button[title="Next page"]', 'button[aria-label="Next Page"]'], image: 'img.BRpageimage', pageDisplay: '.BRcurrentpage' } };

        function getCleanBookTitle() {
            let t = originalTitle; if (t.includes(" : Free")) t = t.split(" : ")[0]; if (t.includes("Full text of")) t = t.replace("Full text of", "");
            return t.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().replace(/\s+/g, '_').substring(0, 50) || "Archive_Book";
        }

        function getEl(sel) { if (Array.isArray(sel)) { for (let s of sel) { let el = document.querySelector(s); if (el) return el; } return null; } return document.querySelector(sel); }

        function detectTotalPages() {
            try {
                const el = document.querySelector(config.selectors.pageDisplay);
                if (!el) return 9999;
                const text = el.innerText;
                const match = text.match(/\/(\d+)/);
                if (match && match[1]) return parseInt(match[1]);
                if (text.includes('/')) return parseInt(text.split('/')[1].trim());
            } catch (e) { }
            return 9999;
        }

        const panelId = 'ad-panel-v3.0';
        const launcherId = 'ad-launcher';
        let panel;

        let isRunning = false; let pageCounter = 0; let maxPages = 9999; let processedURLs = new Set(); let downloadMode = 'images'; let pdfPages = [];
        let statusEl, goBtn, startInput, endInput, progressBar, progressText, progressPercent, modeImagesBtn, modePdfBtn;

        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const log = (msg, color = "#ccc") => { if (statusEl) { statusEl.innerText = msg; statusEl.style.color = color; } if (isRunning) document.title = `[${pageCounter}/${maxPages}] ${msg}`; };
        const updateProgress = () => { if (!startInput || !progressBar || !progressPercent || !progressText) return; const progress = ((pageCounter - parseInt(startInput.value)) / (maxPages - parseInt(startInput.value) + 1)) * 100; const percent = Math.min(100, Math.max(0, progress)); progressBar.style.width = percent + '%'; progressPercent.innerText = Math.round(percent) + '%'; progressText.innerText = `Page ${pageCounter} of ${maxPages}`; };

        async function activatePiP() { try { const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 100; const ctx = canvas.getContext('2d'); setInterval(() => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 300, 100); ctx.fillStyle = '#ff5722'; ctx.font = '20px monospace'; ctx.fillText(`Page: ${pageCounter} / ${maxPages}`, 20, 55); ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText("Background Active", 20, 80); }, 1000); const video = document.createElement('video'); video.srcObject = canvas.captureStream(10); video.autoplay = true; video.onloadedmetadata = async () => { try { await video.play(); await video.requestPictureInPicture(); } catch (e) { } }; } catch (e) { } }

        function getBestImage() { const images = document.querySelectorAll(config.selectors.image); let bestImg = null; let minDistance = Infinity; const screenCenter = window.innerHeight / 2; for (let img of images) { if (img.complete && img.naturalWidth > 200 && img.width > 0) { const rect = img.getBoundingClientRect(); const dist = Math.abs((rect.top + rect.height / 2) - screenCenter); if (dist < minDistance) { minDistance = dist; bestImg = img; } } } return bestImg; }
        async function addToPdf(img) { return new Promise(resolve => { try { img.style.opacity = 1; const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0); canvas.toBlob(blob => { if (!blob) { resolve(false); return; } const reader = new FileReader(); reader.onload = (e) => { pdfPages.push({ data: e.target.result, width: canvas.width, height: canvas.height }); canvas.remove(); resolve(true); }; reader.onerror = () => { canvas.remove(); resolve(false); }; reader.readAsDataURL(blob); }, 'image/jpeg', 0.90); } catch (e) { resolve(false); } }); }
        async function generatePDF() { try { log(`Generating PDF...`, "#9b59b6"); if (pdfPages.length === 0) return; const pdf = new SimplePDF(); for (const page of pdfPages) { pdf.addPage(page.data, page.width, page.height); } const bookName = getCleanBookTitle(); await pdf.generate(`${bookName}.pdf`); log("PDF Downloaded!", "#00e676"); } catch (e) { alert("PDF Error: " + e.message); } }

        async function downloadImage(img, finalName) { return new Promise(resolve => { try { img.style.opacity = 1; const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0); canvas.toBlob(blob => { if (!blob) { resolve(false); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${finalName}_${String(pageCounter).padStart(3, '0')}.jpg`; document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); canvas.remove(); }, 100); processedURLs.add(img.src); resolve(true); }, 'image/jpeg', 0.90); } catch { resolve(false); } }); }

        async function startLoop() {
            while (isRunning) {
                if (pageCounter >= maxPages) { isRunning = false; if (downloadMode === 'pdf') await generatePDF(); alert("Completed!"); break; }
                if (pageCounter % 5 === 0) getEl(config.selectors.oneUp)?.click();
                updateProgress(); log(`${pageCounter}. Searching...`, "#fff");
                let img = null; let waitTime = 0;
                while (isRunning && waitTime < config.waitTimeout) { const candidate = getBestImage(); if (candidate && !processedURLs.has(candidate.src)) { img = candidate; break; } await wait(config.loopInterval); waitTime += config.loopInterval; if (candidate && waitTime % 1000 === 0) candidate.scrollIntoView({ block: "center", behavior: "auto" }); }
                if (!img) { const nextBtn = getEl(config.selectors.nextBtn); if (nextBtn && !nextBtn.disabled) { nextBtn.click(); document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'ArrowRight', 'keyCode': 39 })); await wait(2000); continue; } else { isRunning = false; if (downloadMode === 'pdf') await generatePDF(); alert("End of Book!"); break; } }
                if (isRunning && downloadMode === 'images') { const success = await downloadImage(img, getCleanBookTitle()); if (success) { pageCounter++; startInput.value = pageCounter; processedURLs.add(img.src); if (pageCounter >= maxPages) continue; const nextBtn = getEl(config.selectors.nextBtn); if (nextBtn && !nextBtn.disabled) { nextBtn.click(); document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'ArrowRight', 'keyCode': 39 })); await wait(1000); } else { isRunning = false; break; } } }
                else if (isRunning) { const success = await addToPdf(img); if (success) { pageCounter++; startInput.value = pageCounter; processedURLs.add(img.src); if (pageCounter >= maxPages) continue; const nextBtn = getEl(config.selectors.nextBtn); if (nextBtn && !nextBtn.disabled) { nextBtn.click(); document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'ArrowRight', 'keyCode': 39 })); await wait(1000); } else { isRunning = false; await generatePDF(); break; } } }
            }
        }

        /* --- LAUNCHER LOGIC --- */
        function init() {
            // Force recreation if old one exists to apply updates
            const existingLauncher = document.getElementById(launcherId);
            if (existingLauncher && existingLauncher.title.includes("v3.6")) return; // Already updated
            if (existingLauncher) existingLauncher.remove();

            // Ultra-aggressive "Return now" button detection
            const buttons = Array.from(document.querySelectorAll('button, .ia-button, a.button, .ia-button-container *'));
            const returnBtn = buttons.find(b => {
                const text = (b.textContent || b.innerText || "").toLowerCase();
                return text.includes('return now') || text.includes('return loan') || (b.classList && b.classList.contains('danger') && text.includes('return'));
            });

            const hasReader = document.querySelector('.BRcontainer, #BookReader, .ia-book-reader, .bookreader, .web-book-reader, .bookreader-container');

            if (!returnBtn && !hasReader) {
                // If we are looking for why it's missing:
                // console.log("Archive Downloader: Detection pending... No 'Return' button and no reader found.");
                return;
            }

            console.log(`%c ARCHIVE DOWNLOADER: CONFIRMED BORROWED BOOK! Launcher creating... `, "background:#ff5722;color:#fff;");

            const launcher = document.createElement('div');
            launcher.id = launcherId;
            // Orange color (#ff5722) for v3.6 so user sees the change!
            launcher.style.cssText = "position:fixed;bottom:20px;right:20px;width:55px;height:55px;background:#ff5722;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2147483647;box-shadow:0 4px 15px rgba(0,0,0,0.5);transition:transform 0.3s;font-weight:bold;font-family:sans-serif;user-select:none;border:3px solid #fff;";
            launcher.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
            launcher.title = "Archive Downloader v3.6 [BETA]";
            launcher.onmouseover = () => launcher.style.transform = "scale(1.15)";
            launcher.onmouseout = () => launcher.style.transform = "scale(1)";

            launcher.onclick = () => {
                if (!panel) createPanel();
                if (panel.style.display === 'none') {
                    panel.style.display = 'block';
                    launcher.style.background = '#d50000';
                    launcher.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
                } else {
                    panel.style.display = 'none';
                    launcher.style.background = '#ff5722';
                    launcher.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
                }
            };
            document.body.appendChild(launcher);
        }

        function createPanel() {
            if (document.getElementById(panelId)) {
                panel = document.getElementById(panelId);
                return;
            }
            const initialMax = detectTotalPages();
            const bookName = getCleanBookTitle();
            panel = document.createElement('div');
            panel.id = panelId;
            panel.style.cssText = "position:fixed;bottom:85px;right:20px;width:320px;background:#050505;color:#fff;padding:15px;border:2px solid #ff5722;z-index:2147483646;font-family:sans-serif;box-shadow:0 0 40px rgba(255,87,34,0.4);font-size:12px;border-radius:8px;display:none;";
            panel.innerHTML = `
                <h3 style="margin:0 0 10px;text-align:center;border-bottom:1px solid #333;padding-bottom:8px;color:#ff5722;font-weight:bold;">ARCHIVE DOWNLOADER <span style="font-size:10px;">v3.6</span></h3>
                <div style="background:#1a1a1a;padding:8px;border-radius:4px;margin-bottom:10px;">
                    <div style="margin-bottom:5px;color:#888;text-align:center;">QUALITY CONTROL</div>
                    <div style="display:flex;gap:5px;"><button id="ad-plus" style="flex:1;background:#333;color:#fff;border:1px solid #555;cursor:pointer;padding:6px;border-radius:3px;">(+) ZOOM IN</button><button id="ad-minus" style="flex:1;background:#333;color:#fff;border:1px solid #555;cursor:pointer;padding:6px;border-radius:3px;">(-) ZOOM OUT</button></div>
                </div>
                <div style="margin-bottom:10px;background:#1a1a1a;padding:8px;border-radius:4px;">
                    <div style="color:#888;font-size:10px;margin-bottom:5px;text-align:center;">DOWNLOAD MODE</div>
                    <div style="display:flex;gap:5px;">
                        <button id="ad-mode-images" style="flex:1;background:#3498db;color:#fff;border:none;padding:8px;cursor:pointer;font-weight:bold;border-radius:4px;font-size:11px;">IMAGES</button>
                        <button id="ad-mode-pdf" style="flex:1;background:#9b59b6;color:#fff;border:none;padding:8px;cursor:pointer;font-weight:bold;border-radius:4px;font-size:11px;">PDF</button>
                    </div>
                </div>
                <div style="margin-bottom:10px;background:#111;padding:8px;border-radius:4px;display:flex;justify-content:space-between;">
                    <div style="text-align:center;"><span style="color:#aaa;display:block;margin-bottom:2px;">Start #</span><input type="number" id="ad-start" value="0" style="width:50px;background:#333;color:#fff;border:1px solid #555;text-align:center;"></div>
                    <div style="text-align:center;"><span style="color:#aaa;display:block;margin-bottom:2px;">End (Total)</span><input type="number" id="ad-end" value="${initialMax}" style="width:50px;background:#333;color:#fff;border:1px solid #555;text-align:center;"></div>
                </div>
                <div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span id="ad-progress-text" style="color:#aaa;font-size:10px;">Ready...</span><span id="ad-progress-percent" style="color:#ff5722;font-size:10px;font-weight:bold;">0%</span></div><div style="background:#222;height:8px;border-radius:4px;overflow:hidden;"><div id="ad-progress-bar" style="background:linear-gradient(90deg, #ff5722, #d50000);height:100%;width:0%;transition:width 0.3s;"></div></div></div>
                <div id="ad-status" style="margin-bottom:10px;color:#ff5722;padding:5px;border:1px solid #333;min-height:20px;white-space:nowrap;overflow:hidden;">Ready...</div>
                <button id="ad-go" style="width:100%;background:#ff5722;color:#fff;border:none;padding:12px;cursor:pointer;font-weight:bold;font-size:14px;border-radius:4px;">START DOWNLOAD</button>
            `;
            document.body.appendChild(panel);

            statusEl = document.getElementById('ad-status');
            goBtn = document.getElementById('ad-go');
            startInput = document.getElementById('ad-start');
            endInput = document.getElementById('ad-end');
            progressBar = document.getElementById('ad-progress-bar');
            progressText = document.getElementById('ad-progress-text');
            progressPercent = document.getElementById('ad-progress-percent');
            modeImagesBtn = document.getElementById('ad-mode-images');
            modePdfBtn = document.getElementById('ad-mode-pdf');

            function setMode(mode) { downloadMode = mode; if (mode === 'images') { modeImagesBtn.style.background = '#3498db'; modeImagesBtn.style.opacity = '1'; modePdfBtn.style.background = '#555'; modePdfBtn.style.opacity = '0.5'; } else { modePdfBtn.style.background = '#9b59b6'; modePdfBtn.style.opacity = '1'; modeImagesBtn.style.background = '#555'; modeImagesBtn.style.opacity = '0.5'; } }
            modeImagesBtn.onclick = () => setMode('images'); modePdfBtn.onclick = () => setMode('pdf'); setMode('images');

            document.getElementById('ad-plus').onclick = () => getEl(config.selectors.zoomIn)?.click();
            document.getElementById('ad-minus').onclick = () => getEl(config.selectors.zoomOut)?.click();

            goBtn.onclick = async () => { if (isRunning) { isRunning = false; goBtn.innerText = "RESUME"; return; } await activatePiP(); isRunning = true; pageCounter = parseInt(startInput.value); maxPages = parseInt(endInput.value); if (pageCounter === 0) processedURLs.clear(); goBtn.innerText = "STOP"; log("Started!", "#fff"); updateProgress(); startLoop(); };
        }

        setTimeout(init, 1000);
        setInterval(init, 3000);
    })();
})();

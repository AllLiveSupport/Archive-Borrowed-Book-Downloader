# 📚 Archive.org Borrowed Book Downloader v3.6

A professional tool to download **borrowed books** from Archive.org. Choose between high-quality **PDF Export** or individual **JPEG Images**.

> ⚠️ **Important**: This tool works **ONLY with borrowed books**. You must have an active loan to use this downloader.

---

## 🎯 Quick Start (Recommended: Tampermonkey)

The easiest and most reliable way to use this tool is via **Tampermonkey**. This method bypasses Archive.org's security restrictions automatically.

### Installation Steps:

1. **Install Tampermonkey Extension** (Free & Open Source)
   - [Chrome/Edge](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2. **Install the Script**
   - Open [`archive-downloader.user.js`](archive-downloader.user.js) from this repository
   - Copy the entire code
   - Click the Tampermonkey icon in your browser → **Create a new script**
   - Paste the code and save (Ctrl+S)

3. **Start Downloading!**
   - Go to Archive.org and **borrow a book**
   - Open the book reader
   - Look for the **orange download button** in the bottom-right corner 🟠

---

## 📸 Screenshots

### Launcher Button (v3.6)
![Launcher Button](docs/images/TDownload%20Button.PNG)

### Download Control Panel
![Control Panel](docs/images/TDownloader.PNG)

### Picture-in-Picture Progress
![PiP Window](docs/images/PIP.PNG)

---

## ✨ Features

- 📄 **Native PDF Export**: Custom PDF generation engine (no external libraries)
- 🖼 **Image Mode**: Download each page as a numbered JPEG file
- 🎬 **PiP Support**: Picture-in-Picture window keeps the script active in background
- 📊 **Real-time Progress**: Visual progress bar with percentage tracking
- 🔍 **Quality Control**: Built-in zoom buttons to adjust image quality
- 🏁 **Smart Detection**: Automatically finds best image quality and handles book endings
- 🟠 **Visual Confirmation**: Orange launcher button confirms the script is active

---

## 🛠 How to Use

1. **Borrow a book** from Archive.org (you must have an active loan)
2. Open the book in the reader
3. Click the **orange button** in the bottom-right corner
4. Choose your download mode:
   - **IMAGES**: Downloads each page as a separate JPEG file
   - **PDF**: Generates a single PDF file with all pages
5. **(Optional)** Use **ZOOM IN** to increase image quality before downloading
6. Set your page range (Start # and End #)
7. Click **START DOWNLOAD**
8. Keep the **Picture-in-Picture window** open while downloading

---

## 🔧 Alternative Methods

### Method 2: Browser Console (Manual)
If you prefer not to use Tampermonkey:

1. Open [`Archive Downloader.txt`](Archive%20Downloader.txt) and copy the code
2. Go to your borrowed book on Archive.org
3. Press `F12` → **Console** tab
4. Paste the code and press `Enter`

> **Note**: The console version is v3.0. For the latest features (v3.6), use Tampermonkey.

### Method 3: Bookmarklet
*Not recommended due to Archive.org's Content Security Policy restrictions.*

1. Create a new bookmark in your browser
2. Paste the content of [`Archive Downloader Bookmark.txt`](Archive%20Downloader%20Bookmark.txt) as the URL

---

## ❓ FAQ

**Q: Do I need to pay for Tampermonkey?**  
A: No! Tampermonkey is completely **free and open source**. No licenses or subscriptions required.

**Q: Why is the button orange instead of blue?**  
A: Version 3.6 uses an orange theme to help you visually confirm the script has been updated.

**Q: Can I use this on any Archive.org book?**  
A: No, this tool **only works with borrowed books**. You must have an active loan.

**Q: The button doesn't appear. What should I do?**  
A: Make sure you:
   - Have borrowed the book (look for a "Return now" button on the page)
   - Installed the Tampermonkey script correctly
   - Refreshed the page after installation
   - Check the browser console (F12) for any error messages

**Q: Why use Tampermonkey instead of the console version?**  
A: The console script is very long (600+ lines), making it impractical to paste every time. Tampermonkey automatically runs the script on every borrowed book page.

---

## 📋 Technical Details

- **Version**: 3.6 (Beta)
- **Supported Browsers**: Chrome, Edge, Firefox (via Tampermonkey)
- **File Formats**: JPEG (images), PDF (document)
- **Image Quality**: Adjustable via zoom controls
- **PDF Engine**: Custom implementation (no external dependencies)

---

## 📑 License

MIT License. Created for educational purposes.

**Please respect copyright laws and Archive.org's terms of service.** This tool is intended for personal backup of borrowed materials only.

---

**Made with ❤️ by AllLiveSupport**

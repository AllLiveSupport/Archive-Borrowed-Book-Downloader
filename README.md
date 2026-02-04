# Archive.org Borrowed Book Downloader

GitHub repo context: **Archive.org Borrowed Book Downloader v3.0**

A powerful and user-friendly tool to download borrowed books from Archive.org. Now featuring high-quality **PDF Export** without any external dependencies!

## 🆕 What's New in v3.0 (Major Update)
- ✅ **Native PDF Export**: Download entire books as a single, high-quality PDF.
- ✅ **Custom PDF Engine**: Built from scratch to bypass Archive.org's strict Security Policy (CSP).
- ✅ **Improved Stability**: Fixed infinite loops and better end-of-book detection.
- ✅ **Dual Mode**: Choose between downloading individual **IMAGES** or a single **PDF**.

---

## 🚀 Installation & Usage

### Method 1: Bookmarklet (Recommended)
1. Copy the entire code from [Archive Downloader Bookmark.txt](Archive%20Downloader%20Bookmark.txt).
2. Create a new bookmark in your browser.
3. Paste the code into the **URL** (or Address) field of the bookmark.
4. Open your borrowed book on Archive.org and click the bookmark!

### Method 2: Browser Console
1. Open the [Archive Downloader.txt](Archive%20Downloader.txt) file and copy the code.
2. Go to your borrowed book page on Archive.org.
3. Press `F12` to open Developer Tools, go to the **Console** tab.
4. Paste the code and press `Enter`.

---

## ✨ Key Features
- **PDF & Image Support**: Choose the format that fits your needs.
- **Picture-in-Picture (PiP)**: Keep the download running in the background while you browse other tabs.
- **Quality Control**: Use the (+) and (-) buttons to adjust zoom levels for better resolution.
- **Progress Tracking**: Real-time progress bar and percentage display.
- **Smart Detection**: Automatically detects page numbers and handles book endings gracefully.

---

## 🛠 How it Works
Due to Archive.org's strict Content Security Policy, standard PDF libraries (like jsPDF) cannot be loaded easily. Version 3.0 introduces a **custom-built PDF generator** that runs entirely within the page's original context, ensuring a secure and reliable export process every time.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Disclaimer: This tool is for personal use only. Please respect Archive.org's terms of service and copyright laws.*

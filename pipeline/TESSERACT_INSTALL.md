# TESSERACT OCR INSTALLATION GUIDE

## Step 1: Download Tesseract OCR for Windows

1. Go to: https://github.com/UB-Mannheim/tesseract/wiki
2. Download the latest Windows installer (tesseract-ocr-w64-setup-5.x.x.exe)
3. Run the installer
4. **IMPORTANT**: During installation, note the installation path (usually C:\Program Files\Tesseract-OCR)
5. Add Tesseract to your PATH or note the path for the script

## Step 2: Install Poppler (Required for pdf2image)

1. Download Poppler for Windows from: https://github.com/oschwartz10612/poppler-windows/releases/
2. Download the latest release (poppler-xx.xx.x_x64.zip)
3. Extract to a folder (e.g., C:\poppler)
4. Add the bin folder to your PATH (e.g., C:\poppler\Library\bin)

## Step 3: Verify Installation

Open PowerShell and run:
```
tesseract --version
```

You should see version information.

## Step 4: Run the OCR Extraction Script

Once Tesseract and Poppler are installed, run:
```
python extract_questions_ocr.py
```

## Troubleshooting

If you get "tesseract is not installed" error:
- Make sure Tesseract is in your PATH
- Or edit the script to point to the Tesseract executable directly

If you get poppler error:
- Make sure poppler bin folder is in your PATH
- Or edit the script to point to the poppler bin folder

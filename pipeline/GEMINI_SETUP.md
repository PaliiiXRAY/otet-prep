# Gemini Vision API Setup Guide

## Step 1: Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

## Step 2: Install Required Packages

```powershell
pip install google-generativeai pdf2image Pillow
```

## Step 3: Install Poppler (for PDF to Image conversion)

1. Download from: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extract to C:\poppler
3. Add C:\poppler\Library\bin to your PATH

OR set the path in the script directly.

## Step 4: Set Your API Key

**Option A: Environment Variable (Recommended)**
```powershell
set GEMINI_API_KEY=your_api_key_here
```

**Option B: Edit Script**
Open `extract_with_gemini.py` and replace line 22:
```python
API_KEY = 'your_actual_api_key_here'
```

## Step 5: Run the Extraction

```powershell
python extract_with_gemini.py
```

## What It Does

- Converts PDF pages to images
- Sends each image to Gemini Vision API
- Gemini "reads" the image and extracts questions
- Parses the response and formats as JavaScript
- Saves to data/paper1.js and data/paper2_social.js

## API Costs

- Gemini 1.5 Flash is FREE for up to 15 requests/minute
- Each page = 1 request
- 10 pages = well within free tier
- For more pages, you may need to wait between batches

## Troubleshooting

**"API key not set"**
- Make sure you set the environment variable or edited the script

**"Poppler not found"**
- Install Poppler and add to PATH
- Or specify poppler_path in the script

**"Rate limit exceeded"**
- Wait a minute and try again
- Reduce max_pages parameter

"""
OTET Question Extractor using Gemini Vision API
Reads PDF images and extracts questions using Google's Gemini model
"""

import google.generativeai as genai
from pdf2image import convert_from_path
from PIL import Image
import json
import re
from pathlib import Path
import os

# SETUP INSTRUCTIONS:
# 1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
# 2. Set it as environment variable: set GEMINI_API_KEY=your_key_here
# 3. Or paste it directly in the script below (line 22)

# Configure Gemini API from environment variable
API_KEY = os.getenv('GEMINI_API_KEY', '')
if not API_KEY:
    print("[WARN] GEMINI_API_KEY not found in environment variables. Set it with: export GEMINI_API_KEY='your_key'")
genai.configure(api_key=API_KEY)

def extract_questions_from_pdf_with_gemini(pdf_path, start_page=2, max_pages=10):
    """Extract questions from PDF using Gemini Vision"""
    print(f"\n[GEMINI] Processing: {pdf_path.name}")
    print(f"  Converting pages {start_page} to {start_page + max_pages}...")
    
    try:
        # Convert PDF to images (skip first page - it's promotional)
        poppler_path = r'C:\poppler\poppler-25.12.0\Library\bin'
        images = convert_from_path(pdf_path, first_page=start_page, last_page=start_page + max_pages - 1, dpi=200, poppler_path=poppler_path)
        print(f"  Converted {len(images)} pages to images")
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        all_questions = []
        
        for i, image in enumerate(images):
            page_num = start_page + i
            print(f"  [Page {page_num}] Analyzing with Gemini...", end='')
            
            # Prepare prompt for Gemini
            prompt = """
Extract ALL questions from this OTET exam page image.

For EACH question, provide:
1. Question number
2. Complete question text
3. All 4 options (A, B, C, D)

Format your response EXACTLY as JSON array:
[
  {
    "number": 1,
    "text": "Question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"]
  },
  {
    "number": 2,
    "text": "Next question text",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  }
]

IMPORTANT:
- Extract COMPLETE question text
- Include ALL 4 options
- Maintain exact wording
- Skip headers/footers/watermarks
- Only extract actual exam questions
"""
            
            try:
                # Send image to Gemini
                response = model.generate_content([prompt, image])
                response_text = response.text
                
                # Extract JSON from response
                json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if json_match:
                    questions_json = json.loads(json_match.group())
                    all_questions.extend(questions_json)
                    print(f" Found {len(questions_json)} questions")
                else:
                    print(" No questions found")
                    
            except Exception as e:
                print(f" Error: {e}")
                continue
        
        print(f"\n  [TOTAL] Extracted {len(all_questions)} questions from {len(images)} pages")
        return all_questions
        
    except Exception as e:
        print(f"  [ERROR] {e}")
        return []

def categorize_question(text, num):
    """Categorize question by subject"""
    text_lower = text.lower()
    
    keywords = {
        "CDP": ['piaget', 'vygotsky', 'learning', 'child', 'development', 'pedagogy', 'intelligence', 'motivation', 'assessment', 'evaluation', 'teaching'],
        "Math": ['sum', 'angle', 'triangle', 'square', 'lcm', 'hcf', 'fraction', 'equation', 'algebra', 'geometry', 'calculate', 'find the value'],
        "EVS": ['environment', 'plant', 'animal', 'vitamin', 'planet', 'ecosystem', 'pollution', 'photosynthesis', 'habitat', 'food chain'],
        "History": ['war', 'empire', 'dynasty', 'king', 'independence', 'revolt', 'mughal', 'british', 'freedom', 'movement'],
        "Geography": ['river', 'mountain', 'climate', 'latitude', 'dam', 'ocean', 'continent', 'map', 'location'],
        "Polity": ['constitution', 'fundamental', 'article', 'parliament', 'president', 'judiciary', 'government', 'rights'],
        "English": ['grammar', 'sentence', 'verb', 'noun', 'synonym', 'antonym', 'tense', 'preposition', 'article'],
        "Odia": ['odia', 'oriya', 'sandhi', 'samasa', 'vibhakti', 'ଓଡ଼ିଆ']
    }
    
    for subject, words in keywords.items():
        if any(word in text_lower for word in words):
            return subject
    
    # Default by number
    if num <= 30: return "CDP"
    elif num <= 60: return "Odia"
    elif num <= 90: return "English"
    elif num <= 120: return "Math"
    else: return "EVS"

def convert_to_js_format(questions, paper_type):
    """Convert to JavaScript format"""
    js_questions = []
    
    for q in questions:
        if len(q.get('options', [])) < 4:
            continue  # Skip incomplete questions
        
        subject = categorize_question(q['text'], q['number'])
        
        js_q = {
            "id": q["number"],
            "subject": subject,
            "q": {
                "en": q["text"],
                "or": "[Odia translation needed]"
            },
            "options": {
                "en": q["options"][:4],
                "or": ["[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]"]
            },
            "answer": 0  # Default - needs verification
        }
        js_questions.append(js_q)
    
    return js_questions

def save_js_file(questions, filename):
    """Save as JavaScript file"""
    var_name = "paper1Questions" if "paper1" in filename else "paper2SocialQuestions"
    
    js_code = f"// Extracted using Gemini Vision API\n// Total: {len(questions)} questions\n\n"
    js_code += f"window.{var_name} = [\n"
    
    for i, q in enumerate(questions):
        js_code += "    " + json.dumps(q, ensure_ascii=False)
        if i < len(questions) - 1:
            js_code += ","
        js_code += "\n"
    
    js_code += "];\n"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(js_code)

def main():
    print("=" * 70)
    print("OTET Question Extractor - Gemini Vision API")
    print("=" * 70)
    
    # Check API key
    if API_KEY == 'YOUR_API_KEY_HERE' or not API_KEY:
        print("\n[ERROR] Gemini API key not set!")
        print("\nTo get your API key:")
        print("1. Visit: https://makersuite.google.com/app/apikey")
        print("2. Create a new API key (free tier available)")
        print("3. Set environment variable: set GEMINI_API_KEY=your_key")
        print("   OR edit this script and paste your key at line 22")
        return
    
    print(f"\n[OK] API Key configured")
    
    # Find PDFs
    pdf_files = list(Path('.').glob('*.pdf'))
    
    if not pdf_files:
        print("\n[ERROR] No PDF files found!")
        return
    
    print(f"\nFound {len(pdf_files)} PDF(s)")
    
    # Separate by paper type
    paper1_pdfs = [p for p in pdf_files if 'paper1' in p.name.lower() or 'paper-1' in p.name.lower() or 'paper-i' in p.name.lower()]
    paper2_pdfs = [p for p in pdf_files if ('paper2' in p.name.lower() or 'paper-2' in p.name.lower() or 'paper-ii' in p.name.lower()) and 'social' in p.name.lower()]
    
    all_p1 = []
    all_p2 = []
    
    # Process Paper 1 (limit to 1 PDF, 10 pages to save API calls)
    if paper1_pdfs:
        print(f"\n[PAPER 1] Processing 1 PDF (10 pages)...")
        pdf = paper1_pdfs[0]
        questions = extract_questions_from_pdf_with_gemini(pdf, start_page=2, max_pages=10)
        all_p1.extend(questions)
    
    # Process Paper 2 (limit to 1 PDF, 10 pages)
    if paper2_pdfs:
        print(f"\n[PAPER 2 SOCIAL] Processing 1 PDF (10 pages)...")
        pdf = paper2_pdfs[0]
        questions = extract_questions_from_pdf_with_gemini(pdf, start_page=2, max_pages=10)
        all_p2.extend(questions)
    
    # Remove duplicates
    def dedupe(qs):
        seen = set()
        unique = []
        for q in qs:
            key = str(q.get('number', 0))
            if key not in seen:
                seen.add(key)
                unique.append(q)
        return unique
    
    all_p1 = dedupe(all_p1)
    all_p2 = dedupe(all_p2)
    
    # Save results
    print(f"\n[SAVE] Generating JavaScript files...")
    
    if all_p1:
        js_qs = convert_to_js_format(all_p1, "paper1")
        save_js_file(js_qs, "data/paper1.js")
        print(f"  [OK] data/paper1.js - {len(js_qs)} questions")
        
        # Save raw JSON for review
        with open('paper1_gemini_raw.json', 'w', encoding='utf-8') as f:
            json.dump(all_p1, f, indent=2, ensure_ascii=False)
        print(f"  [OK] paper1_gemini_raw.json - raw extraction")
    
    if all_p2:
        js_qs = convert_to_js_format(all_p2, "paper2_social")
        save_js_file(js_qs, "data/paper2_social.js")
        print(f"  [OK] data/paper2_social.js - {len(js_qs)} questions")
        
        with open('paper2_social_gemini_raw.json', 'w', encoding='utf-8') as f:
            json.dump(all_p2, f, indent=2, ensure_ascii=False)
        print(f"  [OK] paper2_social_gemini_raw.json - raw extraction")
    
    print("\n" + "=" * 70)
    print("[SUCCESS] Gemini Vision Extraction Complete!")
    print(f"\nPaper 1: {len(all_p1)} questions")
    print(f"Paper 2 Social: {len(all_p2)} questions")
    print("\n[NEXT STEPS]:")
    print("1. Review the generated files")
    print("2. Check raw JSON files for accuracy")
    print("3. Add Odia translations")
    print("4. Verify correct answers")
    print("\n[NOTE] Limited to 10 pages per PDF to save API costs")
    print("       Increase max_pages parameter to extract more")

if __name__ == "__main__":
    main()

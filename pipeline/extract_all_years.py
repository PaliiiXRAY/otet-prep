"""
OTET Question Extractor with Gemini Vision + Odia Translation
Extracts questions from PDFs and translates to Odia automatically
Organizes by year for year-wise mock tests
"""

import google.generativeai as genai
from pdf2image import convert_from_path
from PIL import Image
import json
import re
from pathlib import Path
import os

# Configure Gemini API
API_KEY = os.getenv('GEMINI_API_KEY', '')
genai.configure(api_key=API_KEY)

def extract_year_from_filename(filename):
    """Extract year from PDF filename"""
    # Look for 4-digit year
    match = re.search(r'20\d{2}', filename)
    return match.group() if match else "Unknown"

def translate_to_odia(text):
    """Translate English text to Odia using Gemini"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""Translate the following English text to Odia language. 
Only provide the Odia translation, nothing else.

English: {text}

Odia:"""
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"    Translation error: {e}")
        return "[ଓଡ଼ିଆ ଅନୁବାଦ ଆବଶ୍ୟକ]"

def extract_questions_from_pdf_with_gemini(pdf_path, start_page=2, max_pages=None):
    """Extract questions from PDF using Gemini Vision"""
    print(f"\n[GEMINI] Processing: {pdf_path.name}")
    
    try:
        # Convert PDF to images
        poppler_path = r'C:\poppler\poppler-25.12.0\Library\bin'
        
        if max_pages:
            print(f"  Converting pages {start_page} to {start_page + max_pages}...")
            images = convert_from_path(pdf_path, first_page=start_page, last_page=start_page + max_pages - 1, dpi=200, poppler_path=poppler_path)
        else:
            print(f"  Converting ALL pages from {start_page}...")
            images = convert_from_path(pdf_path, first_page=start_page, dpi=200, poppler_path=poppler_path)
        
        print(f"  Converted {len(images)} pages to images")
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        all_questions = []
        
        for i, image in enumerate(images):
            page_num = start_page + i
            print(f"  [Page {page_num}] Analyzing with Gemini...", end='')
            
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
                response = model.generate_content([prompt, image])
                response_text = response.text
                
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

def convert_to_js_format(questions, year, paper_type, translate=True):
    """Convert to JavaScript format with Odia translation"""
    js_questions = []
    
    print(f"\n  [TRANSLATE] Translating {len(questions)} questions to Odia...")
    
    for idx, q in enumerate(questions):
        if len(q.get('options', [])) < 4:
            continue
        
        subject = categorize_question(q['text'], q['number'])
        
        # Translate to Odia
        if translate:
            print(f"    Translating Q{idx+1}/{len(questions)}...", end='\r')
            q_odia = translate_to_odia(q['text'])
            options_odia = [translate_to_odia(opt) for opt in q['options'][:4]]
        else:
            q_odia = "[Odia translation needed]"
            options_odia = ["[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]"]
        
        js_q = {
            "id": q["number"],
            "subject": subject,
            "year": year,
            "q": {
                "en": q["text"],
                "or": q_odia
            },
            "options": {
                "en": q["options"][:4],
                "or": options_odia
            },
            "answer": 0  # Default - needs verification
        }
        js_questions.append(js_q)
    
    print(f"\n  [OK] Translation complete!")
    return js_questions

def save_js_file(questions, filename, year):
    """Save as JavaScript file"""
    var_name = f"otet{year}Questions"
    
    js_code = f"// OTET {year} - Extracted using Gemini Vision API\n"
    js_code += f"// Total: {len(questions)} questions\n\n"
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
    print("OTET PYQ Extractor - Year-wise with Odia Translation")
    print("=" * 70)
    
    # Find all PDFs
    pdf_files = list(Path('.').glob('*.pdf'))
    
    if not pdf_files:
        print("\n[ERROR] No PDF files found!")
        return
    
    print(f"\nFound {len(pdf_files)} PDF(s)")
    
    # Group by year
    pdfs_by_year = {}
    for pdf in pdf_files:
        year = extract_year_from_filename(pdf.name)
        if year not in pdfs_by_year:
            pdfs_by_year[year] = []
        pdfs_by_year[year].append(pdf)
    
    print(f"\nYears found: {sorted(pdfs_by_year.keys())}")
    
    # Process each year
    for year in sorted(pdfs_by_year.keys()):
        print(f"\n{'='*70}")
        print(f"PROCESSING YEAR: {year}")
        print(f"{'='*70}")
        
        year_questions = []
        
        for pdf in pdfs_by_year[year]:
            # Extract ALL pages (no limit)
            questions = extract_questions_from_pdf_with_gemini(pdf, start_page=2, max_pages=None)
            year_questions.extend(questions)
        
        if not year_questions:
            print(f"  [SKIP] No questions extracted for {year}")
            continue
        
        # Remove duplicates
        seen = set()
        unique_questions = []
        for q in year_questions:
            key = str(q.get('number', 0))
            if key not in seen:
                seen.add(key)
                unique_questions.append(q)
        
        print(f"\n  [UNIQUE] {len(unique_questions)} unique questions for {year}")
        
        # Convert to JS format with Odia translation
        js_questions = convert_to_js_format(unique_questions, year, "mixed", translate=True)
        
        # Save year-wise file
        filename = f"data/otet_{year}.js"
        save_js_file(js_questions, filename, year)
        print(f"  [SAVED] {filename} - {len(js_questions)} questions")
        
        # Save raw JSON
        with open(f'otet_{year}_raw.json', 'w', encoding='utf-8') as f:
            json.dump(unique_questions, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 70)
    print("[SUCCESS] All Years Extracted!")
    print("\nFiles created in data/ folder:")
    for year in sorted(pdfs_by_year.keys()):
        print(f"  - otet_{year}.js")
    print("\n[NEXT] Update index.html to show year-wise mock tests!")

if __name__ == "__main__":
    main()

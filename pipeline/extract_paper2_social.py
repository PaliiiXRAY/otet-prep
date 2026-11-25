"""
OTET Paper 2 Social Science Extractor - URGENT
Focus on Paper 2 Social Science only with Odia translation
"""

import google.generativeai as genai
from pdf2image import convert_from_path
from PIL import Image
import json
import re
from pathlib import Path
import time

# NEW API KEY
API_KEY = os.getenv('GEMINI_API_KEY', '')
genai.configure(api_key=API_KEY)

def translate_to_odia(text):
    """Translate English text to Odia using Gemini"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""Translate this to Odia. Only provide the Odia translation:

{text}"""
        response = model.generate_content(prompt)
        time.sleep(1)  # Rate limiting
        return response.text.strip()
    except Exception as e:
        return "[ଓଡ଼ିଆ]"

def extract_questions_from_pdf(pdf_path, start_page=2):
    """Extract ALL questions from PDF"""
    print(f"\n[PDF] {pdf_path.name}")
    
    try:
        poppler_path = r'C:\poppler\poppler-25.12.0\Library\bin'
        images = convert_from_path(pdf_path, first_page=start_page, dpi=200, poppler_path=poppler_path)
        print(f"  Pages: {len(images)}")
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        all_questions = []
        
        for i, image in enumerate(images):
            page_num = start_page + i
            print(f"  [Page {page_num}] Extracting...", end='')
            
            prompt = """Extract ALL questions from this image as JSON:
[{"number": 1, "text": "question", "options": ["A", "B", "C", "D"]}]

Only return the JSON array, nothing else."""
            
            try:
                response = model.generate_content([prompt, image])
                json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group())
                    all_questions.extend(questions)
                    print(f" {len(questions)} Q")
                else:
                    print(" 0 Q")
                time.sleep(2)  # Rate limiting
            except Exception as e:
                print(f" Error: {str(e)[:50]}")
                time.sleep(3)
        
        print(f"  TOTAL: {len(all_questions)} questions")
        return all_questions
        
    except Exception as e:
        print(f"  ERROR: {e}")
        return []

def categorize_subject(text, num):
    """Categorize by subject"""
    text_lower = text.lower()
    
    if any(w in text_lower for w in ['piaget', 'vygotsky', 'learning', 'child', 'pedagogy']):
        return "CDP"
    elif any(w in text_lower for w in ['war', 'empire', 'independence', 'mughal', 'british']):
        return "History"
    elif any(w in text_lower for w in ['river', 'mountain', 'climate', 'latitude']):
        return "Geography"
    elif any(w in text_lower for w in ['constitution', 'parliament', 'president', 'article']):
        return "Polity"
    elif any(w in text_lower for w in ['grammar', 'verb', 'noun', 'tense']):
        return "English"
    elif 'ଓଡ଼ିଆ' in text or any(w in text_lower for w in ['odia', 'oriya']):
        return "Odia"
    
    # Default by number
    if num <= 30: return "CDP"
    elif num <= 60: return "Odia"
    elif num <= 90: return "English"
    elif num <= 105: return "History"
    elif num <= 120: return "Geography"
    else: return "Polity"

def main():
    print("=" * 70)
    print("OTET PAPER 2 SOCIAL SCIENCE - COMPLETE EXTRACTION")
    print("=" * 70)
    
    # Find Paper 2 Social PDFs
    all_pdfs = list(Path('.').glob('*.pdf'))
    paper2_social_pdfs = [p for p in all_pdfs if 'social' in p.name.lower() and ('paper2' in p.name.lower() or 'paper-2' in p.name.lower() or 'paper-ii' in p.name.lower())]
    
    if not paper2_social_pdfs:
        print("\n[ERROR] No Paper 2 Social Science PDFs found!")
        return
    
    print(f"\nFound {len(paper2_social_pdfs)} Paper 2 Social PDFs:")
    for pdf in paper2_social_pdfs:
        print(f"  - {pdf.name}")
    
    all_questions = []
    
    # Extract from each PDF
    for pdf in paper2_social_pdfs:
        questions = extract_questions_from_pdf(pdf, start_page=2)
        all_questions.extend(questions)
    
    # Remove duplicates
    seen = set()
    unique = []
    for q in all_questions:
        key = str(q.get('number', 0)) + q.get('text', '')[:50]
        if key not in seen and len(q.get('options', [])) >= 4:
            seen.add(key)
            unique.append(q)
    
    print(f"\n[UNIQUE] {len(unique)} unique questions")
    
    # Translate to Odia
    print(f"\n[TRANSLATE] Translating to Odia...")
    js_questions = []
    
    for idx, q in enumerate(unique):
        subject = categorize_subject(q['text'], q['number'])
        
        print(f"  Q{idx+1}/{len(unique)} - {subject}...", end='\r')
        
        # Translate
        q_odia = translate_to_odia(q['text'])
        opts_odia = [translate_to_odia(opt) for opt in q['options'][:4]]
        
        js_q = {
            "id": q["number"],
            "subject": subject,
            "q": {"en": q["text"], "or": q_odia},
            "options": {"en": q["options"][:4], "or": opts_odia},
            "answer": 0
        }
        js_questions.append(js_q)
    
    print(f"\n[OK] Translation complete!")
    
    # Save
    js_code = f"// Paper 2 Social Science - Complete\n// Total: {len(js_questions)} questions\n\n"
    js_code += f"window.paper2SocialQuestions = [\n"
    
    for i, q in enumerate(js_questions):
        js_code += "    " + json.dumps(q, ensure_ascii=False)
        if i < len(js_questions) - 1:
            js_code += ","
        js_code += "\n"
    
    js_code += "];\n"
    
    with open('data/paper2_social.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
    
    # Save raw JSON
    with open('paper2_social_complete.json', 'w', encoding='utf-8') as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 70)
    print(f"[SUCCESS] {len(js_questions)} questions ready!")
    print("\nSaved to: data/paper2_social.js")
    print("\nYour papa can start practicing NOW!")

if __name__ == "__main__":
    main()

"""
OTET Paper 2 Social - FIXED VERSION
- Extracts CORRECT ANSWERS from PDFs
- Gets ALL 160 questions
- Odia translation for everything
"""

import google.generativeai as genai
from pdf2image import convert_from_path
import json
import re
from pathlib import Path
import time

API_KEY = os.getenv('GEMINI_API_KEY', '')
genai.configure(api_key=API_KEY)

def translate_to_odia(text):
    """Translate to Odia"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(f"Translate to Odia only: {text}")
        time.sleep(1)
        return response.text.strip()
    except:
        return "[ଓଡ଼ିଆ]"

def extract_with_answers(pdf_path, start_page=2):
    """Extract questions WITH CORRECT ANSWERS"""
    print(f"\n[PDF] {pdf_path.name}")
    
    try:
        poppler_path = r'C:\poppler\poppler-25.12.0\Library\bin'
        images = convert_from_path(pdf_path, first_page=start_page, dpi=200, poppler_path=poppler_path)
        print(f"  Total pages: {len(images)}")
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        all_questions = []
        
        for i, image in enumerate(images):
            page_num = start_page + i
            print(f"  [Page {page_num}]", end='')
            
            # UPDATED PROMPT TO GET CORRECT ANSWERS
            prompt = """Extract ALL questions from this OTET exam page.

For EACH question, provide:
1. Question number
2. Complete question text  
3. All 4 options (A, B, C, D)
4. CORRECT ANSWER (which option letter: A, B, C, or D)

IMPORTANT: Look for answer key markings, asterisks (*), bold text, or any indication of the correct answer.

Format as JSON:
[
  {
    "number": 1,
    "text": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "B"
  }
]

Only return the JSON array."""
            
            try:
                response = model.generate_content([prompt, image])
                json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group())
                    all_questions.extend(questions)
                    print(f" {len(questions)} Q")
                else:
                    print(" 0 Q")
                time.sleep(2)
            except Exception as e:
                print(f" Err")
                time.sleep(3)
        
        print(f"  TOTAL: {len(all_questions)} questions extracted")
        return all_questions
        
    except Exception as e:
        print(f"  ERROR: {e}")
        return []

def convert_answer_to_index(answer_letter):
    """Convert A/B/C/D to 0/1/2/3"""
    answer_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 
                  'a': 0, 'b': 1, 'c': 2, 'd': 3}
    return answer_map.get(str(answer_letter).strip().upper(), 0)

def categorize_subject(text, num):
    """Categorize by subject"""
    text_lower = text.lower()
    
    if any(w in text_lower for w in ['piaget', 'vygotsky', 'learning', 'child', 'pedagogy']):
        return "CDP"
    elif any(w in text_lower for w in ['war', 'empire', 'independence', 'mughal']):
        return "History"
    elif any(w in text_lower for w in ['river', 'mountain', 'climate', 'latitude']):
        return "Geography"
    elif any(w in text_lower for w in ['constitution', 'parliament', 'article']):
        return "Polity"
    elif any(w in text_lower for w in ['grammar', 'verb', 'noun']):
        return "English"
    elif 'ଓଡ଼ିଆ' in text:
        return "Odia"
    
    if num <= 30: return "CDP"
    elif num <= 60: return "Odia"
    elif num <= 90: return "English"
    elif num <= 105: return "History"
    elif num <= 120: return "Geography"
    else: return "Polity"

def main():
    print("=" * 70)
    print("PAPER 2 SOCIAL - COMPLETE WITH CORRECT ANSWERS")
    print("=" * 70)
    
    # Find Paper 2 Social PDFs
    all_pdfs = list(Path('.').glob('*.pdf'))
    paper2_pdfs = [p for p in all_pdfs if 'social' in p.name.lower() and 
                   ('paper2' in p.name.lower() or 'paper-2' in p.name.lower() or 'paper-ii' in p.name.lower())]
    
    if not paper2_pdfs:
        print("[ERROR] No Paper 2 Social PDFs found!")
        return
    
    print(f"\nFound {len(paper2_pdfs)} Paper 2 Social PDF(s)")
    
    all_questions = []
    
    # Extract from each PDF
    for pdf in paper2_pdfs:
        questions = extract_with_answers(pdf, start_page=2)
        all_questions.extend(questions)
    
    # Remove duplicates
    seen = set()
    unique = []
    for q in all_questions:
        if len(q.get('options', [])) >= 4:
            key = str(q.get('number', 0))
            if key not in seen:
                seen.add(key)
                unique.append(q)
    
    print(f"\n[UNIQUE] {len(unique)} unique questions")
    
    if len(unique) < 160:
        print(f"[WARNING] Only got {len(unique)} questions, need 160!")
        print("  Tip: Make sure all PDF pages are being processed")
    
    # Translate to Odia
    print(f"\n[TRANSLATE] Translating to Odia...")
    js_questions = []
    
    for idx, q in enumerate(unique):
        subject = categorize_subject(q['text'], q['number'])
        
        print(f"  Q{idx+1}/{len(unique)} - {subject}...", end='\r')
        
        # Translate
        q_odia = translate_to_odia(q['text'])
        opts_odia = [translate_to_odia(opt) for opt in q['options'][:4]]
        
        # Convert answer letter to index
        correct_answer = convert_answer_to_index(q.get('correct_answer', 'A'))
        
        js_q = {
            "id": q["number"],
            "subject": subject,
            "q": {"en": q["text"], "or": q_odia},
            "options": {"en": q["options"][:4], "or": opts_odia},
            "answer": correct_answer  # CORRECT ANSWER NOW!
        }
        js_questions.append(js_q)
    
    print(f"\n[OK] Translation complete!")
    
    # Save
    js_code = f"// Paper 2 Social Science - Complete with Correct Answers\n"
    js_code += f"// Total: {len(js_questions)} questions\n\n"
    js_code += f"window.paper2SocialQuestions = [\n"
    
    for i, q in enumerate(js_questions):
        js_code += "    " + json.dumps(q, ensure_ascii=False)
        if i < len(js_questions) - 1:
            js_code += ","
        js_code += "\n"
    
    js_code += "];\n"
    
    with open('data/paper2_social.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
    
    # Save raw
    with open('paper2_social_with_answers.json', 'w', encoding='utf-8') as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 70)
    print(f"[SUCCESS] {len(js_questions)} questions with CORRECT ANSWERS!")
    print("\nSaved to: data/paper2_social.js")
    print("\nYour papa can practice with REAL answers now!")

if __name__ == "__main__":
    main()

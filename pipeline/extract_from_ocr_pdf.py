"""
Extract questions from OCR-converted PDF
Works with PDFs that have been converted to have extractable text
"""

import PyPDF2
import re
import json
from pathlib import Path

def extract_text_from_ocr_pdf(pdf_path):
    """Extract text from OCR-converted PDF"""
    print(f"\nExtracting text from: {pdf_path.name}")
    
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            print(f"  Total pages: {len(reader.pages)}")
            
            full_text = ""
            for i, page in enumerate(reader.pages):
                print(f"  Reading page {i+1}/{len(reader.pages)}...", end='\r')
                text = page.extract_text()
                full_text += text + "\n\n"
            
            print(f"\n  Extracted {len(full_text)} characters")
            
            # Save to file
            debug_file = str(pdf_path).replace('.pdf', '_ocr_text.txt')
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print(f"  Saved to: {debug_file}")
            
            return full_text
            
    except Exception as e:
        print(f"  Error: {e}")
        return ""

def parse_questions(text):
    """Parse questions from extracted text"""
    questions = []
    lines = text.split('\n')
    
    current_q = None
    current_options = []
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 3:
            continue
        
        # Skip headers/watermarks
        if any(skip in line.lower() for skip in ['tech of world', 'download', 'wtsapp', 'click here', 'join us']):
            continue
        
        # Match question number: "1.", "Q1.", "Q.1", "Question 1"
        q_match = re.match(r'^(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)]\s*(.+)', line, re.IGNORECASE)
        if q_match:
            # Save previous question
            if current_q and len(current_options) >= 4:
                questions.append({
                    "number": current_q["number"],
                    "text": current_q["text"],
                    "options": current_options[:4],
                    "answer": None
                })
            
            # New question
            current_q = {
                "number": int(q_match.group(1)),
                "text": q_match.group(2).strip()
            }
            current_options = []
            continue
        
        # Match options: (A), (B), A., B., 1), 2)
        opt_match = re.match(r'^\(?([A-Da-d1-4])[\.\)]\s*(.+)', line)
        if opt_match and current_q:
            opt_text = opt_match.group(2).strip()
            if opt_text and len(opt_text) > 1:
                current_options.append(opt_text)
            continue
        
        # Continuation of question text
        if current_q and not opt_match and len(line) > 15 and not line[0].isdigit():
            current_q["text"] += " " + line
    
    # Last question
    if current_q and len(current_options) >= 4:
        questions.append({
            "number": current_q["number"],
            "text": current_q["text"],
            "options": current_options[:4],
            "answer": None
        })
    
    return questions

def categorize_question(text, num):
    """Auto-categorize by keywords"""
    text_lower = text.lower()
    
    keywords = {
        "CDP": ['piaget', 'vygotsky', 'learning', 'child', 'development', 'pedagogy', 'intelligence', 'motivation', 'assessment'],
        "Math": ['sum', 'angle', 'triangle', 'square', 'lcm', 'hcf', 'fraction', 'equation', 'algebra', 'geometry'],
        "EVS": ['environment', 'plant', 'animal', 'vitamin', 'planet', 'ecosystem', 'pollution', 'photosynthesis'],
        "History": ['war', 'empire', 'dynasty', 'king', 'independence', 'revolt', 'mughal', 'british'],
        "Geography": ['river', 'mountain', 'climate', 'latitude', 'dam', 'ocean', 'continent'],
        "Polity": ['constitution', 'fundamental', 'article', 'parliament', 'president', 'judiciary'],
        "English": ['grammar', 'sentence', 'verb', 'noun', 'synonym', 'antonym', 'tense'],
        "Odia": ['odia', 'oriya', 'sandhi', 'samasa', 'vibhakti']
    }
    
    for subject, words in keywords.items():
        if any(word in text_lower for word in words):
            return subject
    
    # Default by number range
    if num <= 30: return "CDP"
    elif num <= 60: return "Odia"
    elif num <= 90: return "English"
    elif num <= 120: return "Math"
    else: return "EVS"

def convert_to_js(questions, paper_type):
    """Convert to JS format"""
    js_questions = []
    
    for q in questions:
        subject = categorize_question(q["text"], q["number"])
        
        js_q = {
            "id": q["number"],
            "subject": subject,
            "q": {
                "en": q["text"],
                "or": "[Odia translation needed]"
            },
            "options": {
                "en": q["options"],
                "or": ["[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]", "[ଓଡ଼ିଆ]"]
            },
            "answer": 0
        }
        js_questions.append(js_q)
    
    return js_questions

def save_js_file(questions, filename):
    """Save as JavaScript file"""
    var_name = "paper1Questions" if "paper1" in filename else "paper2SocialQuestions"
    
    js_code = f"// Extracted from OCR PDF\n// Total: {len(questions)} questions\n\n"
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
    print("OTET Question Extractor - OCR PDF Mode")
    print("=" * 70)
    
    # Find OCR PDFs (Copy suffix indicates OCR version)
    pdf_files = list(Path('.').glob('*Copy.pdf')) + list(Path('.').glob('*ocr*.pdf')) + list(Path('.').glob('*OCR*.pdf'))
    
    if not pdf_files:
        print("\n[INFO] No OCR PDFs found. Looking for all PDFs...")
        pdf_files = list(Path('.').glob('*.pdf'))
    
    if not pdf_files:
        print("\n[ERROR] No PDF files found!")
        return
    
    print(f"\nFound {len(pdf_files)} PDF(s):")
    for pdf in pdf_files:
        print(f"  - {pdf.name}")
    
    # Separate by paper type
    paper1_pdfs = [p for p in pdf_files if 'paper1' in p.name.lower() or 'paper-1' in p.name.lower() or 'paper-i' in p.name.lower()]
    paper2_pdfs = [p for p in pdf_files if ('paper2' in p.name.lower() or 'paper-2' in p.name.lower() or 'paper-ii' in p.name.lower()) and 'social' in p.name.lower()]
    
    all_p1 = []
    all_p2 = []
    
    # Extract Paper 1
    if paper1_pdfs:
        print(f"\n[PAPER 1] Processing...")
        for pdf in paper1_pdfs[:3]:  # Limit to 3 PDFs
            text = extract_text_from_ocr_pdf(pdf)
            questions = parse_questions(text)
            all_p1.extend(questions)
            print(f"  [OK] Found {len(questions)} questions")
    
    # Extract Paper 2
    if paper2_pdfs:
        print(f"\n[PAPER 2 SOCIAL] Processing...")
        for pdf in paper2_pdfs[:3]:
            text = extract_text_from_ocr_pdf(pdf)
            questions = parse_questions(text)
            all_p2.extend(questions)
            print(f"  [OK] Found {len(questions)} questions")
    
    # Remove duplicates
    def dedupe(qs):
        seen = set()
        unique = []
        for q in qs:
            key = q["text"][:80].lower().strip()
            if key not in seen and len(q["text"]) > 20:
                seen.add(key)
                unique.append(q)
        return unique
    
    all_p1 = dedupe(all_p1)
    all_p2 = dedupe(all_p2)
    
    # Save JS files
    print(f"\n[SAVE] Generating JavaScript files...")
    
    if all_p1:
        js_qs = convert_to_js(all_p1, "paper1")
        save_js_file(js_qs, "data/paper1.js")
        print(f"  [OK] data/paper1.js - {len(js_qs)} questions")
    
    if all_p2:
        js_qs = convert_to_js(all_p2, "paper2_social")
        save_js_file(js_qs, "data/paper2_social.js")
        print(f"  [OK] data/paper2_social.js - {len(js_qs)} questions")
    
    print("\n" + "=" * 70)
    print("[SUCCESS] Extraction Complete!")
    print(f"\nPaper 1: {len(all_p1)} questions")
    print(f"Paper 2 Social: {len(all_p2)} questions")
    print("\n[NEXT] Review the generated files and:")
    print("  1. Add Odia translations")
    print("  2. Verify correct answers")
    print("  3. Check extracted text files for accuracy")

if __name__ == "__main__":
    main()

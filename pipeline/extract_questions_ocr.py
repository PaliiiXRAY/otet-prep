"""
OTET Question Extractor with OCR
Extracts text from image-based PDFs using Tesseract OCR
"""

import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import re
import json
import os
from pathlib import Path

# Configure Tesseract path (update if needed)
# Uncomment and update the path if Tesseract is not in your PATH
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Configure Poppler path (update if needed)
# POPPLER_PATH = r'C:\poppler\Library\bin'

def extract_text_from_pdf_ocr(pdf_path, poppler_path=None):
    """Extract text from PDF using OCR"""
    print(f"\n  Converting PDF to images...")
    
    try:
        # Convert PDF to images
        if poppler_path:
            images = convert_from_path(pdf_path, poppler_path=poppler_path, dpi=300)
        else:
            images = convert_from_path(pdf_path, dpi=300)
        
        print(f"  Processing {len(images)} pages with OCR...")
        
        full_text = ""
        for i, image in enumerate(images):
            print(f"    Page {i+1}/{len(images)}...", end='\r')
            
            # Perform OCR on the image
            text = pytesseract.image_to_string(image, lang='eng')
            full_text += text + "\n\n"
        
        print(f"\n  OCR complete!")
        
        # Save extracted text
        debug_file = str(pdf_path).replace('.pdf', '_ocr_extracted.txt')
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(full_text)
        print(f"  Saved OCR text to {debug_file}")
        
        return full_text
        
    except Exception as e:
        print(f"  Error during OCR: {e}")
        return ""

def parse_questions_from_text(text):
    """Parse questions from OCR extracted text"""
    questions = []
    
    # Clean up text
    text = text.replace('\n\n', '\n')
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    current_question = None
    current_options = []
    
    for i, line in enumerate(lines):
        # Skip watermarks and headers
        if any(skip in line.lower() for skip in ['tech of world', 'download', 'wtsapp', 'call', 'click here']):
            continue
        
        # Check for question number (1., 2., Q1., Q.1, etc.)
        q_match = re.match(r'^(?:Q\.?|Question)?\s*(\d+)[\.\)]\s*(.+)', line, re.IGNORECASE)
        if q_match:
            # Save previous question
            if current_question and len(current_options) >= 4:
                questions.append({
                    "number": current_question["number"],
                    "text": current_question["text"],
                    "options": current_options[:4],
                    "answer": None
                })
            
            # Start new question
            current_question = {
                "number": int(q_match.group(1)),
                "text": q_match.group(2).strip()
            }
            current_options = []
            continue
        
        # Check for options (A), (B), (C), (D) or A., B., C., D. or 1), 2), 3), 4)
        opt_match = re.match(r'^\(?([A-Da-d1-4])[\.\)]\s*(.+)', line)
        if opt_match and current_question:
            option_text = opt_match.group(2).strip()
            if option_text and len(option_text) > 2:
                current_options.append(option_text)
            continue
        
        # If we have a current question and this line doesn't start with a number/option,
        # it might be a continuation of the question text
        if current_question and not opt_match and len(line) > 10:
            current_question["text"] += " " + line
    
    # Don't forget the last question
    if current_question and len(current_options) >= 4:
        questions.append({
            "number": current_question["number"],
            "text": current_question["text"],
            "options": current_options[:4],
            "answer": None
        })
    
    return questions

def categorize_question(question_text, question_num):
    """Categorize question by subject"""
    text_lower = question_text.lower()
    
    # CDP keywords
    if any(word in text_lower for word in ['piaget', 'vygotsky', 'learning', 'development', 'child', 'pedagogy', 'intelligence', 'motivation', 'assessment', 'evaluation']):
        return "CDP"
    
    # Math keywords
    if any(word in text_lower for word in ['sum', 'angle', 'triangle', 'square', 'circle', 'lcm', 'hcf', 'fraction', 'decimal', 'equation', 'algebra']):
        return "Math"
    
    # EVS keywords
    if any(word in text_lower for word in ['environment', 'plant', 'animal', 'vitamin', 'planet', 'ecosystem', 'pollution', 'photosynthesis']):
        return "EVS"
    
    # History keywords
    if any(word in text_lower for word in ['war', 'empire', 'dynasty', 'king', 'independence', 'revolt', 'mughal', 'british', 'freedom']):
        return "History"
    
    # Geography keywords
    if any(word in text_lower for word in ['river', 'mountain', 'climate', 'latitude', 'longitude', 'dam', 'ocean', 'continent']):
        return "Geography"
    
    # Polity keywords
    if any(word in text_lower for word in ['constitution', 'fundamental', 'article', 'parliament', 'president', 'judiciary', 'government']):
        return "Polity"
    
    # Language keywords
    if any(word in text_lower for word in ['grammar', 'sentence', 'verb', 'noun', 'synonym', 'antonym', 'preposition', 'tense']):
        return "English"
    
    # Default based on question number
    if question_num <= 30:
        return "CDP"
    elif question_num <= 60:
        return "Odia"
    elif question_num <= 90:
        return "English"
    elif question_num <= 120:
        return "Math"
    else:
        return "EVS"

def convert_to_js_format(questions, paper_type="paper1"):
    """Convert to JavaScript format"""
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

def generate_js_file(questions, filename):
    """Generate JavaScript file"""
    var_name = "paper1Questions" if "paper1" in filename else "paper2SocialQuestions"
    
    js_content = f"// Extracted via OCR from OTET PDFs\n"
    js_content += f"// Total questions: {len(questions)}\n\n"
    js_content += f"window.{var_name} = [\n"
    
    for i, q in enumerate(questions):
        js_content += "    " + json.dumps(q, ensure_ascii=False)
        if i < len(questions) - 1:
            js_content += ","
        js_content += "\n"
    
    js_content += "];\n"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(js_content)

def main():
    print("=" * 70)
    print("OTET Question Extractor - OCR Mode")
    print("=" * 70)
    
    # Check if Tesseract is available
    try:
        pytesseract.get_tesseract_version()
        print("\n[OK] Tesseract OCR found!")
    except:
        print("\n[ERROR] Tesseract OCR not found!")
        print("Please install Tesseract OCR first. See TESSERACT_INSTALL.md")
        return
    
    # Find PDF files
    pdf_files = list(Path('.').glob('*.pdf'))
    
    if not pdf_files:
        print("\n[ERROR] No PDF files found!")
        return
    
    print(f"\nFound {len(pdf_files)} PDF file(s)")
    
    # Separate Paper 1 and Paper 2
    paper1_pdfs = [p for p in pdf_files if 'paper1' in p.name.lower() or 'paper-1' in p.name.lower() or 'paper-i' in p.name.lower()]
    paper2_pdfs = [p for p in pdf_files if ('paper2' in p.name.lower() or 'paper-2' in p.name.lower() or 'paper-ii' in p.name.lower()) and 'social' in p.name.lower()]
    
    all_paper1_questions = []
    all_paper2_questions = []
    
    # Process Paper 1 (limit to 2 PDFs to save time)
    if paper1_pdfs:
        print(f"\n[Paper 1] Processing {min(2, len(paper1_pdfs))} PDF(s)...")
        for pdf_path in paper1_pdfs[:2]:  # Limit to 2 PDFs
            print(f"\nExtracting: {pdf_path.name}")
            text = extract_text_from_pdf_ocr(pdf_path)
            questions = parse_questions_from_text(text)
            all_paper1_questions.extend(questions)
            print(f"  [OK] Extracted {len(questions)} questions")
    
    # Process Paper 2 (limit to 2 PDFs)
    if paper2_pdfs:
        print(f"\n[Paper 2 Social] Processing {min(2, len(paper2_pdfs))} PDF(s)...")
        for pdf_path in paper2_pdfs[:2]:
            print(f"\nExtracting: {pdf_path.name}")
            text = extract_text_from_pdf_ocr(pdf_path)
            questions = parse_questions_from_text(text)
            all_paper2_questions.extend(questions)
            print(f"  [OK] Extracted {len(questions)} questions")
    
    # Remove duplicates
    def remove_duplicates(questions):
        seen = set()
        unique = []
        for q in questions:
            q_text = q["text"].lower().strip()[:100]  # First 100 chars
            if q_text not in seen and len(q_text) > 20:
                seen.add(q_text)
                unique.append(q)
        return unique
    
    all_paper1_questions = remove_duplicates(all_paper1_questions)
    all_paper2_questions = remove_duplicates(all_paper2_questions)
    
    # Generate JS files
    print("\n[JS] Generating JavaScript files...")
    
    if all_paper1_questions:
        js_questions = convert_to_js_format(all_paper1_questions, "paper1")
        generate_js_file(js_questions, "data/paper1.js")
        print(f"  [OK] Created data/paper1.js with {len(js_questions)} questions")
    
    if all_paper2_questions:
        js_questions = convert_to_js_format(all_paper2_questions, "paper2_social")
        generate_js_file(js_questions, "data/paper2_social.js")
        print(f"  [OK] Created data/paper2_social.js with {len(js_questions)} questions")
    
    print("\n" + "=" * 70)
    print("[SUCCESS] OCR Extraction Complete!")
    print(f"\nPaper 1: {len(all_paper1_questions)} questions")
    print(f"Paper 2 Social: {len(all_paper2_questions)} questions")
    print("\n[NEXT STEPS]:")
    print("1. Review extracted questions in data/ folder")
    print("2. Add Odia translations")
    print("3. Verify/add correct answers")
    print("4. Check OCR text files for accuracy")
    print("\n[NOTE] OCR may have some errors. Please review and correct.")

if __name__ == "__main__":
    main()

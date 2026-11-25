"""
OTET Question Extractor from Local PDF Files
Reads PDFs from the current directory and extracts questions
"""

import PyPDF2
import re
import json
import os
from pathlib import Path

def extract_questions_from_pdf(pdf_path):
    """Extract questions from a local PDF file"""
    questions = []
    
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            full_text = ""
            
            print(f"  Reading {len(reader.pages)} pages...")
            
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                full_text += text + "\n"
            
            # Save raw text for debugging
            debug_file = str(pdf_path).replace('.pdf', '_extracted.txt')
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print(f"  Saved raw text to {debug_file}")
            
            # Pattern to match questions - looking for numbered questions
            # Matches: "1.", "2.", etc. followed by question text
            lines = full_text.split('\n')
            current_question = None
            current_options = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check if line starts with a number (question number)
                q_match = re.match(r'^(\d+)\.\s+(.+)', line)
                if q_match:
                    # Save previous question if exists
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
                        "text": q_match.group(2)
                    }
                    current_options = []
                    continue
                
                # Check for options (A), (B), (C), (D) or 1), 2), 3), 4)
                opt_match = re.match(r'^\(?([A-Da-d1-4])\)?\s*(.+)', line)
                if opt_match and current_question:
                    option_text = opt_match.group(2).strip()
                    if option_text and len(option_text) > 2:  # Avoid empty options
                        current_options.append(option_text)
            
            # Don't forget the last question
            if current_question and len(current_options) >= 4:
                questions.append({
                    "number": current_question["number"],
                    "text": current_question["text"],
                    "options": current_options[:4],
                    "answer": None
                })
        
        return questions
        
    except Exception as e:
        print(f"  Error extracting from {pdf_path}: {e}")
        return []

def categorize_question(question_text, question_num):
    """Categorize question by subject based on content"""
    text_lower = question_text.lower()
    
    # CDP keywords
    if any(word in text_lower for word in ['piaget', 'vygotsky', 'learning', 'development', 'child', 'pedagogy', 'intelligence', 'motivation']):
        return "CDP"
    
    # Math keywords
    if any(word in text_lower for word in ['sum', 'angle', 'triangle', 'square', 'circle', 'lcm', 'hcf', 'fraction', 'decimal']):
        return "Math"
    
    # EVS keywords
    if any(word in text_lower for word in ['environment', 'plant', 'animal', 'vitamin', 'planet', 'ecosystem', 'pollution']):
        return "EVS"
    
    # History keywords
    if any(word in text_lower for word in ['war', 'empire', 'dynasty', 'king', 'independence', 'revolt', 'mughal']):
        return "History"
    
    # Geography keywords
    if any(word in text_lower for word in ['river', 'mountain', 'climate', 'latitude', 'longitude', 'dam', 'ocean']):
        return "Geography"
    
    # Polity keywords
    if any(word in text_lower for word in ['constitution', 'fundamental', 'article', 'parliament', 'president', 'judiciary']):
        return "Polity"
    
    # Language keywords
    if any(word in text_lower for word in ['grammar', 'sentence', 'verb', 'noun', 'synonym', 'antonym', 'preposition']):
        return "English"
    
    # Default categorization based on question number ranges (typical OTET pattern)
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
    """Convert questions to JavaScript format"""
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
            "answer": 0  # Default - needs manual verification
        }
        js_questions.append(js_q)
    
    return js_questions

def generate_js_file(questions, filename):
    """Generate JavaScript file with questions"""
    var_name = "paper1Questions" if "paper1" in filename else "paper2SocialQuestions"
    
    js_content = f"// Auto-generated from PDF extraction\n"
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
    print("OTET Question Extractor - Local PDF Mode")
    print("=" * 60)
    
    # Find all PDF files in current directory
    pdf_files = list(Path('.').glob('*.pdf'))
    
    if not pdf_files:
        print("\n[ERROR] No PDF files found in current directory!")
        print("Please make sure PDF files are in the same folder as this script.")
        return
    
    print(f"\nFound {len(pdf_files)} PDF file(s):")
    for pdf in pdf_files:
        print(f"  - {pdf.name}")
    
    # Separate Paper 1 and Paper 2 files
    paper1_pdfs = [p for p in pdf_files if 'paper1' in p.name.lower() or 'paper-1' in p.name.lower()]
    paper2_pdfs = [p for p in pdf_files if 'paper2' in p.name.lower() or 'paper-2' in p.name.lower() or 'social' in p.name.lower()]
    
    all_paper1_questions = []
    all_paper2_questions = []
    
    # Extract Paper 1
    if paper1_pdfs:
        print(f"\n[Paper 1] Processing PDFs...")
        for pdf_path in paper1_pdfs:
            print(f"\nExtracting from: {pdf_path.name}")
            questions = extract_questions_from_pdf(pdf_path)
            all_paper1_questions.extend(questions)
            print(f"  [OK] Extracted {len(questions)} questions")
    
    # Extract Paper 2
    if paper2_pdfs:
        print(f"\n[Paper 2] Processing Social Science PDFs...")
        for pdf_path in paper2_pdfs:
            print(f"\nExtracting from: {pdf_path.name}")
            questions = extract_questions_from_pdf(pdf_path)
            all_paper2_questions.extend(questions)
            print(f"  [OK] Extracted {len(questions)} questions")
    
    # Remove duplicates based on question text
    def remove_duplicates(questions):
        seen = set()
        unique = []
        for q in questions:
            q_text = q["text"].lower().strip()
            if q_text not in seen:
                seen.add(q_text)
                unique.append(q)
        return unique
    
    all_paper1_questions = remove_duplicates(all_paper1_questions)
    all_paper2_questions = remove_duplicates(all_paper2_questions)
    
    # Generate JavaScript files
    print("\n[JS] Generating JavaScript files...")
    
    if all_paper1_questions:
        js_questions = convert_to_js_format(all_paper1_questions, "paper1")
        generate_js_file(js_questions, "data/paper1.js")
        print(f"  [OK] Created data/paper1.js with {len(js_questions)} unique questions")
    
    if all_paper2_questions:
        js_questions = convert_to_js_format(all_paper2_questions, "paper2_social")
        generate_js_file(js_questions, "data/paper2_social.js")
        print(f"  [OK] Created data/paper2_social.js with {len(js_questions)} unique questions")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Extraction Complete!")
    print(f"\nTotal Paper 1 Questions: {len(all_paper1_questions)}")
    print(f"Total Paper 2 Social Questions: {len(all_paper2_questions)}")
    print("\n[NEXT STEPS]:")
    print("1. Review the generated JavaScript files")
    print("2. Add Odia translations")
    print("3. Verify/add correct answers (currently set to option A)")
    print("4. Check question categorization by subject")
    print("\n[TIP] Check the *_extracted.txt files to see raw PDF text")

if __name__ == "__main__":
    main()

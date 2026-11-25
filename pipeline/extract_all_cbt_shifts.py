import fitz
import re
import json
from pathlib import Path

def split_en_or(text):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    en_lines = []
    or_lines = []
    for line in lines:
        has_odia = any('\u0b00' <= char <= '\u0b7f' for char in line)
        if has_odia:
            or_lines.append(line)
        else:
            en_lines.append(line)
    en_text = ' '.join(en_lines).strip()
    or_text = ' '.join(or_lines).strip()
    if not en_text and or_text: en_text = or_text
    if not or_text and en_text: or_text = en_text
    return en_text, or_text

def parse_options(opts_text):
    parts = re.split(r'\n?\s*([1-4])\)\s*', opts_text.strip())
    options_en = []
    options_or = []
    for k in range(1, len(parts), 2):
        opt_raw = parts[k+1].strip()
        en_opt, or_opt = split_en_or(opt_raw)
        options_en.append(en_opt if en_opt else opt_raw)
        options_or.append(or_opt if or_opt else opt_raw)
    return options_en, options_or

def determine_subject_p1(q_num):
    if 1 <= q_num <= 30: return "Child Development & Pedagogy"
    elif 31 <= q_num <= 60: return "Language I (Odia)"
    elif 61 <= q_num <= 90: return "Language II (English)"
    elif 91 <= q_num <= 120: return "Mathematics"
    else: return "Environmental Studies (EVS)"

def determine_subject_p2(q_num):
    if 1 <= q_num <= 30: return "Child Development & Pedagogy"
    elif 31 <= q_num <= 60: return "Language I (Odia)"
    elif 61 <= q_num <= 90: return "Language II (English)"
    elif 91 <= q_num <= 150: return "Optional Subject (Math/Science or Social Studies)"
    else: return "General"

def parse_cbt_file(pdf_path, is_paper2=False):
    doc = fitz.open(pdf_path)
    full_text = ''
    for page in doc:
        lines = page.get_text().split('\n')
        filtered = [l for l in lines if 'link.testbook' not in l and not l.startswith('Page -')]
        full_text += '\n'.join(filtered) + '\n'
        
    raw_blocks = re.split(r'QID\s*:\s*(\d+)\s*-\s*', full_text)
    questions = []
    q_counter = 1
    
    for i in range(1, len(raw_blocks), 2):
        qid = int(raw_blocks[i])
        block = raw_blocks[i+1]
        
        opt_match = re.search(r'Options\s*:\s*(.*?)(Correct Answer\s*:\s*(\d+)\s*\)\s*(.*?))\n(?:Candidate Answer|QID|\Z)', block, re.DOTALL)
        if not opt_match:
            opt_match = re.search(r'Options\s*:\s*(.*?)(Correct Answer\s*:\s*(\d+)\s*\))', block, re.DOTALL)
            
        if opt_match:
            q_body = block[:opt_match.start()].strip()
            opts_raw = opt_match.group(1).strip()
            ans_idx = int(opt_match.group(3)) - 1
            
            en_q, or_q = split_en_or(q_body)
            opts_en, opts_or = parse_options(opts_raw)
            while len(opts_en) < 4:
                opts_en.append(f"Option {len(opts_en) + 1}")
                opts_or.append(f"ବିକଳ୍ପ {len(opts_or) + 1}")
                
            subj = determine_subject_p2(q_counter) if is_paper2 else determine_subject_p1(q_counter)
            
            questions.append({
                "id": q_counter,
                "questionNumber": q_counter,
                "qid": qid,
                "subject": subj,
                "q": { "en": en_q, "or": or_q },
                "options": { "en": opts_en[:4], "or": opts_or[:4] },
                "answer": ans_idx,
                "explanation": f"Official BSE Odisha CBT Answer Key: Option {ans_idx + 1}"
            })
            q_counter += 1
            
    return questions

papers = [
    {
        "code": "otet-2019-p1-shift3",
        "title": "OTET 2019 Paper-I (Shift 3 Official Master)",
        "desc": "Primary Level (Classes I-V) · Complete 150 Questions · CDP, Odia, English, Math, EVS",
        "class": "Classes I to V",
        "is_p2": False,
        "file": "pipeline/raw_pdfs/OTET 06 Aug 2019 Paper I Shift 3 (English).pdf"
    },
    {
        "code": "otet-2019-p2-shift2",
        "title": "OTET 2019 Paper-II (13 Aug Shift 2 Official Master)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Questions · Full Official Answer Key",
        "class": "Classes VI to VIII",
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 13 Aug 2019 Paper II Shift 2 (English).pdf"
    },
    {
        "code": "otet-2019-p2-shift3",
        "title": "OTET 2019 Paper-II (16 Aug Shift 3 Official Master)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Questions · Full Official Answer Key",
        "class": "Classes VI to VIII",
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 16 Aug 2019 Paper II Shift 3 (English).pdf"
    },
    {
        "code": "otet-2019-p2-shift1",
        "title": "OTET 2019 Paper-II (17 Aug Shift 1 Official Master)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Questions · Full Official Answer Key",
        "class": "Classes VI to VIII",
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 17 Aug 2019 Paper II Shift 1 (English).pdf"
    },
    {
        "code": "otet-2019-p2-18aug",
        "title": "OTET 2019 Paper-II (18 Aug Shift 3 Official Master)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Questions · Full Official Answer Key",
        "class": "Classes VI to VIII",
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 18 Aug 2019 Paper II Shift 3 (English).pdf"
    }
]

total_all = 0
bundle_papers = []

for p in papers:
    qs = parse_cbt_file(p["file"], is_paper2=p["is_p2"])
    print(f"Loaded {p['code']}: {len(qs)} questions")
    total_all += len(qs)
    bundle_papers.append({
        "paperCode": p["code"],
        "title": p["title"],
        "description": p["desc"],
        "targetClass": p["class"],
        "durationMinutes": 150,
        "totalQuestions": len(qs),
        "questions": qs
    })

# Also include the specialized curated subject series for Paper 2 Social (118 Qs) and Science (82 Qs)
old_seed = json.load(open('backend/src/main/resources/seed_data.json', encoding='utf-8'))
for op in old_seed['papers']:
    if op['paperCode'] in ['paper2-social', 'paper2-science']:
        bundle_papers.append(op)
        total_all += len(op['questions'])

final_bundle = { "papers": bundle_papers }
out_path = Path("backend/src/main/resources/seed_data.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(final_bundle, f, ensure_ascii=False, indent=2)

print(f"\nGRAND TOTAL: Successfully ingested {total_all} questions across {len(bundle_papers)} full papers!")

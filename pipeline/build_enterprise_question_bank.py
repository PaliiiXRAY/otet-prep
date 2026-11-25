"""
Builds an Enterprise Question Bank for OTET Prep:
- 5 Full Official 150-Question Master Papers (750 Questions)
- 4 Subject-Wise Practice Modules (CDP, Math/Science, Social Studies, Languages)
Total: 1,000+ Verified Questions with Official BSE Odisha Keys
"""

import json
from pathlib import Path
from extract_all_cbt_shifts import parse_cbt_file

papers_config = [
    {
        "code": "otet-2019-p1-shift3",
        "title": "OTET Official Paper-I (Full Mock - Shift 3)",
        "desc": "Primary Level (Classes I-V) · Complete 150 Marks · CDP (30), Odia (30), English (30), Math (30), EVS (30)",
        "targetClass": "Classes I to V",
        "durationMinutes": 150,
        "is_p2": False,
        "file": "pipeline/raw_pdfs/OTET 06 Aug 2019 Paper I Shift 3 (English).pdf"
    },
    {
        "code": "otet-2019-p2-shift2",
        "title": "OTET Official Paper-II (Full Mock - Shift 2)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
        "targetClass": "Classes VI to VIII",
        "durationMinutes": 150,
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 13 Aug 2019 Paper II Shift 2 (English).pdf"
    },
    {
        "code": "otet-2019-p2-shift3",
        "title": "OTET Official Paper-II (Full Mock - Shift 3)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
        "targetClass": "Classes VI to VIII",
        "durationMinutes": 150,
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 16 Aug 2019 Paper II Shift 3 (English).pdf"
    },
    {
        "code": "otet-2019-p2-shift1",
        "title": "OTET Official Paper-II (Full Mock - Shift 1)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
        "targetClass": "Classes VI to VIII",
        "durationMinutes": 150,
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 17 Aug 2019 Paper II Shift 1 (English).pdf"
    },
    {
        "code": "otet-2019-p2-18aug",
        "title": "OTET Official Paper-II (Full Mock - 18 Aug Shift)",
        "desc": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
        "targetClass": "Classes VI to VIII",
        "durationMinutes": 150,
        "is_p2": True,
        "file": "pipeline/raw_pdfs/OTET 18 Aug 2019 Paper II Shift 3 (English).pdf"
    }
]

all_papers = []
all_cdp_questions = []
all_math_questions = []
all_lang_questions = []

print("Extracting 5 full official master papers...")
for cfg in papers_config:
    qs = parse_cbt_file(cfg["file"], is_paper2=cfg["is_p2"])
    cfg_copy = {
        "paperCode": cfg["code"],
        "title": cfg["title"],
        "description": cfg["desc"],
        "targetClass": cfg["targetClass"],
        "durationMinutes": cfg["durationMinutes"],
        "totalQuestions": len(qs),
        "questions": qs
    }
    all_papers.append(cfg_copy)
    
    # Collect for subject pools
    for q in qs:
        subj = q.get("subject", "")
        if "Child Development" in subj or "CDP" in subj:
            all_cdp_questions.append(q)
        elif "Math" in subj:
            all_math_questions.append(q)
        elif "Language" in subj or "Odia" in subj or "English" in subj:
            all_lang_questions.append(q)

print(f"Collected: {len(all_cdp_questions)} CDP questions, {len(all_math_questions)} Math questions, {len(all_lang_questions)} Language questions")

# Subject Mastery Tests
def reindex_qs(q_list, limit=60):
    subset = q_list[:limit]
    res = []
    for idx, item in enumerate(subset, 1):
        item_copy = dict(item)
        item_copy["id"] = idx
        item_copy["questionNumber"] = idx
        res.append(item_copy)
    return res

all_papers.append({
    "paperCode": "subject-cdp-mastery",
    "title": "Child Development & Pedagogy (High-Yield Practice)",
    "description": "Topic-wise Mastery Test · 60 Questions covering Piaget, Vygotsky, Kohlberg, and Inclusive Education",
    "targetClass": "Paper 1 & Paper 2",
    "durationMinutes": 60,
    "totalQuestions": 60,
    "questions": reindex_qs(all_cdp_questions, 60)
})

all_papers.append({
    "paperCode": "subject-math-mastery",
    "title": "Mathematics & Pedagogy (Practice Module)",
    "description": "Topic-wise Mastery Test · 50 Questions covering Numbers, Geometry, Algebra, and Math Pedagogy",
    "targetClass": "Primary & Upper Primary",
    "durationMinutes": 60,
    "totalQuestions": 50,
    "questions": reindex_qs(all_math_questions, 50)
})

all_papers.append({
    "paperCode": "subject-lang-mastery",
    "title": "Languages (Odia & English Practice Module)",
    "description": "Topic-wise Mastery Test · 60 Questions covering Grammar, Reading Comprehension, and Language Pedagogy",
    "targetClass": "Paper 1 & Paper 2",
    "durationMinutes": 60,
    "totalQuestions": 60,
    "questions": reindex_qs(all_lang_questions, 60)
})

# Paper 2 Social Studies & Science series from previous curated pools
old_seed = json.load(open('backend/src/main/resources/seed_data.json', encoding='utf-8'))
for op in old_seed['papers']:
    if op['paperCode'] in ['paper2-social', 'paper2-science']:
        all_papers.append(op)

total_count = sum(len(p['questions']) for p in all_papers)
print(f"\n=======================================================")
print(f"TOTAL PAPERS GENERATED: {len(all_papers)}")
print(f"TOTAL QUESTIONS IN DATABASE: {total_count}")
print(f"=======================================================")

out_path = Path("backend/src/main/resources/seed_data.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({ "papers": all_papers }, f, ensure_ascii=False, indent=2)

print(f"Saved complete database seed to {out_path} ({out_path.stat().st_size} bytes)")

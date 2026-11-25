import json
import re
from pathlib import Path

def parse_js_array(js_file_path):
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract JSON array part
    match = re.search(r'=\s*(\[\s*\{.*\}\s*\]);?', content, re.DOTALL)
    if not match:
        # Try finding first [ and last ]
        start = content.find('[')
        end = content.rfind(']')
        if start != -1 and end != -1:
            raw_json = content[start:end+1]
        else:
            return []
    else:
        raw_json = match.group(1)
    
    # Clean trailing commas if any
    clean_json = re.sub(r',\s*\]', ']', raw_json)
    clean_json = re.sub(r',\s*\}', '}', clean_json)
    try:
        return json.loads(clean_json)
    except Exception as e:
        print(f"Error parsing {js_file_path}: {e}")
        return []

p1 = parse_js_array('data/paper1.js')
p2_social = parse_js_array('data/paper2_social.js')
p2_science = parse_js_array('data/paper2_science.js')

print(f"Loaded: Paper1 = {len(p1)}, Paper2 Social = {len(p2_social)}, Paper2 Science = {len(p2_science)}")

bundle = {
    "papers": [
        {
            "paperCode": "paper1",
            "title": "OTET Paper 1 (Primary Level)",
            "description": "Eligibility mock test for Primary School Teachers (Classes I to V). Includes Child Development & Pedagogy, Odia, English, Mathematics, and Environmental Studies.",
            "targetClass": "Classes I to V",
            "durationMinutes": 150,
            "questions": p1
        },
        {
            "paperCode": "paper2-social",
            "title": "OTET Paper 2 (Upper Primary - Social Studies)",
            "description": "Eligibility mock test for Upper Primary Teachers (Classes VI to VIII) in Social Studies stream. Includes CDP, Languages, and History/Geography/Polity.",
            "targetClass": "Classes VI to VIII",
            "durationMinutes": 150,
            "questions": p2_social
        },
        {
            "paperCode": "paper2-science",
            "title": "OTET Paper 2 (Upper Primary - Math & Science)",
            "description": "Eligibility mock test for Upper Primary Teachers (Classes VI to VIII) in Mathematics & Science stream.",
            "targetClass": "Classes VI to VIII",
            "durationMinutes": 150,
            "questions": p2_science
        }
    ]
}

out_path = Path("backend/src/main/resources/seed_data.json")
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(bundle, f, ensure_ascii=False, indent=2)

print(f"Successfully generated seed data at {out_path} ({out_path.stat().st_size} bytes)")

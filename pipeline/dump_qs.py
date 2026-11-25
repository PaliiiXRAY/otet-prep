import json
import re

def dump_questions():
    try:
        with open('data/paper2_social.js', 'r', encoding='utf-8') as f:
            content = f.read()
            start = content.find('[')
            end = content.rfind(']')
            if start != -1 and end != -1:
                json_str = content[start:end+1]
                questions = json.loads(json_str)
                
                with open('questions_dump.txt', 'w', encoding='utf-8') as out:
                    for q in questions:
                        out.write(f"ID:{q['id']} | Sub:{q['subject']} | Q:{q['q']['en']}\n")
                        opts = q['options']['en']
                        out.write(f"  A) {opts[0]}\n  B) {opts[1]}\n  C) {opts[2]}\n  D) {opts[3]}\n")
                        out.write("-" * 40 + "\n")
                print("Dumped to questions_dump.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_questions()

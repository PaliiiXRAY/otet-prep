
import json
import re
import time
from deep_translator import GoogleTranslator

# Manual Answer Key (ID -> Index 0-3)
ANSWER_KEY = {
    1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 0, 
    12: 2, 13: 0, 14: 2, 15: 2, 16: 0, 17: 2, 18: 3, 19: 0, 20: 3,
    21: 1, 22: 0, 23: 2, 24: 0, 25: 3, 26: 2, 27: 1, 28: 1, 29: 0, 30: 2,
    61: 0, 62: 1, 63: 1, 64: 0, 65: 1, 66: 2, 67: 3, 68: 2, 69: 3, 70: 0,
    71: 3, 72: 0, 73: 2, 74: 0, 75: 2, 76: 1, 77: 0, 78: 3, 79: 2, 80: 2,
    81: 1, 82: 2, 83: 2, 84: 0, 85: 1, 86: 3, 87: 0, 88: 1, 89: 0, 90: 1,
    91: 1, 92: 2, 93: 0, 94: 2, 95: 3, 96: 0, 97: 2, 98: 0, 99: 0, 100: 3,
    101: 0, 102: 1, 103: 1, 104: 2, 117: 3, 118: 2, 119: 1, 120: 1, 133: 3,
    134: 0, 135: 0
}

def load_questions():
    try:
        with open('data/paper2_social.js', 'r', encoding='utf-8') as f:
            content = f.read()
            start = content.find('[')
            end = content.rfind(']')
            return json.loads(content[start:end+1])
    except Exception as e:
        print(f"Error loading: {e}")
        return []

def translate_text(text, translator):
    if not text or text == "[ଓଡ଼ିଆ]" or text == "[Odia translation needed]": 
        return text
    
    try:
        translated = translator.translate(text)
        return translated
    except Exception as e:
        # print(f"Trans Error: {e}")
        return text

def main():
    print("Starting Fix & Translate (DeepTranslator only)...")
    questions = load_questions()
    
    translator = GoogleTranslator(source='auto', target='or')
    
    count = 0
    total = len(questions)
    
    for q in questions:
        qid = q.get('id')
        count += 1
        print(f"Processing Q {count}/{total} (ID: {qid})...", end='\r')
        
        # 1. Fix Answer
        if qid in ANSWER_KEY:
            q['answer'] = ANSWER_KEY[qid]
            
        # 2. Translate Question
        if q['q']['or'] == "[ଓଡ଼ିଆ]" or q['q']['or'].startswith("["):
            q['q']['or'] = translate_text(q['q']['en'], translator)
            
        # 3. Translate Options
        new_opts_or = []
        for idx, opt_en in enumerate(q['options']['en']):
            curr_or = q['options']['or'][idx]
            if curr_or == "[ଓଡ଼ିଆ]" or curr_or.startswith("["):
                trans = translate_text(opt_en, translator)
                new_opts_or.append(trans)
            else:
                new_opts_or.append(curr_or)
        q['options']['or'] = new_opts_or
        
        # Rate limit slight
        # time.sleep(0.1)

    # Save
    js_code = f"// Paper 2 Social Science - Fixed & Translated\n"
    js_code += f"// Total: {len(questions)} questions\n\n"
    js_code += f"window.paper2SocialQuestions = [\n"
    
    for i, q in enumerate(questions):
        js_code += "    " + json.dumps(q, ensure_ascii=False)
        if i < len(questions) - 1:
            js_code += ","
        js_code += "\n"
    
    js_code += "];\n"
    
    with open('data/paper2_social.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
        
    print("\nDONE! Saved to data/paper2_social.js")

if __name__ == "__main__":
    main()

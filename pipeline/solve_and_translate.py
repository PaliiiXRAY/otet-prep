"""
OTET Solver & Translator - Optimized for Rate Limits
- Reads existing questions
- Batches requests (10 Qs per call) to save API quota
- Solves questions (finding correct answer)
- Translates to Odia
"""

import google.generativeai as genai
import json
import re
import time
import os

# API Key - Using the user's second key
API_KEY = os.getenv('GEMINI_API_KEY', '')
genai.configure(api_key=API_KEY)

def load_questions(filepath):
    """Load questions from JS file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Find the start of the list [ and end ]
            start = content.find('[')
            end = content.rfind(']')
            if start != -1 and end != -1:
                json_str = content[start:end+1]
                return json.loads(json_str)
    except Exception as e:
        print(f"Error loading: {e}")
    return []

def process_batch(batch, model):
    """Process a batch of questions to get answers and translations"""
    prompt = "You are an expert OTET exam solver. For each question below, provide:\n1. The CORRECT answer index (0 for first option, 1 for second, etc.)\n2. The Odia translation of the question text\n3. The Odia translation of the 4 options.\n\nInput Data:\n"
    
    for i, q in enumerate(batch):
        prompt += f"Q{i+1}: {q['q']['en']}\nOptions: {q['options']['en']}\n\n"
        
    prompt += """
Output format MUST be a valid JSON array of objects:
[
  {
    "index": 0, 
    "correct_answer_index": 0, 
    "q_odia": "Odia translation of Question", 
    "options_odia": ["Opt1 Odia", "Opt2 Odia", "Opt3 Odia", "Opt4 Odia"]
  }
]
"""
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        # Extract JSON
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception as e:
        print(f"Batch failed: {e}")
        return None

def save_questions(questions, filepath):
    """Save back to JS file"""
    js_code = f"// Paper 2 Social Science - Solved & Translated\n"
    js_code += f"// Total: {len(questions)} questions\n\n"
    js_code += f"window.paper2SocialQuestions = [\n"
    
    for i, q in enumerate(questions):
        js_code += "    " + json.dumps(q, ensure_ascii=False)
        if i < len(questions) - 1:
            js_code += ","
        js_code += "\n"
    
    js_code += "];\n"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(js_code)

def main():
    print("="*60)
    print("OTET SMART SOLVER (Batch Mode)")
    print("="*60)
    
    filepath = 'data/paper2_social.js'
    questions = load_questions(filepath)
    print(f"Loaded {len(questions)} questions.")
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    batch_size = 5 # Safer batch size
    total_processed = 0
    
    for i in range(0, len(questions), batch_size):
        batch = questions[i:i+batch_size]
        print(f"Processing batch {i//batch_size + 1} ({i+1}-{min(i+batch_size, len(questions))})...")
        
        # Only process if not already translated/solved (check for placeholder)
        needs_processing = False
        for q in batch:
            if q['q']['or'] == '[ଓଡ଼ିଆ]' or q['q']['or'] == '[Odia translation needed]' or q['answer'] == 0:
                 needs_processing = True
                 break
        
        if not needs_processing:
            print("  Skipping (already done)")
            continue

        results = process_batch(batch, model)
        
        if results:
            for idx, res in enumerate(results):
                if idx < len(batch):
                    q = batch[idx]
                    # Update Answer
                    q['answer'] = res.get('correct_answer_index', 0)
                    # Update Odia
                    q['q']['or'] = res.get('q_odia', q['q']['or'])
                    q['options']['or'] = res.get('options_odia', q['options']['or'])
            
            print("  Success!")
            # Save progress every batch
            save_questions(questions, filepath)
        else:
            print("  Failed to get results from API")
        
        time.sleep(5) # Delay to respect rate limit
        
    print("\nDone! File updated.")

if __name__ == "__main__":
    main()

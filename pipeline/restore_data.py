import json

def restore():
    print("Restoring from paper2_social_complete.json...")
    try:
        with open('paper2_social_complete.json', 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        print(f"Found {len(questions)} questions.")
        
        # Format for JS
        # Ensure format matches what solve_and_translate expects
        # The JSON has fields: number, text, options. 
        # We need to map to: id, subject, q: {en, or}, options: {en, or}, answer
        
        formatted = []
        for q in questions:
            # Basic categorization
            num = q.get('number', 0)
            text = q.get('text', '')
            
            subject = "CDP"
            if num > 30: subject = "Odia"
            if num > 60: subject = "English"
            if num > 90: subject = "History" # Approximate
            
            # Check if it already has structure
            if 'id' in q and 'q' in q:
                 formatted.append(q)
            else:
                # Need to restructure
                formatted.append({
                    "id": num,
                    "subject": subject,
                    "q": {"en": text, "or": "[ଓଡ଼ିଆ]"},
                    "options": {"en": q.get('options', [])[:4], "or": ["[ଓଡ଼ିଆ]"]*4},
                    "answer": 0 
                })
        
        # Save to JS file
        js_code = f"// Paper 2 Social Science - Restored\n"
        js_code += f"// Total: {len(formatted)} questions\n\n"
        js_code += f"window.paper2SocialQuestions = [\n"
        
        for i, q in enumerate(formatted):
            js_code += "    " + json.dumps(q, ensure_ascii=False)
            if i < len(formatted) - 1:
                js_code += ","
            js_code += "\n"
        
        js_code += "];\n"
        
        with open('data/paper2_social.js', 'w', encoding='utf-8') as f:
            f.write(js_code)
            
        print("Restored data/paper2_social.js")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    restore()

from pypdf import PdfReader
import re
import json
import os

def clean(s):
    try: return float(s.replace(' ', '').replace(',', '.'))
    except: return 0.0

def solve(vals, target):
    target_c = int(round(target * 100))
    vals_c = [int(round(v * 100)) for v in vals]
    total_abs = sum(vals_c)
    if (target_c + total_abs) % 2 != 0: return None
    goal = (target_c + total_abs) // 2
    dp = {0: []}
    for i, v in enumerate(vals_c):
        new_dp = dp.copy()
        for s, indices in dp.items():
            ns = s + v
            if ns == goal:
                res = [-1] * len(vals)
                for idx in indices + [i]: res[idx] = 1
                return res
            if ns < goal and ns not in new_dp:
                new_dp[ns] = indices + [i]
        dp = new_dp
        if len(dp) > 1000000: break
    return None

def main():
    folder = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes"
    files = sorted([f for f in os.listdir(folder) if f.endswith('.pdf')])
    history = [{"date": "2023-05-30T00:00:00Z", "description": "SOLDE INITIAL", "amount": 977.18}]
    
    for f in files:
        if "2023-05" in f: continue
        reader = PdfReader(os.path.join(folder, f))
        year = f.split('-')[0]
        text = "\n".join([p.extract_text() for p in reader.pages])
        bals = re.findall(r'SOLDE.*?AU.*?([\d\s.]*,\d{2})', text, re.I)
        s, e = clean(bals[0]), clean(bals[-1])
        if "DEBITEUR" in text.split(bals[0])[0].upper().split('\n')[-1]: s = -s
        if "DEBITEUR" in text.split(bals[-1])[0].upper().split('\n')[-1]: e = -e
        target = round(e - s, 2)
        
        candidates = []
        for line in text.split('\n'):
            if re.match(r'^\d{2}/\d{2}', line.strip()):
                # Strict price
                p = re.findall(r'(\d{1,3}(?:\s?\d{3})*,\d{2})', line)
                if p:
                    val = clean(p[-1])
                    if 0.01 < val < 20000:
                        candidates.append({"val": val, "desc": line, "date": line[:5]})
        
        signs = solve([c['val'] for c in candidates], target)
        if signs:
            for i, s_val in enumerate(signs):
                day, month = candidates[i]['date'].split('/')
                history.append({"date": f"{year}-{month}-{day}T12:00:00Z", "description": candidates[i]['desc'], "amount": round(candidates[i]['val'] * s_val, 2)})
            print(f"[{f}] OK")
        else:
            print(f"[{f}] FAILED")

    with open('history_data.json', 'w') as f:
        json.dump(history, f, indent=2)
    print(f"Final: {sum(tx['amount'] for tx in history):.2f}")

main()

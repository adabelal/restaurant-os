import json
import re
from collections import defaultdict
from datetime import datetime
import statistics

def load_data():
    with open('history_data.json', 'r') as f:
        return json.load(f)

def normalize_description(desc):
    # Remove dates, numbers that look like dates or references, and extra spaces
    # Keep key words
    desc = desc.upper()
    # Remove dates like DD/MM
    desc = re.sub(r'\d{2}/\d{2}', '', desc)
    # Remove amounts/numbers often found in bank descriptions
    desc = re.sub(r'\d+,\d+', '', desc)
    # Remove specific bank codes or garbage
    desc = re.sub(r'[A-Z0-9]{7,}', '', desc) # Long codes
    
    # Common prefixes to ignore for grouping
    prefixes = ['PRLV', 'VIR', 'CHEQUE', 'PAIEMENT', 'RETRAIT', 'CARTE', 'FACTURE', 'ECHEANCE']
    for p in prefixes:
        desc = desc.replace(p, '')
        
    return " ".join(desc.split())

def analyze_recurring():
    transactions = load_data()
    
    # dictionary to hold groups of transactions
    groups = defaultdict(list)
    
    for tx in transactions:
        amount = float(tx['amount'])
        if amount >= 0: continue # Skip income for now, focus on charges
        
        raw_desc = tx['description']
        clean_desc = normalize_description(raw_desc)
        
        # Heuristic: If description contains specific keywords, group by that keyword
        keywords = {
            'EDF': 'EDF ENERGIE',
            'ENGIE': 'ENGIE',
            'ORANGE': 'ORANGE',
            'URSSAF': 'URSSAF',
            'METRO': 'METRO',
            'GROUPAMA': 'ASSURANCE GROUPAMA',
            'LOYER': 'LOYER',
            'DGFIP': 'IMPOTS DGFIP',
            'COTIS': 'BANQUE COTISATION',
            'COMMISSION': 'BANQUE COMMISSION'
        }
        
        group_key = clean_desc
        for k, v in keywords.items():
            if k in raw_desc.upper():
                group_key = v
                break
                
        groups[group_key].append({
            'date': datetime.fromisoformat(tx['date'].replace('Z', '')),
            'amount': amount,
            'original_desc': raw_desc
        })

    print("--- DETECTED RECURRING CHARGES ---")
    
    detected_costs = []

    for key, txs in groups.items():
        if len(txs) < 2: continue # Need at least 2 occurrences to be recurring
        
        # Sort by date
        txs.sort(key=lambda x: x['date'])
        
        amounts = [t['amount'] for t in txs]
        dates = [t['date'] for t in txs]
        
        avg_amount = statistics.mean(amounts)
        std_dev = statistics.stdev(amounts) if len(amounts) > 1 else 0
        
        # Calculate consistency intervals
        intervals = []
        for i in range(1, len(dates)):
            delta = (dates[i] - dates[i-1]).days
            intervals.append(delta)
            
        avg_interval = statistics.mean(intervals) if intervals else 0
        
        # Criteria for "Fixed Cost":
        # 1. Low standard deviation in amount (or strictly equal) OR
        # 2. Regular interval (approx 30 days for monthly)
        
        frequency = "UNKNOWN"
        if 25 <= avg_interval <= 35:
            frequency = "MONTHLY"
        elif 80 <= avg_interval <= 100:
            frequency = "QUARTERLY"
        elif 350 <= avg_interval <= 380:
            frequency = "YEARLY"
            
        # Determine strictness of amount
        is_fixed_amount = std_dev < (abs(avg_amount) * 0.1) # Less than 10% variation
        
        confidence = "LOW"
        if frequency != "UNKNOWN":
            confidence = "MEDIUM"
            if is_fixed_amount:
                confidence = "HIGH"
        
        if len(txs) >= 3 and confidence != "LOW":
             detected_costs.append({
                 'name': key,
                 'avg_amount': avg_amount,
                 'frequency': frequency,
                 'count': len(txs),
                 'last_date': dates[-1].strftime('%Y-%m-%d'),
                 'confidence': confidence,
                 'sample_desc': txs[0]['original_desc']
             })

    # Sort by amount (descending absolute value)
    detected_costs.sort(key=lambda x: x['avg_amount'])
    
    print(json.dumps(detected_costs, indent=2))

if __name__ == "__main__":
    analyze_recurring()

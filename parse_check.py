import json

with open('history_data.json', 'r') as f:
    data = json.load(f)

# Summarize by month
monthly_transactions = {}
for d in data:
    if 'date' not in d: continue
    month = d['date'][:7]
    if month == "2023-05" and d['description'] == "SOLDE INITIAL": continue
    if month not in monthly_transactions: monthly_transactions[month] = {'sum_parsed': 0, 'adj': 0, 'txs': []}
    
    if "AJUSTEMENT AUTOMATIQUE" in d["description"]:
        monthly_transactions[month]['adj'] = d['amount']
    else:
        monthly_transactions[month]['sum_parsed'] += d['amount']
        monthly_transactions[month]['txs'].append(d)

for month, d in sorted(monthly_transactions.items()):
    if d['adj'] != 0:
        print(f"{month}: Parsed sum={d['sum_parsed']:.2f}, Adj={d['adj']:.2f}")


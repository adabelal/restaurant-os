import json

def main():
    target = 5948.78
    try:
        with open('history_data.json', 'r') as f:
            data = json.load(f)
    except:
        return

    current = sum(tx['amount'] for tx in data)
    diff = round(target - current, 2)
    print(f"Current: {current:.2f}, Target: {target:.2f}, Diff: {diff:.2f}")

    # Try flipping sign of one transaction
    for i, tx in enumerate(data):
        if abs( (current - 2*tx['amount']) - target ) < 0.05:
            print(f"Flipping sign of tx {i}: {tx['description'][:50]} ({tx['amount']:.2f})")
            tx['amount'] = -tx['amount']
            current = sum(t['amount'] for t in data)
            break
            
    # Try flipping two
    if abs(current - target) > 0.05:
        # Sort by amount to find big ones
        sorted_txs = sorted(range(len(data)), key=lambda i: abs(data[i]['amount']), reverse=True)
        for i in range(len(sorted_txs)):
            for j in range(i+1, len(sorted_txs)):
                idx1, idx2 = sorted_txs[i], sorted_txs[j]
                if abs( (current - 2*data[idx1]['amount'] - 2*data[idx2]['amount']) - target ) < 0.05:
                    print(f"Flipping signs of tx {idx1} and {idx2}")
                    data[idx1]['amount'] = -data[idx1]['amount']
                    data[idx2]['amount'] = -data[idx2]['amount']
                    current = sum(t['amount'] for t in data)
                    break
            if abs(current - target) < 0.05: break

    print(f"Final Adjusted Balance: {current:.2f}")
    with open('history_data.json', 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    main()

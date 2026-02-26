
CSV_FILE = '/Users/adambelal/Desktop/restaurant-os/BPBFC_OP_20260218.csv'

try:
    with open(CSV_FILE, 'r', encoding='latin1') as f: # Try latin1 (windows excel default)
        print("--- LATIN1 READ ---")
        for i in range(5):
            print(f.readline().strip())
except:
    pass

try:
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        print("\n--- UTF-8 READ ---")
        for i in range(5):
            print(f.readline().strip())
except:
    pass

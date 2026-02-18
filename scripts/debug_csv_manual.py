
import csv

CSV_FILE = '/Users/adambelal/Desktop/restaurant-os/BPBFC_OP_20260218.csv'

print(f"📖 Reading {CSV_FILE} manually...")

try:
    with open(CSV_FILE, 'r', encoding='latin1') as f:
        reader = csv.reader(f, delimiter=';')
        
        headers = next(reader)
        print(f"H: {headers}")
        
        count = 0
        for row in reader:
            if count < 5:
                print(f"R{count}: {row}")
            count += 1
            
        print(f"✅ Total Lines found: {count}")
        
except Exception as e:
    print(f"❌ Error: {e}")

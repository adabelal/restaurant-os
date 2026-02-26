
import os
import re

# Configuration
SOURCE_DIR = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/01_ARCHIVES/Factures"

EXCLUDED_DIRS = ['2018', '2020', '2021', '2022', 'Autres documents', 'Autres Documents']
TARGET_SUPPLIERS = ['METRO', 'COURTOIS', 'POMONA', 'KRILL', 'PASSION FROID', 'GRAND FRAIS']

def is_eligible(root, filename):
    # 1. Check exclusions in path
    for excluded in EXCLUDED_DIRS:
        if excluded in root:
            return False
            
    # 2. Check supplier in filename (case insensitive)
    filename_upper = filename.upper()
    for supplier in TARGET_SUPPLIERS:
        if supplier in filename_upper:
            return supplier
            
    return None

stats = {s: 0 for s in TARGET_SUPPLIERS}
files_to_process = []

print(f"📂 Scanning: {SOURCE_DIR}")
print("---")

try:
    for root, dirs, files in os.walk(SOURCE_DIR):
        # Filter directories to avoid walking into excluded ones deeply (optimization)
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for file in files:
            if file.lower().endswith('.pdf'):
                supplier = is_eligible(root, file)
                if supplier:
                    stats[supplier] += 1
                    files_to_process.append(os.path.join(root, file))

    print("\n📊 RÉSULTAT DE L'INVENTAIRE :")
    total = 0
    for supplier, count in stats.items():
        print(f"  - {supplier:<15} : {count} factures")
        total += count
        
    print(f"\nTotal éligible : {total} factures à traiter.")

except Exception as e:
    print(f"Erreur d'accès : {e}")

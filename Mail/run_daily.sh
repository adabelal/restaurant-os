#!/bin/bash

# Configuration
USER_DIR="/Users/adambelal"
SCRIPT_DIR="$USER_DIR/Desktop/Mail"

echo "==================================================="
echo "   AUTOMATISATION GMAIL -> GOOGLE DRIVE API"
echo "==================================================="
echo "Date: $(date)"

cd "$SCRIPT_DIR" || exit
source venv/bin/activate

# Lancement du script d'automatisation direct
python download_invoices_2026.py

echo "==================================================="
echo "✅ TERMINÉ"
echo "==================================================="

import os
from gmail_manager import get_gmail_service

def check_emails():
    service = get_gmail_service()
    if not service:
        print("No service")
        return

    # Check Popina emails
    query_popina = 'subject:"Rapport de fin de caisse"'
    print(f"Searching Popina with: {query_popina}")
    results = service.users().messages().list(userId='me', q=query_popina, maxResults=10).execute()
    messages = results.get('messages', [])
    for m in messages:
        msg = service.users().messages().get(userId='me', id=m['id']).execute()
        headers = msg['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
        labels = msg.get('labelIds', [])
        print(f"Popina Mail: {date} | Labels: {labels}")

    # Check Invoice emails
    query_invoice = 'after:2025/12/31 has:attachment filename:pdf'
    print(f"\nSearching Invoices with: {query_invoice}")
    results = service.users().messages().list(userId='me', q=query_invoice, maxResults=10).execute()
    messages = results.get('messages', [])
    for m in messages:
        msg = service.users().messages().get(userId='me', id=m['id']).execute()
        headers = msg['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
        labels = msg.get('labelIds', [])
        print(f"Invoice Mail: {date} | Labels: {labels}")

if __name__ == "__main__":
    check_emails()

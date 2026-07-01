import csv, json, urllib.request, re

API = 'http://localhost:9080/api'

def post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, method='POST')
    return json.loads(urllib.request.urlopen(req).read())

def auth_post(url, token, data):
    body = json.dumps(data).encode()
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json'}
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    return json.loads(urllib.request.urlopen(req).read())

def auth_req(method, url, token):
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json'}
    req = urllib.request.Request(url, headers=headers, method=method)
    return json.loads(urllib.request.urlopen(req).read())

# Login as Zulmi (or admin - use admin to get all tickets)
r = post(f'{API}/auth/login', {'email': 'admin@aicop.local', 'password': 'password'})
token = r['token']

# Read CSV and build issue→notes map
notes_map = {}
with open('/Users/it-fa/Downloads/Bugs Fixing & Feature for New Platform - Bugs_Perbaikan.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        issue = (row.get('Issue') or '').strip()
        notes = (row.get('IT-Notes') or '').strip()
        if issue and notes and notes not in ('Done', 'Closed/Not Bug', ''):
            # clean up issue for matching - take first 80 chars
            key = issue[:80].lower()
            notes_map[key] = notes

print(f'CSV rows with notes: {len(notes_map)}')

# Get all tickets and match
page = 1
commented = 0
while True:
    res = auth_req('GET', f'{API}/tickets?per_page=50&page={page}', token)
    tickets = res.get('data', [])
    if not tickets:
        break
    
    for t in tickets:
        title = (t.get('title') or '').strip().lower()[:80]
        desc = (t.get('description') or '').lower()
        
        # Try to match by title first, then by Full Issue in description
        matched = notes_map.get(title)
        if not matched:
            # Try matching against Full Issue line in description
            for key, notes in notes_map.items():
                if key in desc:
                    matched = notes
                    break
        
        if matched:
            try:
                auth_post(f'{API}/tickets/{t["id"]}/comments', token, {'body_text': f'[IT Notes by Zulmi]\n{matched}'})
                commented += 1
                if commented % 10 == 0:
                    print(f'Added {commented} comments...')
            except Exception as e:
                pass  # skip errors silently
    
    if len(tickets) < 50:
        break
    page += 1

print(f'\nDone! Added {commented} IT-Notes comments.')

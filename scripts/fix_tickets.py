import json, urllib.request

API = 'http://localhost:9080/api'

def post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, method='POST')
    return json.loads(urllib.request.urlopen(req).read())

def auth_req(method, url, token, data=None):
    body = json.dumps(data).encode() if data else None
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json'}
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    return json.loads(urllib.request.urlopen(req).read())

# Login
r = post(f'{API}/auth/login', {'email': 'admin@aicop.local', 'password': 'password'})
token = r['token']

# Get all tickets
page = 1
updated = 0
while True:
    res = auth_req('GET', f'{API}/tickets?per_page=50&page={page}', token)
    tickets = res.get('data', [])
    if not tickets:
        break
    
    for t in tickets:
        old_title = (t.get('title') or '').strip()
        old_desc = (t.get('description') or '').strip()
        
        # Skip tickets that don't have the import pattern
        if not old_desc or not old_title:
            continue
        
        # Make concise title: first sentence or first 60 chars
        concise = old_title.split('.')[0].strip().rstrip(',')
        if len(concise) > 70:
            concise = concise[:67] + '...'
        if not concise:
            concise = old_title[:60]
        
        # Build new description: full issue text + IT activity notes
        parts = []
        if old_desc:
            parts.append(old_desc)
        parts.append(f'---\nFull Issue: {old_title}')
        new_desc = '\n\n'.join(parts)
        
        if concise == old_title:
            continue  # no change needed
        
        try:
            auth_req('PUT', f'{API}/tickets/{t["id"]}', token, {
                'title': concise,
                'description': new_desc,
            })
            updated += 1
            if updated % 20 == 0:
                print(f'Updated {updated} tickets...')
        except Exception as e:
            print(f'Error ticket {t["id"]}: {e}')
    
    if len(tickets) < 50:
        break
    page += 1

print(f'\nDone! Updated {updated} tickets.')

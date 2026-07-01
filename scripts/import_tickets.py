import csv, json, urllib.request, urllib.error

API = 'http://localhost:9080/api'

def post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, method='POST')
    return json.loads(urllib.request.urlopen(req).read())

def patch(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, method='PATCH')
    return urllib.request.urlopen(req)

# Login
r = post(f'{API}/auth/login', {'email': 'admin@aicop.local', 'password': 'password'})
token = r['token']

def auth_post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json'}, method='POST')
    return json.loads(urllib.request.urlopen(req).read())

def auth_patch(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json'}, method='PATCH')
    return urllib.request.urlopen(req)

status_map = {'Done': 'closed', 'Closed/Not Bug': 'closed', 'Not Bug': 'rejected', 'Rejected': 'rejected', 'Pending': 'in_progress', 'On Progress': 'in_progress', 'Queued': 'new', '': 'new'}
prio_map = {'Critical': 'P1', 'High': 'P2', 'Medium': 'P3', 'Low': 'P4', '': 'P4'}

count = 0
row_num = 0

with open('/Users/it-fa/Downloads/Bugs Fixing & Feature for New Platform - Bugs_Perbaikan.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        row_num += 1
        title = (row.get('Issue') or '').strip()[:255]
        if not title:
            continue
        desc_parts = []
        d = (row.get('IT-Notes') or '').strip()
        if d: desc_parts.append(d)
        sb = (row.get('Submitted by') or '').strip()
        if sb: desc_parts.append(f'Submitted by: {sb}')
        an = (row.get('PIC IT yang Handle') or '').strip()
        if an: desc_parts.append(f'PIC: {an}')
        ds = (row.get('--') or '').strip()
        if ds: desc_parts.append(f'Date: {ds}')

        raw_url = (row.get('link Url') or '').strip()
        url = raw_url if raw_url.startswith('http') else None

        data = {
            'title': title,
            'description': '\n'.join(desc_parts) if desc_parts else None,
            'ticket_type': 'bugfix',
            'priority': prio_map.get((row.get('Bobot/Weight') or '').strip(), 'P4'),
            'category': (row.get('Domain/Apps') or '').strip() or None,
        }
        if url:
            data['url'] = url

        try:
            ticket = auth_post(f'{API}/tickets', data)['data']
            status = status_map.get((row.get('Status by IT Manager') or '').strip(), 'new')
            if status != 'new':
                try:
                    auth_patch(f'{API}/tickets/{ticket["id"]}/status', {'status': status})
                except:
                    pass
            count += 1
            if count % 50 == 0:
                print(f'Imported {count} tickets...')
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f'Error row {row_num}: HTTP {e.code} - {body[:150]}')
        except Exception as e:
            print(f'Error row {row_num}: {e}')

print(f'\nDone! Imported {count} tickets.')

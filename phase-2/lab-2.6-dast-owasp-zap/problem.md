# Lab 2.6 — DAST with OWASP ZAP
**Phase**: 2 — CI/CD Security  
**Difficulty**: ⭐⭐⭐ Intermediate–Advanced  
**Estimated Time**: 3–4 hours  
**Category**: Dynamic Application Security Testing (DAST)

---

## 🎯 Objective

Implement **Dynamic Application Security Testing (DAST)** using OWASP ZAP to find security vulnerabilities in a **running application**. Unlike SAST (which analyzes code), DAST attacks the application like a real hacker — sending HTTP requests and analyzing responses.

---

## 📋 Problem Statement

Your team has a staging environment for a Flask REST API. SAST scans are running, but the security team insists you also need DAST because:
- SAST misses runtime vulnerabilities
- SAST can't test authentication and session management
- SAST can't find business logic flaws
- Penetration testers use exactly these techniques

Your job is to run OWASP ZAP against your staging environment and integrate it into the CD pipeline (post-deploy, pre-production promotion).

---

## 🛠️ Prerequisites

- Docker installed
- Python/Node.js (to run the target application)
- GitHub Actions or local CI

---

## 📋 Tasks

### Task 1: Set Up the Target Application

Create a Flask application with several vulnerabilities for ZAP to find:

```bash
mkdir dast-lab && cd dast-lab
```

Create `requirements.txt`:
```
flask==3.0.0
flask-cors==4.0.0
```

Create `vulnerable_app.py`:
```python
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
# Misconfiguration: CORS wildcard allows any origin
CORS(app, origins="*")

# Initialize in-memory database
def init_db():
    conn = sqlite3.connect(':memory:')
    conn.execute('''CREATE TABLE users 
                    (id INTEGER PRIMARY KEY, 
                     username TEXT, 
                     password TEXT, 
                     role TEXT)''')
    conn.execute("INSERT INTO users VALUES (1, 'admin', 'admin123', 'admin')")
    conn.execute("INSERT INTO users VALUES (2, 'user', 'user123', 'user')")
    conn.commit()
    return conn

db = init_db()

@app.route('/')
def index():
    # XSS vulnerability
    name = request.args.get('name', 'World')
    return render_template_string(f'<h1>Hello {name}!</h1><a href="/login">Login</a>')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        # SQL Injection vulnerability
        query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
        user = db.execute(query).fetchone()
        if user:
            return jsonify({'status': 'success', 'role': user[3], 'userId': user[0]})
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401
    return '''
    <form method="post">
        <input name="username" placeholder="Username">
        <input name="password" type="password" placeholder="Password">
        <button type="submit">Login</button>
    </form>
    '''

@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    # No authentication check! IDOR vulnerability
    user = db.execute(f"SELECT id, username, role FROM users WHERE id={user_id}").fetchone()
    if user:
        return jsonify({'id': user[0], 'username': user[1], 'role': user[2]})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/admin')
def admin_panel():
    # Missing authentication — exposed admin endpoint
    users = db.execute("SELECT id, username, role FROM users").fetchall()
    return jsonify([{'id': u[0], 'username': u[1], 'role': u[2]} for u in users])

@app.route('/api/ping')
def ping():
    # Command injection
    host = request.args.get('host', 'localhost')
    result = os.popen(f"ping -c 1 {host}").read()
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

Run the application:
```bash
pip install -r requirements.txt
python vulnerable_app.py
# App runs at http://localhost:5000
```

### Task 2: Manual ZAP Exploration (Passive Scan)

1. Run OWASP ZAP in Docker:
   ```bash
   docker pull ghcr.io/zaproxy/zaproxy:stable
   ```

2. Run a **baseline passive scan** — ZAP spiders the app but doesn't attack:
   ```bash
   docker run --rm \
     -v "$(pwd):/zap/wrk" \
     ghcr.io/zaproxy/zaproxy:stable \
     zap-baseline.py \
     -t http://host.docker.internal:5000 \
     -r baseline-report.html \
     -J baseline-report.json
   ```

3. Review the HTML report. Document:
   - What vulnerabilities did passive scanning find?
   - What headers are missing? (X-Content-Type-Options, X-Frame-Options, CSP)

### Task 3: Active Scan (Full Attack)

Run ZAP with **active scanning** — ZAP sends actual attack payloads:

```bash
docker run --rm \
  -v "$(pwd):/zap/wrk" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t http://host.docker.internal:5000 \
  -r fullscan-report.html \
  -J fullscan-report.json \
  -l WARN  # Report WARNING and above
```

Document:
- How many additional issues did active scanning find vs passive?
- Did ZAP find the SQL injection on `/login`?
- Did ZAP find the XSS on `/?name=`?

### Task 4: API Scan with OpenAPI Spec

ZAP can scan REST APIs more effectively with an OpenAPI/Swagger spec:

1. Create `openapi.yaml` for your API (template provided in solution)
2. Run ZAP API scan:
   ```bash
   docker run --rm \
     -v "$(pwd):/zap/wrk" \
     ghcr.io/zaproxy/zaproxy:stable \
     zap-api-scan.py \
     -t /zap/wrk/openapi.yaml \
     -f openapi \
     -r api-scan-report.html
   ```

### Task 5: GitHub Actions DAST Integration

Create `.github/workflows/dast.yml` that:
- Deploys the application to a temporary environment
- Runs ZAP baseline scan against it
- Uploads the HTML report as artifact
- Fails the pipeline on HIGH/CRITICAL findings
- Tears down the environment after scanning

### Task 6: Create ZAP Rules File

ZAP will likely find many things. Create a `.zap/rules.tsv` file that:
- **Ignores** low-severity informational findings that you've accepted
- **Warns** on medium findings (don't fail, but report)
- **Fails** on high/critical findings

---

## 📝 Deliverables

1. `vulnerable_app.py` — the target application
2. `baseline-report.html` — ZAP baseline scan report
3. `fullscan-report.html` — ZAP full scan report
4. `.github/workflows/dast.yml` — CI integration
5. `.zap/rules.tsv` — ZAP rules configuration
6. `dast-findings.md` — Your analysis comparing DAST vs SAST findings

---

## ❓ Questions to Answer

1. SAST found the SQL injection in Lab 2.2 and DAST found it here. What is the **added value** of DAST if SAST already found it?
2. ZAP found **missing security headers** (X-Frame-Options, CSP). Are these backend code issues, infrastructure issues, or both? Where would you fix them?
3. What is the risk of running DAST against a **production** environment vs a **staging** environment?
4. ZAP took 15 minutes to run. Your CEO wants 5-minute pipelines. How do you **optimize** DAST for speed without losing coverage?
5. What is **authenticated DAST** and why is it important? What vulnerabilities can only be found when ZAP is logged in?

---

> ⚠️ **Only run ZAP against systems you own or have explicit permission to test.**

> 💡 **Speed tip**: `zap-baseline.py` (passive, fast ~2 min) is suitable for every PR. `zap-full-scan.py` (active, slow ~15 min) should run nightly or before releases only.

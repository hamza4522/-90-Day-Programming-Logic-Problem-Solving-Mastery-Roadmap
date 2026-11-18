# Lab 1.1 — OWASP Juice Shop: Solution Guide
**Phase**: 1 — Security Foundation  
**Difficulty**: ⭐ Beginner

---

## 🚀 Step 1: Setup Juice Shop

```bash
# Pull and run Juice Shop
docker pull bkimminich/juice-shop
docker run --rm -p 3000:3000 bkimminich/juice-shop

# Verify it's running
curl http://localhost:3000
# Access in browser: http://localhost:3000
```

---

## 🔓 Challenge Solutions

### Challenge 1: SQL Injection — Login Bypass

**Goal**: Log in as admin without knowing the password.

**Steps**:
1. Navigate to `http://localhost:3000/#/login`
2. In the **Email** field, type:
   ```
   ' OR 1=1--
   ```
3. In the **Password** field, type anything (e.g., `password`)
4. Click **Login**

**What happened**: The `'` breaks out of the SQL string, `OR 1=1` makes the condition always true, and `--` comments out the rest of the query. The resulting SQL becomes:
```sql
SELECT * FROM Users WHERE email='' OR 1=1--' AND password='...'
-- This returns ALL users; the app logs in as the first one (admin)
```

**Fix**:
```javascript
// BAD — vulnerable to SQLi
const query = `SELECT * FROM Users WHERE email='${email}' AND password='${password}'`;

// GOOD — use parameterized queries / prepared statements
const query = 'SELECT * FROM Users WHERE email = ? AND password = ?';
db.query(query, [email, password]);
```

---

### Challenge 2: XSS — Cross-Site Scripting

**Goal**: Execute JavaScript via the search bar.

**Steps**:
1. Go to the Juice Shop homepage
2. In the search bar, type:
   ```html
   <iframe src="javascript:alert(`xss`)">
   ```
3. Press Enter — an alert box should appear

**What happened**: The search input is reflected back into the DOM without sanitization. The browser executes the injected JavaScript.

**Fix**:
```javascript
// BAD — directly inserting user input into DOM
document.getElementById('results').innerHTML = userInput;

// GOOD — use textContent or sanitize
document.getElementById('results').textContent = userInput;
// Or use DOMPurify library
import DOMPurify from 'dompurify';
document.getElementById('results').innerHTML = DOMPurify.sanitize(userInput);
```

---

### Challenge 3: Broken Access Control — View Another User's Basket

**Goal**: Access another user's shopping basket.

**Steps**:
1. Log in as any user (use the SQLi from Challenge 1 if needed)
2. Add an item to your basket
3. Open browser devtools → Network tab
4. Observe the basket API call: `GET /api/Baskets/1`
5. Change the basket ID in the URL: `GET /api/Baskets/2`
6. You'll see another user's basket!

**What happened**: The API checks if you're authenticated but NOT if the basket belongs to you (IDOR — Insecure Direct Object Reference).

**Fix**:
```javascript
// BAD — no ownership check
app.get('/api/Baskets/:id', authenticate, (req, res) => {
  Basket.findById(req.params.id).then(basket => res.json(basket));
});

// GOOD — verify ownership
app.get('/api/Baskets/:id', authenticate, (req, res) => {
  Basket.findById(req.params.id).then(basket => {
    if (basket.UserId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(basket);
  });
});
```

---

### Challenge 4: Sensitive Data Exposure — FTP Directory

**Goal**: Find exposed sensitive files.

**Steps**:
1. Navigate to `http://localhost:3000/ftp`
2. You'll see a directory listing with sensitive files
3. Download `acquisitions.md` — it contains confidential business data

**What happened**: The `/ftp` directory is publicly accessible without authentication.

**Fix**:
- Restrict access to internal directories in web server config
- Use `.htaccess` or nginx `deny all` for internal paths
- Never expose file system directories via web server
```nginx
# Nginx fix
location /ftp {
    deny all;
    return 403;
}
```

---

### Challenge 5: Security Misconfiguration — Admin Panel

**Goal**: Access the admin panel without admin credentials.

**Steps**:
1. Open browser devtools → Sources tab (or `main.js`)
2. Search for `administration` in the JavaScript source
3. Navigate to `http://localhost:3000/#/administration`
4. The admin panel loads! (UI hides it but doesn't protect it server-side)

**What happened**: Security by obscurity — the route is hidden in the UI but not protected on the server side.

**Fix**:
```javascript
// BAD — only hide in UI
{ path: 'administration', component: AdminComponent }

// GOOD — add server-side role guard
{ 
  path: 'administration', 
  component: AdminComponent,
  canActivate: [AdminGuard]  // Enforced both client AND server side
}
// Server side: verify JWT token contains admin role on every request
```

---

## 📊 Sample Findings Report

```markdown
## Finding #1: SQL Injection — Login Bypass
- **OWASP Category**: A03:2021 – Injection
- **Severity**: Critical
- **Steps to Reproduce**:
  1. Navigate to /login
  2. Enter `' OR 1=1--` as email
  3. Enter any password
  4. Click Login → authenticated as admin
- **Business Impact**: Complete authentication bypass; attacker gains admin access
- **Recommended Fix**: Use parameterized queries (prepared statements)
```

---

## 🔗 DevSecOps Connection

| Vulnerability Found | CI/CD Tool That Would Catch It |
|---|---|
| SQL Injection | **Semgrep** / **SonarQube** (SAST) |
| XSS | **Semgrep** with XSS rules |
| IDOR | **OWASP ZAP** (DAST) |
| Exposed Directory | **Checkov** / **tfsec** (IaC scan) |
| Missing Auth on Routes | **OWASP ZAP** / **Burp Suite** |

---

## ✅ Answers to Reflection Questions

1. **Easiest vulnerability**: SQL Injection — because it requires no tools, just knowledge. This matters because attackers don't need sophisticated tools; basic knowledge is enough to cause serious damage.

2. **CI/CD pipeline help**: SAST tools (Semgrep, SonarQube) would flag the unsafe SQL concatenation and missing input sanitization during the build stage, before the code ever reaches staging.

3. **OWASP Top 10 mapping**:
   - SQL Injection → A03:2021 Injection
   - XSS → A03:2021 Injection (also A07 — Identification Failures)
   - IDOR → A01:2021 Broken Access Control
   - Exposed FTP → A05:2021 Security Misconfiguration
   - Admin page accessible → A01:2021 Broken Access Control

4. **Preventing SQL Injection**: Always use parameterized queries or ORMs. Never concatenate user input into SQL strings.

// HARDENED — Lab 2.3 (SCA)
//
// Two kinds of fix happened here:
//   1. DEPENDENCY fixes (package.json): upgrade, drop unused deps (node-fetch,
//      minimist), force-patch a transitive dep with "overrides".
//   2. CODE fixes: even a patched library is unsafe if used badly. Upgrading
//      lodash fixes the CVE, but merging raw request bodies is still a
//      mass-assignment bug. SCA and secure coding work together.

const express = require('express');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  // Fail fast — never fall back to a default secret.
  console.error('JWT_SECRET must be set and at least 32 characters');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');                  // don't advertise the framework/version
app.use(express.json({ limit: '10kb' }));     // bound request size (DoS)

// Allowlist the fields you accept instead of merging the whole body.
// Object.create(null) has no prototype, so there is nothing to pollute.
const ALLOWED_THEMES = new Set(['light', 'dark']);
app.post('/data', (req, res) => {
  const settings = Object.assign(Object.create(null), { theme: 'light' });
  if (ALLOWED_THEMES.has(req.body?.theme)) settings.theme = req.body.theme;
  res.json(settings);
});

app.get('/token', (req, res) => {
  const token = jwt.sign({ sub: 'test' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: 'sca-lab',
    audience: 'sca-lab-api',
  });
  res.json({ token });
});

app.get('/me', (req, res) => {
  try {
    // Pin the algorithm: prevents "alg":"none" and RS256->HS256 confusion attacks.
    const claims = jwt.verify(String(req.query.token || ''), JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'sca-lab',
      audience: 'sca-lab-api',
    });
    res.json({ sub: claims.sub });
  } catch {
    res.status(401).json({ error: 'invalid token' });   // no internal detail leak
  }
});

// /proxy removed. The safest SSRF fix is not exposing the feature.
// (If you need it, see Lab 2.2 secure/app.py FIX 9.)

const port = Number(process.env.PORT) || 3000;
app.listen(port, '127.0.0.1', () => console.log(`secure app on 127.0.0.1:${port}`));

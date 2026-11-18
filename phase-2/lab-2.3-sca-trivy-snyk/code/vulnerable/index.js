// INTENTIONALLY VULNERABLE — Lab 2.3 (SCA). Do not deploy.
//
// The point of this lab: the code below looks almost reasonable. The danger
// is mostly in the DEPENDENCIES (see package.json), which SAST on *your*
// code will never find. Only SCA (npm audit / Trivy / Snyk / Grype) will.

const express = require('express');   // 4.17.1  -> CVE-2024-29041 open redirect, qs/body-parser DoS
const _ = require('lodash');          // 4.17.4  -> CVE-2018-3721, CVE-2019-10744 prototype pollution
const jwt = require('jsonwebtoken');  // 8.5.1   -> CVE-2022-23539/23540/23541 algorithm confusion
const axios = require('axios');       // 0.18.0  -> CVE-2019-10742, CVE-2023-45857, SSRF/redirect bugs
const minimist = require('minimist'); // 1.2.0   -> CVE-2020-7598, CVE-2021-44906 prototype pollution

const argv = minimist(process.argv.slice(2));
const app = express();
app.use(express.json());

// Prototype pollution: _.merge in lodash < 4.17.5 copies "__proto__" keys.
// POST {"__proto__": {"isAdmin": true}}  -> EVERY object now has isAdmin === true
app.post('/data', (req, res) => {
  const settings = _.merge({}, { theme: 'light' }, req.body);
  res.json(settings);
});

app.get('/admin', (req, res) => {
  const user = {};                       // a brand-new, empty object...
  if (user.isAdmin) {                    // ...inherits isAdmin from the polluted prototype
    return res.json({ secret: 'admin panel' });
  }
  res.status(403).json({ error: 'forbidden' });
});

// Weak, hardcoded JWT secret + no expiry + no algorithm pinning on verify.
app.get('/token', (req, res) => {
  res.json({ token: jwt.sign({ user: 'test' }, 'secret') });
});

app.get('/me', (req, res) => {
  try {
    const claims = jwt.verify(req.query.token, 'secret');
    res.json(claims);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

app.get('/proxy', async (req, res) => {
  const r = await axios.get(req.query.url);   // SSRF on top of library CVEs
  res.send(r.data);
});

app.listen(argv.port || 3000, '127.0.0.1', () => console.log('vulnerable app on 127.0.0.1:' + (argv.port || 3000)));

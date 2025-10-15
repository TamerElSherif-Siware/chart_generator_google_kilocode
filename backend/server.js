// Basic Express server setup
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432
});

const allowedDomainsFile = path.join(__dirname, 'allowed-domains.json');

function readAllowedDomains() {
  const data = fs.readFileSync(allowedDomainsFile);
  return JSON.parse(data);
}

function writeAllowedDomains(domains) {
  fs.writeFileSync(allowedDomainsFile, JSON.stringify(domains, null, 2));
}

const app = express();
const PORT = process.env.PORT || 5000;

 // Configure server-side sessions for Passport
app.use(session({
  secret: process.env.COOKIE_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
// Content Security Policy to allow Google Fonts and local connections
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:5001"
  );
  next();
});

// Serve admin frontend static files
app.use(express.static(path.join(__dirname, 'frontend'), { index: false }));

// Configure Google strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails && profile.emails[0].value;
    if (!email) {
      return done(new Error('No email found'), null);
    }
    const domain = email.split('@')[1];
    const allowed = readAllowedDomains();
    if (!allowed.includes(domain)) {
      return done(new Error('Unauthorized domain'), null);
    }
    done(null, profile);
  }));
} else {
  console.warn('Google OAuth not configured, skipping strategy setup');
}

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    if (err) {
      const message = encodeURIComponent(err.message);
      return res.redirect(`/?error=${message}`);
    }
    if (!user) {
      const message = encodeURIComponent('Login failed');
      return res.redirect(`/?error=${message}`);
    }
    req.logIn(user, err => {
      if (err) {
        const message = encodeURIComponent(err.message);
        return res.redirect(`/?error=${message}`);
      }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

app.get('/dashboard', (req, res) => {
  if (!req.user) {
    return res.redirect('/auth/google');
  }
  res.send(`Hello, ${req.user.displayName}`);
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
app.get('/dashboard/data', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Admin endpoints for managing allowed authentication domains
app.get('/admin/domains', (req, res) => {
  try {
    const domains = readAllowedDomains();
    res.json(domains);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read allowed domains' });
  }
});

app.post('/admin/domains', (req, res) => {
  const { domain } = req.body;
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }
  const domains = readAllowedDomains();
  if (domains.includes(domain)) {
    return res.status(409).json({ error: 'Domain already exists' });
  }
  domains.push(domain);
  writeAllowedDomains(domains);
  res.status(201).json(domains);
});

app.delete('/admin/domains/:domain', (req, res) => {
  const { domain } = req.params;
  let domains = readAllowedDomains();
  if (!domains.includes(domain)) {
    return res.status(404).json({ error: 'Domain not found' });
  }
  domains = domains.filter(d => d !== domain);
  writeAllowedDomains(domains);
  res.json(domains);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
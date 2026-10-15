require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const { exposeAdmin } = require('./middleware/auth');
const { DEFAULT_PRIMARY, normalizeHex, buildThemeCss } = require('./lib/theme');
const { getSiteUrl, absoluteUrl, defaultOgImage } = require('./lib/seo');
const publicRoutes = require('./routes/public');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.locals.DEFAULT_PRIMARY = DEFAULT_PRIMARY;
app.locals.normalizeHex = normalizeHex;
app.locals.buildThemeCss = buildThemeCss;
app.locals.absoluteUrl = absoluteUrl;
app.locals.defaultOgImage = defaultOgImage;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' && process.env.FORCE_SECURE === '1',
    },
  })
);

app.use(exposeAdmin);

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.query = req.query;
  res.locals.siteUrl = getSiteUrl(req);
  next();
});

// Keep admin & API out of search indexes; avoid caching private HTML
app.use(['/admin', '/api'], (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.use(apiRoutes);
app.use(adminRoutes);
app.use(publicRoutes);

app.use((err, req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  if (req.path.startsWith('/api/')) {
    return res.status(status).json({ error: err.message || 'Server error' });
  }
  res.status(status).render('public/error', {
    title: 'Something went wrong',
    message: err.message || 'Server error',
    settings: { brandName: 'Teak & Terrazzo', phone: '', address: '', email: '' },
    pageSeo: {
      title: 'Something went wrong | Teak & Terrazzo',
      description: 'An unexpected error occurred. Please return to the homepage.',
      path: req.path || '/',
      robots: 'noindex, follow',
      jsonLd: [],
    },
  });
});

app.listen(PORT, () => {
  console.log(`Teak & Terrazzo running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

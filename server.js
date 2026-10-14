const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./src/config');
const seed = require('./src/db/seed');

const gateways = require('./src/lib/gateways');

const authRoutes = require('./src/routes/auth');
const examRoutes = require('./src/routes/exams');
const paymentRoutes = require('./src/routes/payments');
const adminRoutes = require('./src/routes/admin');
const webhookRoutes = require('./src/routes/webhooks');

seed();

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })
);

app.use(
  express.json({
    limit: '100kb',
    verify(req, res, buf) {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', authLimiter);

app.get('/api/config', (req, res) => {
  res.json({
    platformName: 'Ethiopian Higher Education Exit Exam Preparation Platform',
    telebirrAccount: config.telebirrAccount,
    paymentMethod: 'Telebirr',
    paymentMode: config.paymentMode,
    onlinePaymentEnabled: gateways.onlineEnabled(),
    gateway: gateways.active().name,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders(res, filePath) {
      if (/\.(html)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-store');
      }
    },
  })
);

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

app.use((err, req, res, next) => {
  void next;
  console.error(err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(config.port, () => {
  console.log(`Exit Exam Platform running at http://localhost:${config.port}`);
  console.log(`Telebirr account: ${config.telebirrAccount}`);
});

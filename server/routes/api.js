const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

router.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const phone = String(req.body.phone || '').trim();
    const service = String(req.body.service || 'General').trim();
    const budget = String(req.body.budget || '').trim();
    const timeline = String(req.body.timeline || '').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email.' });
    }

    const lead = await prisma.contactLead.create({
      data: { name, email, phone, service, budget, timeline, message, status: 'new' },
    });

    res.status(201).json({ ok: true, id: lead.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save your message.' });
  }
});

router.post('/api/newsletter', contactLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email.' });
    }
    await prisma.contactLead.create({
      data: {
        name: 'Newsletter',
        email,
        service: 'Newsletter',
        message: 'Joined newsletter from website footer.',
        status: 'new',
      },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not subscribe.' });
  }
});

module.exports = router;

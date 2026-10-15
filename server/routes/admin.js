const express = require('express');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../lib/upload');
const { DEFAULT_PRIMARY, normalizeHex, buildPalette } = require('../lib/theme');

const router = express.Router();

function makeSlug(text) {
  return slugify(text, { lower: true, strict: true });
}

function uploadedPath(file) {
  return file ? `/uploads/${file.filename}` : null;
}

// ---- Auth ----
router.get('/admin/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', error: null });
});

router.post('/admin/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).render('admin/login', {
      title: 'Admin Login',
      error: 'Invalid email or password.',
    });
  }
  req.session.adminId = admin.id;
  req.session.admin = { id: admin.id, email: admin.email, name: admin.name };
  res.redirect('/admin');
});

router.post('/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ---- Dashboard ----
router.get('/admin', requireAdmin, async (req, res, next) => {
  try {
    const [newLeads, totalLeads, services, projects, blogs, recentLeads] = await Promise.all([
      prisma.contactLead.count({ where: { status: 'new' } }),
      prisma.contactLead.count(),
      prisma.service.count(),
      prisma.project.count(),
      prisma.blogPost.count(),
      prisma.contactLead.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    ]);
    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: { newLeads, totalLeads, services, projects, blogs },
      recentLeads,
    });
  } catch (err) {
    next(err);
  }
});

// ---- Leads ----
router.get('/admin/leads', requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status || 'all';
    const where = status === 'all' ? {} : { status };
    const leads = await prisma.contactLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.render('admin/leads', { title: 'Leads', leads, status });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/leads/:id', requireAdmin, async (req, res, next) => {
  try {
    const lead = await prisma.contactLead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.redirect('/admin/leads');
    if (lead.status === 'new') {
      await prisma.contactLead.update({ where: { id: lead.id }, data: { status: 'read' } });
      lead.status = 'read';
    }
    res.render('admin/lead-detail', { title: 'Lead detail', lead });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/leads/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body.status || 'read');
    if (!['new', 'read', 'archived'].includes(status)) {
      return res.redirect('/admin/leads');
    }
    await prisma.contactLead.update({ where: { id: req.params.id }, data: { status } });
    res.redirect(`/admin/leads/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

router.post('/admin/leads/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await prisma.contactLead.delete({ where: { id: req.params.id } });
    res.redirect('/admin/leads');
  } catch (err) {
    next(err);
  }
});

// ---- Settings ----
router.get('/admin/settings', requireAdmin, async (req, res, next) => {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const primaryColor = normalizeHex(settings?.primaryColor) || DEFAULT_PRIMARY;
    const palette = buildPalette(primaryColor);
    res.render('admin/settings', {
      title: 'Settings',
      settings: { ...settings, primaryColor },
      palette,
      defaultPrimary: DEFAULT_PRIMARY,
      saved: req.query.saved === '1',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/settings', requireAdmin, async (req, res, next) => {
  try {
    const primaryColor = normalizeHex(req.body.primaryColor) || DEFAULT_PRIMARY;
    const data = {
      brandName: String(req.body.brandName || '').trim(),
      tagline: String(req.body.tagline || '').trim(),
      phone: String(req.body.phone || '').trim(),
      phoneSecondary: String(req.body.phoneSecondary || '').trim(),
      address: String(req.body.address || '').trim(),
      email: String(req.body.email || '').trim(),
      aboutText: String(req.body.aboutText || '').trim(),
      businessHours: String(req.body.businessHours || '').trim(),
      mapsUrl: String(req.body.mapsUrl || '').trim(),
      whatsapp: String(req.body.whatsapp || '').trim(),
      facebook: String(req.body.facebook || '#').trim(),
      instagram: String(req.body.instagram || '#').trim(),
      twitter: String(req.body.twitter || '#').trim(),
      linkedin: String(req.body.linkedin || '#').trim(),
      primaryColor,
    };
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    res.redirect('/admin/settings?saved=1');
  } catch (err) {
    next(err);
  }
});

// Services
router.get('/admin/services', requireAdmin, async (req, res, next) => {
  try {
    const items = await prisma.service.findMany({ orderBy: { sortOrder: 'asc' } });
    res.render('admin/services', { title: 'Services', items });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/services/new', requireAdmin, (req, res) => {
  res.render('admin/service-form', { title: 'New service', item: null });
});

router.post('/admin/services', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    await prisma.service.create({
      data: {
        title,
        slug: makeSlug(title) || `service-${Date.now()}`,
        summary: String(req.body.summary || '').trim(),
        body: String(req.body.body || '').trim(),
        imagePath: uploadedPath(req.file) || '/assets/images/service-residential-apartment.jpg',
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/services/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const item = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!item) return res.redirect('/admin/services');
    res.render('admin/service-form', { title: 'Edit service', item });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/services/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    await prisma.service.update({
      where: { id: req.params.id },
      data: {
        title,
        slug: makeSlug(title) || existing.slug,
        summary: String(req.body.summary || '').trim(),
        body: String(req.body.body || '').trim(),
        imagePath: uploadedPath(req.file) || existing.imagePath,
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/services/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
});

// Projects
router.get('/admin/projects', requireAdmin, async (req, res, next) => {
  try {
    const items = await prisma.project.findMany({ orderBy: { sortOrder: 'asc' } });
    res.render('admin/projects', { title: 'Projects', items });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/projects/new', requireAdmin, (req, res) => {
  res.render('admin/project-form', { title: 'New project', item: null });
});

router.post('/admin/projects', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    await prisma.project.create({
      data: {
        title,
        slug: makeSlug(title) || `project-${Date.now()}`,
        category: String(req.body.category || 'Residential').trim(),
        imagePath: uploadedPath(req.file) || '/assets/images/project-nyla-living.jpg',
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/projects');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/projects/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const item = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!item) return res.redirect('/admin/projects');
    res.render('admin/project-form', { title: 'Edit project', item });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/projects/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title,
        slug: makeSlug(title) || existing.slug,
        category: String(req.body.category || 'Residential').trim(),
        imagePath: uploadedPath(req.file) || existing.imagePath,
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/projects');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/projects/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.redirect('/admin/projects');
  } catch (err) {
    next(err);
  }
});

// Blog
router.get('/admin/blog', requireAdmin, async (req, res, next) => {
  try {
    const items = await prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' } });
    res.render('admin/blog', { title: 'Blog', items });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/blog/new', requireAdmin, (req, res) => {
  res.render('admin/blog-form', { title: 'New post', item: null });
});

router.post('/admin/blog', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    await prisma.blogPost.create({
      data: {
        title,
        slug: makeSlug(title) || `post-${Date.now()}`,
        excerpt: String(req.body.excerpt || '').trim(),
        body: String(req.body.body || '').trim(),
        coverPath: uploadedPath(req.file) || '/assets/images/blog-apartment-planning.jpg',
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : new Date(),
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/blog/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const item = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!item) return res.redirect('/admin/blog');
    res.render('admin/blog-form', { title: 'Edit post', item });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/blog/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        title,
        slug: makeSlug(title) || existing.slug,
        excerpt: String(req.body.excerpt || '').trim(),
        body: String(req.body.body || '').trim(),
        coverPath: uploadedPath(req.file) || existing.coverPath,
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : existing.publishedAt,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/blog/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
});

// Testimonials
router.get('/admin/testimonials', requireAdmin, async (req, res, next) => {
  try {
    const items = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });
    res.render('admin/testimonials', { title: 'Testimonials', items });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/testimonials/new', requireAdmin, (req, res) => {
  res.render('admin/testimonial-form', { title: 'New testimonial', item: null });
});

router.post('/admin/testimonials', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    await prisma.testimonial.create({
      data: {
        quote: String(req.body.quote || '').trim(),
        authorName: String(req.body.authorName || '').trim(),
        authorDate: String(req.body.authorDate || '').trim(),
        avatarPath: uploadedPath(req.file) || '/assets/images/client-avatar-ananya.jpg',
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/testimonials');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/testimonials/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const item = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
    if (!item) return res.redirect('/admin/testimonials');
    res.render('admin/testimonial-form', { title: 'Edit testimonial', item });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/testimonials/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
    await prisma.testimonial.update({
      where: { id: req.params.id },
      data: {
        quote: String(req.body.quote || '').trim(),
        authorName: String(req.body.authorName || '').trim(),
        authorDate: String(req.body.authorDate || '').trim(),
        avatarPath: uploadedPath(req.file) || existing.avatarPath,
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/testimonials');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/testimonials/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.redirect('/admin/testimonials');
  } catch (err) {
    next(err);
  }
});

// Client logos (homepage marquee)
router.get('/admin/client-logos', requireAdmin, async (req, res, next) => {
  try {
    const items = await prisma.clientLogo.findMany({ orderBy: { sortOrder: 'asc' } });
    res.render('admin/client-logos', { title: 'Client Logos', items });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/client-logos/new', requireAdmin, (req, res) => {
  res.render('admin/client-logo-form', { title: 'New client logo', item: null });
});

router.post('/admin/client-logos', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const imagePath = uploadedPath(req.file);
    if (!imagePath) {
      return res.status(400).render('admin/client-logo-form', {
        title: 'New client logo',
        item: null,
      });
    }
    await prisma.clientLogo.create({
      data: {
        name: String(req.body.name || '').trim(),
        imagePath,
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/client-logos');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/client-logos/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const item = await prisma.clientLogo.findUnique({ where: { id: req.params.id } });
    if (!item) return res.redirect('/admin/client-logos');
    res.render('admin/client-logo-form', { title: 'Edit client logo', item });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/client-logos/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const existing = await prisma.clientLogo.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.redirect('/admin/client-logos');
    await prisma.clientLogo.update({
      where: { id: req.params.id },
      data: {
        name: String(req.body.name || '').trim(),
        imagePath: uploadedPath(req.file) || existing.imagePath,
        sortOrder: Number(req.body.sortOrder) || 0,
        published: req.body.published === 'on',
      },
    });
    res.redirect('/admin/client-logos');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/client-logos/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await prisma.clientLogo.delete({ where: { id: req.params.id } });
    res.redirect('/admin/client-logos');
  } catch (err) {
    next(err);
  }
});

// Process
router.get('/admin/process', requireAdmin, async (req, res, next) => {
  try {
    const items = await prisma.processStep.findMany({ orderBy: { sortOrder: 'asc' } });
    res.render('admin/process', { title: 'Process', items });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/process/new', requireAdmin, (req, res) => {
  res.render('admin/process-form', { title: 'New process step', item: null });
});

router.post('/admin/process', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    await prisma.processStep.create({
      data: {
        title: String(req.body.title || '').trim(),
        body: String(req.body.body || '').trim(),
        imagePath: uploadedPath(req.file) || '/assets/images/process-consultation-meeting.jpg',
        sortOrder: Number(req.body.sortOrder) || 0,
      },
    });
    res.redirect('/admin/process');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/process/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const item = await prisma.processStep.findUnique({ where: { id: req.params.id } });
    if (!item) return res.redirect('/admin/process');
    res.render('admin/process-form', { title: 'Edit process step', item });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/process/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const existing = await prisma.processStep.findUnique({ where: { id: req.params.id } });
    await prisma.processStep.update({
      where: { id: req.params.id },
      data: {
        title: String(req.body.title || '').trim(),
        body: String(req.body.body || '').trim(),
        imagePath: uploadedPath(req.file) || existing.imagePath,
        sortOrder: Number(req.body.sortOrder) || 0,
      },
    });
    res.redirect('/admin/process');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/process/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await prisma.processStep.delete({ where: { id: req.params.id } });
    res.redirect('/admin/process');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

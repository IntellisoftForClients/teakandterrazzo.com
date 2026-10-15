const prisma = require('../lib/prisma');

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.redirect('/admin/login');
}

async function exposeAdmin(req, res, next) {
  res.locals.admin = req.session?.admin || null;
  res.locals.isAdmin = Boolean(req.session?.adminId);
  res.locals.newLeadsCount = 0;

  if (!req.session?.adminId) return next();

  try {
    res.locals.newLeadsCount = await prisma.contactLead.count({
      where: { status: 'new' },
    });
  } catch {
    res.locals.newLeadsCount = 0;
  }
  next();
}

module.exports = { requireAdmin, exposeAdmin };

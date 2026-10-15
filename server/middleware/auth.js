function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.redirect('/admin/login');
}

function exposeAdmin(req, res, next) {
  res.locals.admin = req.session?.admin || null;
  res.locals.isAdmin = Boolean(req.session?.adminId);
  next();
}

module.exports = { requireAdmin, exposeAdmin };

export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.redirect("/login");
}

export function redirectIfAuth(req, res, next) {
  if (req.session && req.session.userId) return res.redirect("/feed");
  next();
}

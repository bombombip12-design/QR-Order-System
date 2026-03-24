const jwt = require("jsonwebtoken");

function getTokenFromHeader(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { sub, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRole(allowedRoles = []) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [];
  return (req, res, next) => {
    if (!req.user?.role) return res.status(403).json({ message: "Forbidden" });
    const role = String(req.user.role);
    // manager (DB mới) ~ admin; staff (DB mới) ~ waiter; giữ tương thích seed cũ
    let normalizedRole = role;
    if (role === "manager") normalizedRole = "admin";
    else if (role === "staff") normalizedRole = "waiter";
    const normalizedAllowed = allowed.map((r) => (r === "staff" ? "waiter" : r));
    if (!normalizedAllowed.includes(normalizedRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };


const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/Users");
const { requireAuth } = require("../middleware/auth");

/** bcrypt hash bắt đầu bằng $2a/$2b/$2y; nếu DB lưu plain text thì so sánh trực tiếp */
async function verifyPassword(plain, stored) {
  const s = String(stored ?? "");
  const p = String(plain ?? "");
  if (s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$")) {
    return bcrypt.compare(p, s);
  }
  return p === s;
}

const router = express.Router();

// POST /api/auth/login
// Body: { email, password } or { identifier, password }
router.post("/login", async (req, res) => {
  try {
    const { email, identifier, password } = req.body || {};
    const identity = String(identifier || email || "").trim();
    if (!identity || !password) {
      return res.status(400).json({ message: "identifier/email and password are required" });
    }

    const normalized = identity.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalized }, { phone: identity }],
    }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status && user.status !== "active") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa hoặc không hoạt động" });
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Nếu mật khẩu đang lưu dạng plain: tự hash lại để lần sau dùng bcrypt (tùy chọn migrate)
    const raw = String(user.password ?? "");
    if (raw && !raw.startsWith("$2")) {
      user.password = await bcrypt.hash(String(password), 10);
      await user.save();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const payload = {
      sub: String(user._id),
      role: user.role,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "1d" });

    return res.json({
      token,
      user: {
        id: String(user._id),
        _id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// POST /api/auth/logout
// JWT logout is handled client-side by removing token.
router.post("/logout", requireAuth, async (_req, res) => {
  return res.json({ message: "Logged out" });
});

// GET /api/auth/me
// Bearer token: Authorization: Bearer <token>
router.get("/me", requireAuth, async (req, res) => {
  const sub = req.user?.sub;
  if (!sub) return res.status(401).json({ message: "Invalid token payload" });

  const user = await User.findById(sub).select("-password").lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  // Return both legacy flat format and current nested format.
  res.json({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    user,
  });
});

module.exports = router;


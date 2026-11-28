const express = require("express");
const crypto = require("crypto");
const Plot = require("../models/Plot");
const requireAdmin = require("../middleware/adminAuth");
const {
  normalizePlotNo,
  isValidKrishnaFormat,
} = require("../utils/plotHelper");

const router = express.Router();
const TOKEN_SECRET =
  process.env.JWT_SECRET || process.env.ADMIN_PIN || "dc-krishna-secret";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, key] = stored.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

function signResidentToken(plot) {
  const payload = Buffer.from(
    JSON.stringify({
      plotNo: plot.plotNo,
      exp: Date.now() + 90 * 24 * 3600 * 1000,
    }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

// Committee Admin PIN check
router.post("/verify-pin", (req, res) => {
  const pin = String(req.body?.pin || "").trim();
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
    return res
      .status(401)
      .json({ valid: false, error: "Invalid Committee PIN" });
  }
  res.json({ valid: true });
});

// Step 1: Check if plot is in Krishna wing & if password is already set
router.post("/check-plot", async (req, res) => {
  try {
    const plotNo = normalizePlotNo(req.body?.plotNo);
    if (!isValidKrishnaFormat(plotNo)) {
      return res.status(403).json({
        error: "Only Krishna wing plots (A/B series) are allowed to log in.",
      });
    }

    const plot = await Plot.findOne({ plotNo }).select("+passwordHash");
    if (!plot) {
      return res.status(404).json({
        error: `Plot ${plotNo} is not registered in the Krishna directory. Contact the committee.`,
      });
    }

    res.json({
      plotNo: plot.plotNo,
      ownerName: plot.owner.name,
      hasPassword: Boolean(plot.passwordHash),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2A: First-time password setup (verifies last 4 digits of owner/tenant phone)
router.post("/setup-password", async (req, res) => {
  try {
    const plotNo = normalizePlotNo(req.body?.plotNo);
    const phoneLast4 = String(req.body?.phoneLast4 || "").replace(/\D/g, "");
    const password = String(req.body?.password || "").trim();

    if (password.length < 4) {
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters." });
    }

    const plot = await Plot.findOne({ plotNo }).select("+passwordHash");
    if (!plot) return res.status(404).json({ error: "Plot not found." });
    if (plot.passwordHash) {
      return res
        .status(400)
        .json({ error: "Password already set. Please log in." });
    }

    const ownerDigits = String(plot.owner?.phone || "").replace(/\D/g, "");
    const tenantDigits = String(plot.tenant?.phone || "").replace(/\D/g, "");
    const matchesPhone =
      phoneLast4.length === 4 &&
      (ownerDigits.endsWith(phoneLast4) || tenantDigits.endsWith(phoneLast4));

    if (!matchesPhone) {
      return res.status(401).json({
        error:
          "Last 4 digits do not match the registered mobile number for this plot.",
      });
    }

    plot.passwordHash = hashPassword(password);
    await plot.save();

    const token = signResidentToken(plot);
    res.json({
      token,
      plotNo: plot.plotNo,
      ownerName: plot.owner.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2B: Returning resident login
router.post("/login", async (req, res) => {
  try {
    const plotNo = normalizePlotNo(req.body?.plotNo);
    const password = String(req.body?.password || "").trim();

    if (!isValidKrishnaFormat(plotNo)) {
      return res
        .status(403)
        .json({ error: "Only Krishna wing plots are permitted." });
    }

    const plot = await Plot.findOne({ plotNo }).select("+passwordHash");
    if (!plot || !plot.passwordHash) {
      return res
        .status(401)
        .json({ error: "Invalid plot number or password not set yet." });
    }

    if (!verifyPassword(password, plot.passwordHash)) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const token = signResidentToken(plot);
    res.json({
      token,
      plotNo: plot.plotNo,
      ownerName: plot.owner.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin helper: reset a resident's forgotten password
router.post("/reset-plot-password", requireAdmin, async (req, res) => {
  try {
    const plotNo = normalizePlotNo(req.body?.plotNo);
    const plot = await Plot.findOneAndUpdate(
      { plotNo },
      { $set: { passwordHash: null } },
      { new: true },
    );
    if (!plot) return res.status(404).json({ error: "Plot not found." });
    res.json({ message: `Password reset for ${plotNo}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

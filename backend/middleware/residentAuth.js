const crypto = require("crypto");
const TOKEN_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PIN || "dc-krishna-secret";

function requireResident(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || !token.includes(".")) {
    return res.status(401).json({ error: "Please log in with your Krishna plot number." });
  }

  const [payload, sig] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  if (sig !== expectedSig) {
    return res.status(401).json({ error: "Invalid session. Please log in again." });
  }

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (data.exp && Date.now() > data.exp) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  req.resident = data; 
  next();
}

module.exports = requireResident;
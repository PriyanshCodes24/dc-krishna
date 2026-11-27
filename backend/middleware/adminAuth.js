module.exports = function requireAdmin(req, res, next) {
  const clientPin = req.headers["x-admin-pin"];
  const serverPin = process.env.ADMIN_PIN;

  if (!serverPin) {
    return res
      .status(500)
      .json({ message: "ADMIN_PIN is not configured on server" });
  }

  if (!clientPin || clientPin !== serverPin) {
    return res
      .status(401)
      .json({ message: "Invalid or missing Committee PIN" });
  }

  next();
};

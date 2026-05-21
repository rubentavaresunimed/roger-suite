import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: "Token não informado",
    });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET || "roger_dev_secret_change_me");
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Token inválido ou expirado",
    });
  }
}

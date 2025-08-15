import User from "../models/user.model.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    // Ensure userId is set by authMiddleware
    if (!req.userId) {
      return res.status(401).json({ error: { message: "Unauthorized. No user ID found." } });
    }
    // Fetch user from DB
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: { message: "User not found." } });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: { message: "Access denied. Admins only." } });
    }
    // Attach user to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
};

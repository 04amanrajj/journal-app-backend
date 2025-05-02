const db = require("../config/db"); // Import your database configuration
const jwt = require("jsonwebtoken");

exports.checkBlacklist = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        // Verify token expiration
        jwt.verify(token, process.env.JWT_SECRET);
        // Check if the token exists in the blacklisted_tokens table
        const blacklistedToken = await db("blacklisted_tokens").where({ token }).first();

        if (blacklistedToken) {
            return res.status(401).json({ error: "Token is invalid or expired" });
        }

        next();
    } catch (err) {
        console.error("Error checking blacklist:", err.message);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

exports.userInfo = async (req, res) => {
    const user_id = req.user.id;

    try {
        // Fetch user details
        const user = await db.select("*").from("users").where("id", user_id).first();
        if (!user)
            return res.status(404).json({ error: "User not found" });

        // Fetch total journal entries for the user
        const journalCount = await db("journals").where("user_id", user_id).count("id as count").first();

        res.json({
            user,
            totalJournals: Number(journalCount.count),
        });
    } catch (err) {
        logger.error("Error fetching user info: " + err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.registerUser = async (req, res) => {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Check if user already exists
        const existingUser = await db("users").where({ email }).first();
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Prepare user data
        const query = {};
        if (username) query.name = username;
        if (email) query.email = email;
        if (phone) query.phone = phone;
        if (password) query.password = await bcrypt.hash(password, 10);

        // Insert user into the database
        const [userId] = await db("users").insert(query).returning("id");

        // Generate JWT token
        const token = jwt.sign({ id: userId, email: query.email }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME || "2h",
        });

        res.status(201).json({
            message: "User registered successfully",
            token,
        });
    } catch (err) {
        logger.error("Error registering user: " + err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        // Check if user exists
        const user = await db("users").where({ email }).first();
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME || "2h",
        });

        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        logger.error("Error logging in user: " + err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.logoutUser = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(400).json({ error: "Token is required for logout" });
    }

    try {
        // Insert the token into the blacklisted_tokens table
        await db("blacklisted_tokens").insert({ token });

        res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        console.error("Error logging out user:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteUser = async (req, res) => {
    const user_id = req.user.id;

    try {
        await db("journals").where("user_id", user_id).del();
        await db("users").where("id", user_id).del();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        logger.error("Error deleting user: " + err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

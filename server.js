const express = require("express");
const db = require("./config/db");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// middleware to parse JSON requests
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});


app.get("/users", async (req, res) => {
    try {
        const users = await db.raw("SELECT * FROM users");
        res.json(users.rows);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, async () => {
    try {
        console.log(`http://localhost:${port}`);
    } catch (error) {
        console.error("Error connecting to PostgreSQL database", error);
    }
});

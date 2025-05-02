const express = require("express");
const { userRoutes } = require("./routes/user.routes");
const { journalRoutes } = require("./routes/journal.routes");
const { authenticate } = require("./middlewares/authorization.middleware");
const { checkBlacklist } = require("./middlewares/blacklist.middleware");
const db = require("./config/db"); // Import your database configuration

require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware to parse JSON requests
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/user", userRoutes);
app.use(authenticate);
app.use(checkBlacklist);

app.use("/journal", journalRoutes);

app.listen(port, async () => {
    try {
        // Check database connection
        await db.raw("SELECT 1"); // Example query to check DB connection
        console.log("Connected to the database");

        // Log server running message
        console.log(`server is running at http://localhost:${port}`);
    } catch (error) {
        console.error("Error connecting to the database:", error.message);
    }
});

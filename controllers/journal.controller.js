const db = require("../config/db");

exports.createJournal = async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !content || !userId) {
        return res
            .status(400)
            .json({ error: "Title, content, and userId are required" });
    }

    try {
        await db("journals").insert({ title, content, user_id: userId });
        res.status(201).json({ message: "Journal created successfully" });
    } catch (err) {
        console.error("Error creating journal:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getJournals = async (req, res) => {
    try {
        const journals = await db("journals").select("*").where(
            "user_id",
            req.user.id
        );
        res.status(200).json(journals);
    } catch (err) {
        console.error("Error fetching journals:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.editJournal = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
    }

    try {
        const updated = await db("journals")
            .where({ id })
            .update({ title, content });
        if (updated) {
            res.status(200).json({ message: "Journal updated successfully" });
        } else {
            res.status(404).json({ error: "Journal not found" });
        }
    } catch (err) {
        console.error("Error updating journal:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteJournal = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await db("journals").where({ id }).del();
        if (deleted) {
            res.status(200).json({ message: "Journal deleted successfully" });
        } else {
            res.status(404).json({ error: "Journal not found" });
        }
    } catch (err) {
        console.error("Error deleting journal:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

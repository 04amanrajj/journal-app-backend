const db = require("../config/db");
const AdmZip = require("adm-zip");
const fs = require("fs").promises; // Use promises for async file operations
const path = require("path");
const s3 = require("../config/minioClient");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

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
    const { id, title, date, search } = req.query;

    try {
        // Single journal by ID
        if (id) {
            const journal = await db("journals")
                .select("*")
                .where("id", id)
                .first();
            return res.status(200).json(journal || {});
        }

        // Build base query
        let query = db("journals")
            .select("*")
            .where("user_id", req.user.id);

        // Search by title
        if (title) {
            query = query.where(
                db.raw("LOWER(title) LIKE ?", [`%${title.toLowerCase()}%`])
            );
        }

        // Search by date
        if (date) {
            // Validate date format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res
                    .status(400)
                    .json({ error: "Invalid date format. Use YYYY-MM-DD" });
            }

            // Parse date and create UTC range
            const parsedDate = new Date(date + "T00:00:00.000Z");
            if (isNaN(parsedDate)) {
                return res
                    .status(400)
                    .json({ error: "Invalid date. Use YYYY-MM-DD" });
            }

            // Create start and end of day in UTC
            const startOfDay = new Date(parsedDate.setUTCHours(0, 0, 0, 0));
            const endOfDay = new Date(parsedDate.setUTCHours(23, 59, 59, 999));

            query = query.whereBetween("created_at", [startOfDay, endOfDay]);
        }

        // Search both title and content
        if (search) {
            query = query.where(function () {
                this.where(db.raw("LOWER(title) LIKE ?", [`%${search.toLowerCase()}%`])).orWhere(
                    db.raw("LOWER(content) LIKE ?", [`%${search.toLowerCase()}%`])
                );
            });
        }

        // Execute query
        const journals = await query;
        return res.status(200).json(journals);
    } catch (err) {
        console.error("Error fetching journals:", err.message);
        return res.status(500).json({ error: "Internal server error" });
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

exports.uploadJournal = async (req, res) => {
    let filePath; // Track file path for cleanup

    try {
        // Validate file presence
        if (!req.file || !req.file.path) {
            return res
                .status(400)
                .json({ error: "No file uploaded or invalid file" });
        }

        filePath = path.resolve(req.file.path); // Store resolved path
        const userId = req.user.id;
        const importedJournals = [];
        let fileContent;

        // Handle ZIP file
        if (
            req.file.mimetype === "application/zip" ||
            req.file.originalname.endsWith(".zip")
        ) {
            try {
                const zip = new AdmZip(filePath);
                const zipEntries = zip.getEntries();

                const jsonEntry = zipEntries.find(
                    (entry) => entry.entryName.endsWith(".json") && !entry.isDirectory
                );

                if (!jsonEntry) {
                    return res
                        .status(400)
                        .json({ error: "No JSON file found in the ZIP" });
                }

                const fileData = jsonEntry.getData().toString("utf8");
                fileContent = JSON.parse(fileData);
                console.log("Found JSON file in ZIP:", {
                    name: jsonEntry.entryName,
                    size: fileData.length,
                });
            } catch (zipError) {
                console.error("Error processing ZIP file:", zipError.message);
                return res.status(400).json({ error: "Invalid or corrupted ZIP file" });
            }
        } else {
            // Handle direct JSON file
            try {
                const fileData = await fs.readFile(filePath, "utf8");
                fileContent = JSON.parse(fileData);
            } catch (jsonError) {
                console.error("Error reading or parsing JSON file:", jsonError.message);
                return res.status(400).json({ error: "Invalid JSON file" });
            }
        }

        // Validate file content
        if (!fileContent.entries || !Array.isArray(fileContent.entries)) {
            return res.status(400).json({
                error:
                    "Invalid file format. The JSON file must contain an 'entries' array.",
            });
        }

        console.log("Processing entries:", {
            totalEntries: fileContent.entries.length,
            firstEntryKeys: Object.keys(fileContent.entries[0] || {}),
        });

        // Reverse entries
        fileContent.entries.reverse();

        // Process entries
        for (const entry of fileContent.entries) {
            try {
                if (!entry.text || !entry.creationDate || !entry.modifiedDate) {
                    console.warn(
                        "Skipping invalid entry (missing required fields):",
                        entry
                    );
                    continue;
                }

                // Extract title from the first line of text
                const firstLine = entry.text.split("\n")[0];
                const title = firstLine
                    .replace(/^#\s*/, "") // Remove leading # and spaces
                    .replace(/\*\*/g, "") // Remove ** for bold
                    .replace(/\*/g, "") // Remove single * for italic
                    .trim();

                // Get the content (everything after the title)
                const content = entry.text.split("\n").slice(1).join("\n").trim();

                // Create journal entry
                const [journalId] = await db("journals").insert({
                    title,
                    content,
                    user_id: userId,
                    created_at: new Date(entry.creationDate),
                    updated_at: new Date(entry.modifiedDate),
                });

                importedJournals.push({
                    id: journalId,
                    title,
                    created_at: entry.creationDate,
                    updated_at: entry.modifiedDate,
                });
            } catch (entryError) {
                console.error("Error processing entry:", entryError.message, entry);
            }
        }

        // Send response
        res.status(200).json({
            message: "Journals imported successfully",
            importedCount: importedJournals.length,
            importedJournals,
        });
    } catch (error) {
        console.error("Error importing journals:", error.message);
        if (filePath) {
            await deleteFileWithRetry(filePath);
        }
        return res.status(500).json({ error: "Error importing journals" });
    } finally {
        // Clean up file with retry
        if (filePath) {
            await deleteFileWithRetry(filePath);
        }
    }
};

// Retry file deletion to handle temporary locks
async function deleteFileWithRetry(filePath, retries = 3, delay = 100) {
    for (let i = 0; i < retries; i++) {
        try {
            await fs.unlink(filePath);
            console.log("Successfully deleted file:", filePath);
            return;
        } catch (error) {
            if (i === retries - 1) {
                console.error(
                    "Failed to delete file after retries:",
                    error.message,
                    filePath
                );
                return;
            }
            console.warn(`Retrying file deletion (${i + 1}/${retries}):`, filePath);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

exports.uploadJournalS3 = async (req, res) => {
    console.log("Uploading file to S3");
    try {
        const { file } = req;
        console.log(file);

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        }

        const result = await s3.send(new PutObjectCommand(params));
        const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
        console.log(result)
        console.log({ message: "File uploaded successfully", url: fileUrl });
        res.status(200).json({ message: "File uploaded successfully", url: fileUrl });

    } catch (error) {
        console.error("Error uploading media:", error.message);
        res.status(500).json({ error: "Error uploading media" });
    }
}

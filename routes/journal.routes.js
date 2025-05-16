const express = require("express");
const upload = require("../middlewares/upload.middleware");

const {
  createJournal,
  getJournals,
  editJournal,
  deleteJournal,
  uploadJournal,
  uploadJournalS3
} = require("../controllers/journal.controller");

const journalRoutes = express.Router();

// Route to create a journal
journalRoutes.post("/create", createJournal);

// Route to get all journals
journalRoutes.get("/", getJournals);

// Route to edit a journal
journalRoutes.put("/edit/:id", editJournal);

// Route to delete a journal
journalRoutes.delete("/delete/:id", deleteJournal);

// Route to upload a file
journalRoutes.post("/upload", upload.single("file"), uploadJournal)

// Route to upload a file to S3
journalRoutes.post("/upload-s3", upload.single("file"), uploadJournalS3)



module.exports = { journalRoutes };

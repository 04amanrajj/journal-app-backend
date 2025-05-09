const express = require("express");
const multer = require("multer");


const {
  createJournal,
  getJournals,
  editJournal,
  deleteJournal,
  uploadJournal
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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip') {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'), false);
    }
  }
});

journalRoutes.post("/upload", upload.single("file"), uploadJournal)

module.exports = { journalRoutes };

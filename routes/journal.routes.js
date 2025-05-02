const express = require("express");
const {
  createJournal,
  getJournals,
  editJournal,
  deleteJournal,
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

module.exports = { journalRoutes };

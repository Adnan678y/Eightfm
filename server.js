const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Load database
const dbPath = path.join(__dirname, "database.json");

const loadDB = () => JSON.parse(fs.readFileSync(dbPath, "utf8"));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));

// Get all stories
app.get("/api/all", (req, res) => {
    const db = loadDB();
    if (req.query.raw) return res.json(db);
    res.send(`<h1>All Stories</h1><pre>${JSON.stringify(db, null, 4)}</pre>`);
});

// Get latest episode for a story
app.get("/api/story/:id", (req, res) => {
    const { id } = req.params;
    const db = loadDB();
    if (!db[id]) return res.status(404).json({ error: "Story not found" });

    res.json(db[id]);
});

// Add a new story
app.post("/api/story", (req, res) => {
    const { name, id, Tid, message, episode, link } = req.body;
    if (!name || !id || !Tid || !episode || !link) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const db = loadDB();
    db[name] = { id, Tid, message, episode, link };
    saveDB(db);
    res.json({ success: true, message: "Story added" });
});

// Delete a story
app.delete("/api/story/:id", (req, res) => {
    const { id } = req.params;
    const db = loadDB();

    if (!db[id]) return res.status(404).json({ error: "Story not found" });
    
    delete db[id];
    saveDB(db);
    res.json({ success: true, message: "Story deleted" });
});

// Serve static frontend
app.use(express.static("public"));

// Start server
module.exports = app;

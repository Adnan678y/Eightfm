const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const DB_FILE = "database.json";

function getStoryData() {
    if (fs.existsSync(DB_FILE)) {
        return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    }
    return {};
}

function saveStoryData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4), "utf-8");
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/all", (req, res) => {
    res.json(getStoryData());
});

app.post("/addStory", (req, res) => {
    const { story, id, songId, serialNumber } = req.body;
    let stories = getStoryData();
    if (!story || !id || !songId || !serialNumber) return res.status(400).send("❌ Missing fields!");
    stories[story] = { id, songId, serialNumber };
    saveStoryData(stories);
    res.redirect("/");
});

app.post("/deleteStory", (req, res) => {
    const { story } = req.body;
    let stories = getStoryData();
    if (!stories[story]) return res.status(404).send("❌ Story not found!");
    delete stories[story];
    saveStoryData(stories);
    res.redirect("/");
});

app.post("/editStory", (req, res) => {
    const { oldStory, story, id, songId, serialNumber } = req.body;
    let stories = getStoryData();
    if (!stories[oldStory]) return res.status(404).send("❌ Story not found!");
    delete stories[oldStory];
    stories[story] = { id, songId, serialNumber };
    saveStoryData(stories);
    res.redirect("/");
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

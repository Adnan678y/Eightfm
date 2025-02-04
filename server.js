const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 📂 Read Database (`database.json`)
const getStoryData = () => {
    try {
        return JSON.parse(fs.readFileSync("database.json", "utf8"));
    } catch (error) {
        return {};
    }
};

// 📂 Read & Write `last_seen.json`
const getLastSeen = () => {
    try {
        return JSON.parse(fs.readFileSync("last_seen.json", "utf8"));
    } catch (error) {
        return {};
    }
};

const saveLastSeen = (story, episodeNumber) => {
    const lastSeen = getLastSeen();
    lastSeen[story] = episodeNumber;
    fs.writeFileSync("last_seen.json", JSON.stringify(lastSeen, null, 4));
};

// 📂 Fetch Latest Episode Data with Optional `songId` and `serialNumber`
const fetchLatestEpisode = async (recordId, songId, serialNumber) => {
    let url = `https://prod-eight-apis-1.api.eight.network/api/publish/record/${recordId}/audio/library/resume?limit=1000`;

    if (songId && serialNumber) {
        url += `&LastEvaluatedKey=%7B%22id%22%3A%22${recordId}%22%2C%22songId%22%3A%22${songId}%22%2C%22serialNumber%22%3A${serialNumber}%7D`;
    }

    const headers = {
        authority: "prod-eight-apis-1.api.eight.network",
        accept: "application/json, text/plain, */*",
        authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InZRUXpWTFBqdERiSzNGNGlGRGUzR3gyNU1ndjIiLCJwaG9uZSI6Iis5MTEiLCJpYXQiOjE3MzgxODUxODh9.9SOUesR1CiYWAyM4JRGMnDToQGFJt5zx5kCjtqI1Zvc",
        origin: "https://play.eight.network",
        referer: "https://play.eight.network/",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
    };

    try {
        const response = await axios.get(url, { headers });

        if (response.status === 200) {
            const data = response.data;
            if (!data.Items || data.Items.length === 0) {
                return null;
            }

            const latestEpisode = data.Items.reduce((max, item) =>
                item.serialNumber > max.serialNumber ? item : max
            );

            return {
                Name: latestEpisode.name,
                Link: latestEpisode.audio,
                Episode: latestEpisode.serialNumber,
                Tid: latestEpisode.tid || null
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
};

// 📌 HTML Form - Add New Story
app.get("/add-story", (req, res) => {
    res.sendFile(path.join(__dirname, "add-story.html"));
});

// 📌 API to Add New Story
app.post("/add-story", async (req, res) => {
    const { storyName, recordId, Tid, songId, serialNumber } = req.body;
    
    if (!storyName || !recordId || !Tid) {
        return res.status(400).send("⚠️ Please fill in all required fields.");
    }

    let stories = getStoryData();
    
    if (stories[storyName]) {
        return res.send("❌ Story already exists!");
    }

    // Save Story
    stories[storyName] = { id: recordId, Tid: Tid, songId: songId || null, serialNumber: serialNumber || null };
    
    fs.writeFileSync("database.json", JSON.stringify(stories, null, 4));

    // Fetch Latest Episode
    const latestEpisode = await fetchLatestEpisode(recordId, songId, serialNumber);

    if (latestEpisode) {
        res.json({
            message: `📖 New episode released for ${storyName}!`,
            ...latestEpisode,
            Tid: Tid
        });
    } else {
        res.send("❌ Failed to fetch latest episode.");
    }
});

// 📌 Get Latest Episode for a Story
app.get("/:story", async (req, res) => {
    const stories = getStoryData();
    const lastSeen = getLastSeen();
    const story = req.params.story;

    if (!stories[story]) {
        return res.status(404).json({ error: "Story not found in database." });
    }

    const { id, Tid, songId, serialNumber } = stories[story];
    const latestEpisode = await fetchLatestEpisode(id, songId, serialNumber);

    if (latestEpisode) {
        const lastSeenEpisode = lastSeen[story] || 0;

        if (latestEpisode.Episode <= lastSeenEpisode) {
            return res.json({
                message: `📖 No new episodes for ${story} yet. Last seen: Episode ${lastSeenEpisode}`
            });
        }

        saveLastSeen(story, latestEpisode.Episode);

        res.json({
            message: `📖 New episode released for ${story}!`,
            ...latestEpisode,
            Tid: Tid
        });
    } else {
        res.status(500).json({ error: "Failed to fetch latest episode." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});	

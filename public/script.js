document.addEventListener("DOMContentLoaded", () => { loadStories(); });

function loadStories() {
    fetch("/all")
        .then(res => res.json())
        .then(data => {
            let tableBody = document.querySelector("#storyTable tbody");
            tableBody.innerHTML = "";
            for (const [story, details] of Object.entries(data)) {
                let row = `
                    <tr>
                        <td>${story}</td>
                        <td>${details.id}</td>
                        <td>${details.songId}</td>
                        <td>${details.serialNumber}</td>
                        <td>
                            <button class="edit" onclick="editStory('${story}', '${details.id}', '${details.songId}', '${details.serialNumber}')">✏️ Edit</button>
                            <form action="/deleteStory" method="POST" style="display:inline;">
                                <input type="hidden" name="story" value="${story}">
                                <button class="delete" type="submit">🗑 Delete</button>
                            </form>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            }
        })
        .catch(err => console.error("Error loading stories:", err));
}

function editStory(story, id, songId, serialNumber) {
    document.getElementById("oldStory").value = story;
    document.getElementById("story").value = story;
    document.getElementById("id").value = id;
    document.getElementById("songId").value = songId;
    document.getElementById("serialNumber").value = serialNumber;
    document.getElementById("storyForm").action = "/editStory";
}

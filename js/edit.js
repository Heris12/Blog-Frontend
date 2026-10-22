import {request} from "./api.js";
import {Auth} from "./auth.js";

let postId = null;

document.addEventListener("DOMContentLoaded", async () => {
    await Auth.init(true);
    if (!["admin", "author"].includes(Auth.user?.role)) {
        alert("Only admins and authors can edit posts.");
        window.location.replace("index.html");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get("id");

    if (!postId) {
        window.location.href = "index.html"; // Redirect to home if no id is provided
        return;
    }

    //load the post data to pre-fill the form
    try {
        const response = await request(`/blogs/${postId}`);
        const authorId = response.author?._id ?? response.author;
        if (Auth.user.role === "author" && String(authorId) !== String(Auth.user.id)) {
            alert("You can only edit your own posts.");
            window.location.replace("index.html");
            return;
        }
        document.getElementById("title").value = response.title;
        document.getElementById("body").value = response.body;
    } catch (error) {
        console.error("Error loading post:", error);
        alert("Error loading post. Please try again later.");
    }

    //handle form submission for editing the post
    const form = document.getElementById("edit-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("title").value;
            const body = document.getElementById("body").value;

            try {
                const response = await request(`/blogs/${postId}`, {
                    method: "PUT",
                    body: JSON.stringify({ title, body }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                    if(response.success) {
                        alert("Post updated successfully!");
                        window.location.href = `article.html?id=${postId}`;
                    }else {
                        alert("Failed to update post. Please try again.");
                    }
            } catch (error) {
                console.error("Error updating post:", error);
                alert("Error updating post. Please try again later.");
            };
        });
    }
});

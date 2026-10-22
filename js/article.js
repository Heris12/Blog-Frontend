import {request, escapeHTML} from "./api.js";
import {Auth} from "./auth.js";
let postId = null;

document.addEventListener("DOMContentLoaded", async () => {
    await Auth.init(true);
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get("id");

    if (!postId) {
        window.location.href = "index.html"; // Redirect to home if no id is provided
        return;
    }

    //load the post data to pre-fill the form
    loadArticle(postId);

    async function loadArticle(id) {
        const container = document.getElementById("article-container");
        try {
            const response = await request(`/blogs/${id}`);
            const post = response; // Assuming the response is a single post object
            const authorId = post.author?._id ?? post.author;
            const canEditPost = Auth.user?.role === "admin"
                || (Auth.user?.role === "author" && String(authorId) === String(Auth.user.id));
            const canDeletePost = canEditPost;
            const publishedDate = new Date(post.createdAt);
            const publishedDateLabel = Number.isNaN(publishedDate.getTime())
                ? "date unavailable"
                : publishedDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
            const publishedDateIso = Number.isNaN(publishedDate.getTime()) ? "" : publishedDate.toISOString();

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2>${escapeHTML(post.title)}</h2>
                        <p class="post-meta">
                            By <strong>${escapeHTML(post.author?.username || "Unknown author")}</strong>
                            <span aria-hidden="true"> · </span>
                            <time datetime="${escapeHTML(publishedDateIso)}">Published ${escapeHTML(publishedDateLabel)}</time>
                        </p>
                    </div>
                    ${canEditPost || canDeletePost ? `
                        <div>
                            ${canEditPost ? `<a href="edit.html?id=${encodeURIComponent(post._id)}" class="btn-edit" style="background-color: #007bff; color: #fff; padding: 5px 20px; border: none;text-decoration: none; border-radius: 4px; cursor: pointer; margin: 10px;">Edit</a>` : ""}
                            ${canDeletePost ? `<button type="button" style="background-color: #dc3545; color: #fff; padding: 5px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 10px;" class="btn-delete" id="delete-btn">Delete</button>` : ""}
                        </div>
                    ` : ""}
                </div>
                <p style="margin-top: 1.5rem; white-space: pre-wrap;">${escapeHTML(post.body)}</p>
            `;

            if (canDeletePost) {
                document.getElementById("delete-btn").addEventListener("click", deletePost);
            }
            
        } catch (error) {
            container.innerHTML = "<p>Error loading article. Please try again later.</p>";
            console.error("Error loading article:", error);
        }
    }

    //Handle delete button click
    async function deletePost() {
        if (confirm("Are you sure you want to delete this post?")) {
            try {
                await request(`/blogs/${postId}`, {
                    method: "DELETE"
                });
                alert("Post deleted successfully!");
                window.location.href = "index.html";
            } catch (error) {
                console.error("Error deleting post:", error);
                alert("Error deleting post. Please try again later.");
            }
        }
    }
});

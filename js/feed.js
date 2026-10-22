import {request, escapeHTML} from "./api.js";

document.addEventListener("DOMContentLoaded", loadPosts);

async function loadPosts() {
    const container = document.getElementById("post-list");

    try {
        const res = await request("/blogs");
        const posts = res; // Assuming the response is an array of posts

        if (posts.length === 0) {
            container.innerHTML = "<p>No posts available.</p>";
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post">
                <h2>${escapeHTML(post.title)}</h2>
                <p class="post-meta">
                    By <strong>${escapeHTML(post.author?.username || "Unknown author")}</strong>
                    <span aria-hidden="true"> · </span>
                    <time datetime="${escapeHTML(toIsoDate(post.createdAt))}">Published ${escapeHTML(formatDate(post.createdAt))}</time>
                </p>
                <p>${escapeHTML(post.body)}</p>

                <div>
                    <a href="article.html?id=${encodeURIComponent(post._id)}" class="btn-edit">Read Article</a>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error loading posts:", error);
        container.innerHTML = "<p>Error loading posts. Please try again later.</p>";
    }   

    function formatDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "date unavailable"
            : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }

    function toIsoDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toISOString();
    }
}    

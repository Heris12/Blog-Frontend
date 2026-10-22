import { request, escapeHTML } from "./api.js";
import { Auth } from "./auth.js";

document.addEventListener("DOMContentLoaded", loadMyPosts);

async function loadMyPosts() {
    await Auth.init(true);
    if (Auth.user?.role !== "author") {
        window.location.replace(Auth.user ? "index.html" : "login.html");
        return;
    }

    const container = document.getElementById("my-post-list");
    try {
        const posts = await request("/blogs/mine");
        if (!posts.length) {
            container.innerHTML = '<p>You have not published any posts yet. <a href="create.html">Create your first post</a>.</p>';
            return;
        }

        container.innerHTML = posts.map((post) => `
            <article class="post">
                <h2>${escapeHTML(post.title)}</h2>
                <p class="post-meta">
                    By <strong>${escapeHTML(post.author?.username || Auth.user.username)}</strong>
                    <span aria-hidden="true"> · </span>
                    <time datetime="${escapeHTML(toIsoDate(post.createdAt))}">Published ${escapeHTML(formatDate(post.createdAt))}</time>
                </p>
                <p>${escapeHTML(post.body)}</p>
                <div class="my-post-actions">
                    <a href="article.html?id=${encodeURIComponent(post._id)}" class="btn-edit">View published post</a>
                    <a href="edit.html?id=${encodeURIComponent(post._id)}" class="btn-edit">Edit post</a>
                </div>
            </article>
        `).join("");
    } catch (error) {
        console.error("Error loading your posts:", error);
        container.innerHTML = `<p class="post-load-error">${escapeHTML(error.message || "Unable to load your posts. Please try again.")}</p>`;
    }
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

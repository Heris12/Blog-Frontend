import { request, escapeHTML } from "./api.js";
import { Auth } from "./auth.js";

const byId = (id) => document.getElementById(id);
let currentAdminId = null;
let currentAdminName = "";
let users = [];

document.addEventListener("DOMContentLoaded", initializeAdmin);

async function initializeAdmin() {
    await Auth.init(true);

    if (Auth.user?.role !== "admin") {
        window.location.replace(Auth.user
            ? "login.html?error=admin-only"
            : "login.html?error=admin-required");
        return;
    }

    currentAdminId = String(Auth.user.id);
    currentAdminName = Auth.user.username;
    document.querySelector(".admin-dashboard").style.display = "grid";
    byId("admin-logout").addEventListener("click", () => Auth.logout());
    const menuToggle = byId("admin-menu-toggle");
    const adminNavigation = byId("admin-navigation");
    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Open admin menu" : "Close admin menu");
        adminNavigation.classList.toggle("is-open", !isOpen);
    });
    adminNavigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            adminNavigation.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open admin menu");
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            adminNavigation.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open admin menu");
        }
    });
    byId("user-form").addEventListener("submit", saveUser);
    byId("user-cancel").addEventListener("click", resetUserForm);
    byId("user-list").addEventListener("click", handleUserAction);
    byId("post-search-form").addEventListener("submit", (event) => {
        event.preventDefault();
        loadAdminPosts(byId("post-author-search").value.trim());
    });
    byId("my-posts-filter").addEventListener("click", () => {
        byId("post-author-search").value = currentAdminName;
        loadAdminPosts(currentAdminName);
    });
    byId("all-posts-filter").addEventListener("click", () => {
        byId("post-author-search").value = "";
        loadAdminPosts();
    });
    byId("admin-post-list").addEventListener("click", handlePostAction);

    await refreshDashboard();
}

async function refreshDashboard() {
    const loadResults = await Promise.allSettled([
        loadOverview(),
        loadUsers(),
        loadAdminPosts()
    ]);
    if (loadResults.some((result) => result.status === "rejected")) {
        console.error("One or more dashboard sections failed to load:", loadResults);
    }
}

async function loadAdminPosts(authorName = "") {
    const tableBody = byId("admin-post-list");
    const message = byId("post-list-message");
    tableBody.innerHTML = '<tr><td colspan="4">Loading posts...</td></tr>';
    message.textContent = "";
    message.dataset.state = "";

    try {
        const query = authorName ? `?author=${encodeURIComponent(authorName)}` : "";
        const response = await request(`/admin/posts${query}`);
        renderAdminPosts(response.data);
        if (authorName) {
            message.textContent = `Showing posts by authors or admins matching “${authorName}”.`;
        } else {
            message.textContent = "Showing all posts.";
        }
    } catch (error) {
        console.error("Error loading admin posts:", error);
        tableBody.innerHTML = `<tr><td colspan="4" class="admin-load-error">${escapeHTML(error.message || "Unable to load posts.")}</td></tr>`;
        message.textContent = "Post list could not be loaded.";
        message.dataset.state = "error";
    }
}

function renderAdminPosts(posts) {
    const tableBody = byId("admin-post-list");
    if (!posts.length) {
        tableBody.innerHTML = '<tr><td colspan="4">No posts found for this search.</td></tr>';
        return;
    }

    tableBody.innerHTML = posts.map((post) => `
        <tr>
            <td><strong>${escapeHTML(post.title)}</strong></td>
            <td>${escapeHTML(post.author?.username || "Unknown author")} <span class="role-badge">${escapeHTML(roleLabel(post.author?.role || ""))}</span></td>
            <td>${escapeHTML(formatDate(post.createdAt))}</td>
            <td class="admin-user-actions">
                <a class="admin-action-button" href="article.html?id=${encodeURIComponent(post._id)}">View</a>
                <a class="admin-action-button" href="edit.html?id=${encodeURIComponent(post._id)}">Edit</a>
                <button type="button" class="admin-action-button admin-delete-button" data-action="delete-post" data-post-id="${escapeHTML(String(post._id))}">Delete</button>
            </td>
        </tr>
    `).join("");
}

async function handlePostAction(event) {
    const button = event.target.closest('button[data-action="delete-post"]');
    if (!button) return;

    const postId = button.dataset.postId;
    const postTitle = button.closest("tr").querySelector("td strong")?.textContent || "this post";
    if (!window.confirm(`Delete "${postTitle}"? This cannot be undone.`)) return;

    button.disabled = true;
    try {
        await request(`/blogs/${encodeURIComponent(postId)}`, { method: "DELETE" });
        await Promise.all([loadAdminPosts(byId("post-author-search").value.trim()), loadOverview()]);
    } catch (error) {
        console.error("Error deleting post:", error);
        byId("post-list-message").textContent = error.message || "Unable to delete post.";
        byId("post-list-message").dataset.state = "error";
        button.disabled = false;
    }
}

async function loadOverview() {
    try {
        const response = await request("/admin/overview");
        const overview = response.data;
        byId("total-users").textContent = overview.totalUsers;
        byId("total-posts").textContent = overview.totalPosts;
        byId("total-authors").textContent = overview.totalAuthors;
        byId("sidebar-glance-summary").textContent =
            `${formatCount(overview.totalUsers, "community member")} · ${formatCount(overview.totalAuthors, "author")} · ${formatCount(overview.totalPosts, "post")}`;
        renderActivity(overview.updates);
    } catch (error) {
        console.error("Error loading dashboard overview:", error);
        byId("total-users").textContent = "—";
        byId("total-posts").textContent = "—";
        byId("total-authors").textContent = "—";
        byId("sidebar-glance-summary").textContent = "Overview unavailable. Refresh to try again.";
        byId("activity-list").innerHTML = `<p class="admin-load-error">${escapeHTML(error.message || "Unable to load recent activity.")}</p>`;
        throw error;
    }
}

async function loadUsers() {
    const tableBody = byId("user-list");
    tableBody.innerHTML = '<tr><td colspan="4">Loading users...</td></tr>';
    try {
        const response = await request("/admin/users");
        users = response.data;
        renderUsers();
    } catch (error) {
        console.error("Error loading users:", error);
        tableBody.innerHTML = `<tr><td colspan="4" class="admin-load-error">${escapeHTML(error.message || "Unable to load users.")}</td></tr>`;
        throw error;
    }
}

function renderUsers() {
    const tableBody = byId("user-list");
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No users to display yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = users.map((user) => {
        const userId = String(user._id);
        const isAdmin = user.role === "admin";
        const joined = formatDate(user.createdAt);
        return `
            <tr>
                <td><strong>${escapeHTML(user.username)}</strong><span class="admin-user-email">${escapeHTML(user.email)}</span></td>
                <td><span class="role-badge role-${escapeHTML(user.role)}">${escapeHTML(roleLabel(user.role))}</span></td>
                <td>${escapeHTML(joined)}</td>
                <td class="admin-user-actions">
                    <button type="button" class="admin-action-button" data-action="edit" data-user-id="${escapeHTML(userId)}">Edit</button>
                    ${isAdmin ? "" : `<button type="button" class="admin-action-button admin-delete-button" data-action="delete" data-user-id="${escapeHTML(userId)}">Delete</button>`}
                </td>
            </tr>
        `;
    }).join("");
}

function renderActivity(updates) {
    const activity = byId("activity-list");
    if (!updates?.length) {
        activity.innerHTML = '<p class="activity-empty">No recent updates yet. New accounts and posts will appear here.</p>';
        return;
    }

    activity.innerHTML = updates.map((update) => `
        <article class="activity-entry">
            <span class="activity-dot" aria-hidden="true"></span>
            <div>
                <p>${escapeHTML(update.label)}</p>
                <time datetime="${escapeHTML(new Date(update.date).toISOString())}">${escapeHTML(formatDateTime(update.date))}</time>
            </div>
        </article>
    `).join("");
}

async function saveUser(event) {
    event.preventDefault();
    const form = byId("user-form");
    const id = byId("user-id").value;
    const password = byId("user-password").value;
    const roleControl = byId("user-role");
    const submitButton = byId("user-submit");
    const message = byId("user-form-message");
    const payload = {
        username: byId("user-username").value.trim(),
        email: byId("user-email").value.trim().toLowerCase()
    };

    if (password) payload.password = password;
    if (!roleControl.disabled) payload.role = roleControl.value;
    if (!id && !password) {
        showFormMessage("A password is required for a new user.", "error");
        return;
    }

    submitButton.disabled = true;
    message.textContent = "";
    message.dataset.state = "";
    try {
        await request(id ? `/admin/users/${encodeURIComponent(id)}` : "/admin/users", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        resetUserForm();
        showFormMessage(id ? "User updated successfully." : "User created successfully.", "success");
        await refreshDashboard();
    } catch (error) {
        console.error("Error saving user:", error);
        showFormMessage(error.message || "Unable to save user.", "error");
    } finally {
        submitButton.disabled = false;
    }
}

async function handleUserAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const user = users.find((item) => String(item._id) === button.dataset.userId);
    if (!user) {
        showFormMessage("That user is no longer available. Refresh the list and try again.", "error");
        return;
    }

    if (button.dataset.action === "edit") {
        startEditingUser(user);
        return;
    }
    if (button.dataset.action !== "delete") return;

    if (String(user._id) === currentAdminId) {
        showFormMessage("You cannot delete your own administrator account.", "error");
        return;
    }
    if (!window.confirm(`Delete the account for ${user.username}? This cannot be undone.`)) return;

    button.disabled = true;
    try {
        await request(`/admin/users/${encodeURIComponent(user._id)}`, { method: "DELETE" });
        if (byId("user-id").value === String(user._id)) resetUserForm();
        showFormMessage("User deleted successfully.", "success");
        await refreshDashboard();
    } catch (error) {
        console.error("Error deleting user:", error);
        showFormMessage(error.message || "Unable to delete user.", "error");
        button.disabled = false;
    }
}

function startEditingUser(user) {
    byId("user-id").value = user._id;
    byId("user-username").value = user.username;
    byId("user-email").value = user.email;
    byId("user-password").value = "";
    byId("user-password").required = false;
    byId("password-hint").textContent = "(leave blank to keep the current password)";

    const roleControl = byId("user-role");
    const isAdminAccount = user.role === "admin" || String(user._id) === currentAdminId;
    if (isAdminAccount && !roleControl.querySelector('option[value="admin"]')) {
        roleControl.add(new Option("Administrator", "admin"));
    } else if (!isAdminAccount) {
        roleControl.querySelector('option[value="admin"]')?.remove();
    }
    roleControl.value = isAdminAccount ? "admin" : user.role;
    roleControl.disabled = isAdminAccount;
    byId("user-submit").textContent = "Save changes";
    byId("user-cancel").hidden = false;
    showFormMessage(user.role === "admin"
        ? "Administrator accounts cannot be assigned a different role."
        : "", "");
    byId("user-form").scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetUserForm() {
    byId("user-form").reset();
    byId("user-id").value = "";
    byId("user-password").required = true;
    byId("password-hint").textContent = "(required for new users)";
    byId("user-role").querySelector('option[value="admin"]')?.remove();
    byId("user-role").disabled = false;
    byId("user-submit").textContent = "Add user";
    byId("user-cancel").hidden = true;
    showFormMessage("", "");
}

function showFormMessage(text, state) {
    const message = byId("user-form-message");
    message.textContent = text;
    message.dataset.state = state;
}

function roleLabel(role) {
    return { user: "Reader", author: "Author", admin: "Admin" }[role] || role;
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}

function formatDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Unknown date"
        : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatCount(count, label) {
    return `${Number(count).toLocaleString()} ${label}${Number(count) === 1 ? "" : "s"}`;
}

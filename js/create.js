import {request} from "./api.js";
import {Auth} from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    await Auth.init(true);
    const userRole = Auth.user?.role;
    if (!Auth.isAuthenticated() || (userRole !== "admin" && userRole !== "author")) {
        alert("You must be logged in as an admin or author to create a blog post.");
        window.location.href = "login.html";
        return;
    }

    if (userRole === "admin") {
        document.getElementById("admin-dashboard-link")?.removeAttribute("hidden");
    }

    const mainContainer = document.querySelector(".main-container");
    if (mainContainer) {
        mainContainer.style.display = "block";
    } else {
        console.error("Main container not found");
        return;
    }

    const form = document.getElementById("create-form");
    if (!form) {
        console.error("Create form not found");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = document.getElementById("title").value;
        const body = document.getElementById("body").value;

        try {
            await request("/blogs", {
                method: "POST",
                body: JSON.stringify({ title, body })
            });
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error creating post:", error);
            alert(error.message || "Error creating post. Please try again later.");
        }
    });
});

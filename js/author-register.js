import { request } from "./api.js";
import { Auth } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    await Auth.init(true);
    if (Auth.user?.role !== "admin") {
        window.location.replace(Auth.user
            ? "login.html?error=admin-only"
            : "login.html?error=admin-required");
        return;
    }

    const form = document.getElementById("author-register-form");
    const message = document.getElementById("author-register-message");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        message.textContent = "";
        message.dataset.state = "";

        try {
            await request("/admin/create-authors", {
                method: "POST",
                body: JSON.stringify({
                    username: document.getElementById("author-username").value.trim(),
                    email: document.getElementById("author-email").value.trim().toLowerCase(),
                    password: document.getElementById("author-password").value
                })
            });
            form.reset();
            message.textContent = "Author account created. They can now sign in with the email and password you set.";
            message.dataset.state = "success";
        } catch (error) {
            console.error("Error creating author account:", error);
            message.textContent = error.message || "Unable to create the author account.";
            message.dataset.state = "error";
        } finally {
            submitButton.disabled = false;
        }
    });
});

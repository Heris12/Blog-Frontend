import { Auth } from "./auth.js";

// This script handles the login form submission and user authentication process.
document.addEventListener("DOMContentLoaded", async () => {
    const loginError = document.getElementById("login-error");
    const errorCode = new URLSearchParams(window.location.search).get("error");
    const errorMessages = {
        "admin-only": "Admin access is restricted. Please sign in with an admin account.",
        "admin-required": "Please sign in with an admin account to access the admin page."
    };
    if (Object.hasOwn(errorMessages, errorCode)) {
        loginError.textContent = errorMessages[errorCode];
        loginError.hidden = false;
    }

    await Auth.init(true);

    if (Auth.isAuthenticated()) {
        redirectByRole(Auth.user.role);
    }

    document.getElementById("login-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            await Auth.login(
                document.getElementById("email").value.trim().toLowerCase(),
                document.getElementById("password").value
            );
            // setTimeout(() => {
            //     window.location.href = "index.html";
            // }, 1000);
            redirectByRole(Auth.user.role);
        } catch (error) {
            alert(error.message);
        }
    });
});

function redirectByRole(role) {
    if (role === "admin") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "index.html";
    }
}

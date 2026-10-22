import { Auth } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    await Auth.init(true);

    if (Auth.isAuthenticated()) {
        window.location.href = "login.html";
    }

    document.getElementById("register-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            await Auth.register(
                document.getElementById("username").value.trim(),
                document.getElementById("email").value.trim().toLowerCase(),
                document.getElementById("password").value
            );
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
        } catch (error) {
            alert(error.message);
        }
    });
});

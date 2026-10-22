import { Auth } from "./auth.js";
import { escapeHTML } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    await Auth.init(true);
    const navLinks = document.getElementById("nav-link");
    const menuToggle = document.getElementById("nav-menu-toggle");
    if (!navLinks) {
        console.error("Navigation links container not found");
        return;
    }

    if (Auth.isAuthenticated()) {

        const role = Auth.user?.role;
        let roleLinks = '';
        if (role === 'author' || role === 'admin') {
            roleLinks += `<li><a href="create.html">Create Blog</a></li>`;
        }
        if (role === "admin") {
            roleLinks += `<li><a href="admin.html">Admin Dashboard</a></li>`;
        } else if (role === "author") {
            roleLinks += `<li><a href="my-posts.html">My Posts</a></li>`;
        }
        navLinks.innerHTML = `
            <ul>
                <li><a href="index.html">Home</a></li>
                ${roleLinks}        
                <li><span>Welcome ${escapeHTML(Auth.user.username)}</span></li>
                <li><a href="#" id="logout-link">Logout</a></li>
            </ul>
            `;
            document.getElementById("logout-link").addEventListener("click", (e) => {
                e.preventDefault();
                Auth.logout();
                window.location.href = "index.html";
            });
    } else {
            navLinks.innerHTML = `
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="login.html" class="btn-primary">Login</a></li>
                    <li><a href="register.html"class="btn-primary">Register</a></li>
                </ul>
                `;
        }

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isOpen));
            menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
            navLinks.classList.toggle("is-open", !isOpen);
        });

        navLinks.addEventListener("click", (event) => {
            if (event.target.closest("a")) closeMenu();
        });
        document.addEventListener("click", (event) => {
            if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
                menuToggle.focus();
            }
        });
        window.addEventListener("resize", () => {
            if (window.innerWidth > 640) closeMenu();
        });
    }

    function closeMenu() {
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Open navigation menu");
        navLinks.classList.remove("is-open");
    }
});
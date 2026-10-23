const API_BASE = window.location.hostname === "localhost" ? "http://localhost:3000/api" : 
"https://blog-backend-server-n9jo.onrender.com/api"



export async function request(endpoint, option = {}) {
    const headers = new Headers(option.headers || {});

    if (option.body !== undefined && !(option.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const token = localStorage.getItem("token");
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...option,
        headers
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        const message = isJson && data && data.message
            ? data.message
            : "An error occurred";
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
}

export function escapeHTML(str) {
    return str.replace(/[&<>"']/g,
        tag => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[tag]));
}

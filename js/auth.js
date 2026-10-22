import { request } from "./api.js";

const TOKEN_KEY = "token";
const LOGIN_PAGE = "login.html";

export const Auth = {
    user: null,

    async init(allowGuest = false) {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            Auth.user = null;
            if (!allowGuest) Auth.redirectToLogin();
            return null;
        }

        try {
            const response = await request("/auth/me", {
                method: "GET"
            });

            const payload = response.user ?? response.data ?? null;
            Auth.user = payload;
            return Auth.user;
        } catch (error) {
            console.error("Error fetching user data:", error);
            const status = error?.status ?? error?.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem(TOKEN_KEY);
            }

            Auth.user = null;
            if (!allowGuest) Auth.redirectToLogin();
            return null;
        }
    },

    async register(username, email, password) {
        try {
            const response = await request("/auth/register", {
                method: "POST",
                body: JSON.stringify({ username, email, password })
            });

            const payload = response.data ?? response;
            localStorage.removeItem(TOKEN_KEY);
            Auth.user = null;
            return payload;
        } catch (error) {
            console.error("Error registering user:", error);
            throw error;
        }
    },

    async login(email, password) {
        try {
            const response = await request("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            const payload = response.data ?? response;
            const token = payload.token;
            if (token) {
                localStorage.setItem(TOKEN_KEY, token);
            }

            Auth.user = payload.user ?? null;
            return Auth.user;
        } catch (error) {
            console.error("Error logging in:", error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        Auth.user = null;
        Auth.redirectToLogin();
    },

    isAuthenticated() {
        return Auth.user !== null;
    },

    redirectToLogin() {
        window.location.href = LOGIN_PAGE;
    }
};

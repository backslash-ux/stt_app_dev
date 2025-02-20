// src/utils/api.js
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";

// Create an Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Add a response interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const getUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    return apiClient.get(`/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Use Promise.all to fetch both endpoints concurrently
    const [transcriptionsRes, contentsRes] = await Promise.all([
        apiClient.get(`/history/`, { headers }),
        apiClient.get(`/content-history/`, { headers }),
    ]);

    return [
        { data: transcriptionsRes.data },
        { data: contentsRes.data },
    ];
};

export default apiClient;
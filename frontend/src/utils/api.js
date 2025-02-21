// src/utils/api.js
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Enable cookie handling
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const getUser = async () => {
    return apiClient.get(`/auth/me`);
};

export const fetchHistory = async () => {
    const [transcriptionsRes, contentsRes] = await Promise.all([
        apiClient.get(`/history/`),
        apiClient.get(`/content-history/`),
    ]);

    return [
        { data: transcriptionsRes.data },
        { data: contentsRes.data },
    ];
};

export default apiClient;
// src/utils/api.js
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";

export const getUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    return axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Use Promise.all to fetch both endpoints concurrently
    const [transcriptionsRes, contentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/history/`, { headers }),
        axios.get(`${API_BASE_URL}/content-history/`, { headers }),
    ]);

    return [
        { data: transcriptionsRes.data },
        { data: contentsRes.data },
    ];
};
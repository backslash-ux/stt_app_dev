// src/hooks/useHistory.js
import { useState, useEffect } from "react";
import { fetchHistory } from "../utils/api";

export default function useHistory(user) {
    const [transcriptionHistory, setTranscriptionHistory] = useState([]);
    const [contentHistory, setContentHistory] = useState([]);

    const refreshHistory = async () => {
        if (!user) return;
        try {
            // Fetch both histories concurrently
            const [transcriptions, contents] = await fetchHistory();
            setTranscriptionHistory(
                Array.isArray(transcriptions.data) ? transcriptions.data : []
            );
            setContentHistory(
                Array.isArray(contents.data) ? contents.data : []
            );
        } catch (error) {
            console.error("Error refreshing history:", error);
        }
    };

    // Fetch history once on mount (or when user changes)
    useEffect(() => {
        refreshHistory();
    }, [user]);

    return { transcriptionHistory, contentHistory, refreshHistory };
}
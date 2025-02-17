// src/components/ContentGeneration.js
"use client";

import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

export default function ContentGeneration({ transcriptionHistory, onJobUpdate, onDone }) {
    const [selectedTranscription, setSelectedTranscription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // If you want to provide some UI for the user to choose options, you can add them here.
    // For now, let's mimic the same hardcoded approach with a 'config' object:
    const configDefaults = {
        "Gaya Bahasa": "Formal",
        "Kepadatan Informasi": "Ringkas",
        "Sentimen Terhadap Objek Berita": "Netral",
        "Gaya Penyampaian": "Langsung",
        "Format Output": "Artikel",
        "Gaya Kutipan": "Langsung",
        "Pilihan Bahasa & Dialek": "Baku",
        "Penyuntingan Otomatis": "Tanpa Sensor",
        "Catatan Tambahan": ""
    };

    // Retrieve the API base URL from environment variables or fallback
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";

    const handleGenerateContent = async () => {
        if (!selectedTranscription) {
            alert("Please select a transcription first.");
            return;
        }

        // Create a local job ID using the browser's crypto API
        const localJobId = uuidv4();

        // Look up the selected transcription to get a title.
        const selectedObj = transcriptionHistory.find(
            (t) => t.id === parseInt(selectedTranscription)
        );
        const jobTitle = selectedObj
            ? selectedObj.title || selectedObj.transcript.slice(0, 30)
            : "Content Generation";

        // 1) Add job to queue as "pending" with a title.
        onJobUpdate({
            job_id: localJobId,
            status: "pending",
            type: "content-generation",
            title: `Content: ${jobTitle}`
        });

        setIsGenerating(true);

        try {
            const token = localStorage.getItem("token");

            // Build the request body
            // Include config with the same keys as in TranscriptionModal or your own
            const requestBody = {
                transcription_id: parseInt(selectedTranscription),
                transcription: selectedObj ? selectedObj.transcript : "",
                gaya_bahasa: configDefaults["Gaya Bahasa"],
                kepadatan_informasi: configDefaults["Kepadatan Informasi"],
                sentimen: configDefaults["Sentimen Terhadap Objek Berita"],
                gaya_penyampaian: configDefaults["Gaya Penyampaian"],
                format_output: configDefaults["Format Output"],
                gaya_kutipan: configDefaults["Gaya Kutipan"],
                bahasa: configDefaults["Pilihan Bahasa & Dialek"],
                penyuntingan: configDefaults["Penyuntingan Otomatis"],
                catatan_tambahan: configDefaults["Catatan Tambahan"],
                // Pass the entire config object
                config: configDefaults,
            };

            await axios.post(
                `${API_BASE_URL}/generate/`,
                requestBody,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // 2) Mark the job as "completed" (keep the title)
            onJobUpdate({
                job_id: localJobId,
                status: "completed",
                type: "content-generation",
                title: `Content: ${jobTitle}`
            });

            // Notify parent to refresh content history immediately
            if (onDone) {
                onDone();
            }
        } catch (error) {
            console.error("Error generating content:", error);
            alert("Failed to generate content.");

            // Mark the job as "failed" (keeping the title)
            onJobUpdate({
                job_id: localJobId,
                status: "failed",
                type: "content-generation",
                title: `Content: ${jobTitle}`
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full *:max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Generate Content</h2>
            <select
                value={selectedTranscription}
                onChange={(e) => setSelectedTranscription(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            >
                <option value="">Select a transcription</option>
                {transcriptionHistory.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                        {entry.transcript.slice(0, 30)}...
                    </option>
                ))}
            </select>
            <button
                onClick={handleGenerateContent}
                className="w-full bg-purple-500 text-white py-2 rounded-md mt-2"
                disabled={isGenerating}
            >
                {isGenerating ? "Generating..." : "Generate Content"}
            </button>
        </div>
    );
}
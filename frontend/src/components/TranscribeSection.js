// src/components/TranscribeSection.js
"use client";

import { useState } from "react";
import axios from "axios";
import { useJobs } from "../hooks/useJobs";

export default function TranscribeSection() {
    const { addJob } = useJobs();
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";

    const handleYouTubeTranscribe = async () => {
        if (!youtubeUrl) return;
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/youtube/process-youtube/`,
                { youtube_url: youtubeUrl },
                { withCredentials: true } // Use cookies instead of token
            );

            const { job_id, youtube_title } = response.data;

            addJob({
                job_id,
                title: `YouTube: ${youtube_title}`,
                type: "transcription",
                source: "youtube",
                status: "pending",
            });
        } catch (error) {
            console.error("Error starting transcription:", error);
            throw error; // Let caller handle the error if needed
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUploadTranscribe = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await axios.post(
                `${API_BASE_URL}/upload/upload-audio/`,
                formData,
                {
                    withCredentials: true, // Use cookies instead of token
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            addJob({
                job_id: response.data.job_id,
                title: file.name,
                type: "transcription",
                source: "upload",
                status: "pending",
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error; // Let caller handle the error if needed
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto">
            <h2 className="text-xl font-bold">Transcribe</h2>

            {/* YouTube Transcription */}
            <div className="space-y-2">
                <label htmlFor="youtubeUrl" className="block font-medium text-gray-700">
                    YouTube URL
                </label>
                <input
                    id="youtubeUrl"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                    onClick={handleYouTubeTranscribe}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors"
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Transcribe YouTube Video"}
                </button>
            </div>

            <hr className="border-gray-300 my-6" />

            {/* File Upload Transcription */}
            <div className="space-y-2">
                <label htmlFor="fileUpload" className="block font-medium text-gray-700">
                    Upload Audio/Video File
                </label>
                <input
                    id="fileUpload"
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-gray-700
                        file:mr-4 file:py-2 file:px-4
                        file:rounded file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-50 file:text-green-700
                        hover:file:bg-green-100"
                />
                <p className="text-xs text-gray-500">
                    Allowed file types: <strong>.mp3, .mp4, .wav, .webm</strong>
                </p>
                <button
                    onClick={handleUploadTranscribe}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition-colors"
                    disabled={loading}
                >
                    {loading ? "Uploading..." : "Upload & Transcribe File"}
                </button>
            </div>
        </div>
    );
}
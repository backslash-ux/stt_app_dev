// src/components/TranscriptionModal.js
"use client";

import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useJobs } from "../hooks/useJobs";
import DOMPurify from "dompurify";

// Helper to format seconds into mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${mins}:${secs}`;
}

export default function TranscriptionModal({
    isOpen,
    onClose,
    transcription,
    onDone = () => { }
}) {
    if (!isOpen || !transcription) return null;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const audioSrc = transcription.video_url.startsWith("http")
        ? transcription.video_url
        : `${apiBaseUrl}${transcription.video_url}`;
    const { addJob, updateJobStatus } = useJobs();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState("");
    const [selectedOptions, setSelectedOptions] = useState({
        "Gaya Bahasa": "Netral",
        "Kepadatan Informasi": "Ringkas",
        "Sentimen Terhadap Objek Berita": "Netral",
        "Gaya Penyampaian": "Langsung",
        "Format Output": "Artikel",
        "Gaya Kutipan": "Langsung",
        "Pilihan Bahasa & Dialek": "Baku",
        "Penyuntingan Otomatis": "Tanpa Sensor"
    });
    const [additionalNotes, setAdditionalNotes] = useState("");
    // console log segments
    console.log("Raw segments data:", transcription.segments);

    const dropdownOptions = {
        "Gaya Bahasa": ["Netral", "Santai", "Formal", "Sastra", "Provokatif"],
        "Kepadatan Informasi": ["Ringkas", "Sedang", "Lengkap", "Mendetail"],
        "Sentimen Terhadap Objek Berita": ["Netral", "Positif", "Negatif"],
        "Gaya Penyampaian": ["Langsung", "Naratif", "Analitis", "Deskriptif"],
        "Format Output": [
            "Artikel",
            "Berita",
            "Esai",
            "Opini",
            "Caption Instagram",
            "Caption Facebook",
            "Tweet/Cuitan"
        ],
        "Gaya Kutipan": ["Langsung", "Tidak Langsung", "Campuran"],
        "Pilihan Bahasa & Dialek": ["Baku", "Non-Baku", "Daerah", "Gaul"],
        "Penyuntingan Otomatis": ["Tanpa Sensor", "Disesuaikan", "Sensor Ketat"]
    };

    const handleOptionChange = (e) => {
        setSelectedOptions({ ...selectedOptions, [e.target.name]: e.target.value });
    };

    const handleGenerateContent = async () => {
        setLoading(true);
        setGeneratedContent("");
        setStep(3);

        const combinedConfig = {
            ...selectedOptions,
            "Catatan Tambahan": additionalNotes
        };

        const jobId = uuidv4();
        const job = {
            job_id: jobId,
            status: "pending",
            type: "content-generation",
            title: `Content: ${transcription.title || "Untitled"}`
        };

        addJob(job);

        try {
            updateJobStatus({ ...job, status: "processing" });
            const API_BASE_URL =
                process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";
            await axios.post(
                `${API_BASE_URL}/generate/`,
                {
                    job_id: jobId,
                    transcription_id: transcription.id,
                    transcription: transcription.transcript,
                    gaya_bahasa: selectedOptions["Gaya Bahasa"],
                    kepadatan_informasi: selectedOptions["Kepadatan Informasi"],
                    sentimen: selectedOptions["Sentimen Terhadap Objek Berita"],
                    gaya_penyampaian: selectedOptions["Gaya Penyampaian"],
                    format_output: selectedOptions["Format Output"],
                    gaya_kutipan: selectedOptions["Gaya Kutipan"],
                    bahasa: selectedOptions["Pilihan Bahasa & Dialek"],
                    penyuntingan: selectedOptions["Penyuntingan Otomatis"],
                    catatan_tambahan: additionalNotes,
                    config: combinedConfig
                },
                { withCredentials: true }
            );
            // (Assume polling updates generatedContent)
        } catch (error) {
            console.error("Error starting content generation:", error);
            updateJobStatus({ ...job, status: "failed" });
            if (onDone) onDone();
        } finally {
            setLoading(false);
        }
    };

    // Fallback function: use a temporary textarea to copy text
    const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand("copy");
            if (successful) {
                alert("Transcription copied to clipboard using fallback!");
            } else {
                alert("Fallback copy failed.");
            }
        } catch (err) {
            console.error("Fallback: Unable to copy", err);
        }
        document.body.removeChild(textArea);
    };

    // Handler to copy the full transcription text
    const handleCopyTranscription = () => {
        const text = transcription.transcript;
        if (
            typeof window !== "undefined" &&
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function"
        ) {
            navigator.clipboard
                .writeText(text)
                .then(() => alert("Transcription copied to clipboard!"))
                .catch((err) => {
                    console.error("Clipboard API writeText failed:", err);
                    fallbackCopyTextToClipboard(text);
                });
        } else {
            fallbackCopyTextToClipboard(text);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // NEW: Parse segments and display with time codes
    // ─────────────────────────────────────────────────────────────
    let segments = [];
    try {
        if (transcription.segments) {
            // If the stored JSON has extra escape characters, clean them up:
            const cleaned = transcription.segments.replace(/""/g, '"');
            segments = JSON.parse(cleaned);
        }
    } catch (err) {
        console.error("Error parsing transcription.segments:", err);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full h-[80vh] flex flex-col overflow-y-auto">
                <div
                    className={`flex flex-grow transition-all duration-300 ${step === 1
                        ? "grid-cols-1"
                        : step === 2
                            ? "grid-cols-2"
                            : "grid-cols-3"
                        } grid gap-4 overflow-hidden`}
                >
                    {/* Left column: Transcript and segments */}
                    <div className="p-4 overflow-y-auto">
                        <h2 className="text-2xl font-bold">
                            {transcription.title || "Transcription Details"}
                        </h2>
                        <p className="text-sm text-gray-600">Source: {transcription.source}</p>
                        {transcription.source === "YouTube" ? (
                            <iframe
                                className="aspect-video w-full h-auto my-2"
                                src={`https://www.youtube.com/embed/${new URL(
                                    transcription.video_url
                                ).searchParams.get("v")}`}
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <audio controls className="w-full my-2">
                                <source src={audioSrc} type="audio/mp3" />
                                Your browser does not support the audio element.
                            </audio>
                        )}
                        {/* Full transcript with copy button */}
                        <div>
                            <p className="text-gray-800 whitespace-pre-wrap">
                                {transcription.transcript}
                            </p>
                            <button
                                onClick={handleCopyTranscription}
                                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                            >
                                Copy Transcription
                            </button>
                        </div>

                        {/* "Generate Content" button for step 1 */}
                        {step === 1 && (
                            <button
                                onClick={() => setStep(2)}
                                className="mt-4 w-full bg-purple-500 text-white py-2 rounded-md"
                            >
                                Generate Content
                            </button>
                        )}

                        {/* Segmented transcript display */}
                        {segments.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">
                                    Segmented Transcript
                                </h3>
                                <ul className="space-y-1 text-sm">
                                    {segments.map((seg, idx) => {
                                        // Format the start time
                                        const mins = Math.floor(seg.start / 60)
                                            .toString()
                                            .padStart(2, "0");
                                        const secs = Math.floor(seg.start % 60)
                                            .toString()
                                            .padStart(2, "0");
                                        return (
                                            <li key={idx} className="text-gray-700">
                                                <span className="font-mono text-gray-500">
                                                    [{mins}:{secs}]{" "}
                                                </span>
                                                {seg.text}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Middle column: Generation configuration */}
                    {step > 1 && (
                        <div className="p-4 overflow-y-auto">
                            <h3 className="text-xl font-bold mb-2">Generate Content</h3>
                            {Object.keys(selectedOptions).map((key) => (
                                <div key={key} className="mb-2">
                                    <label className="block font-semibold">{key}:</label>
                                    <select
                                        name={key}
                                        value={selectedOptions[key]}
                                        onChange={handleOptionChange}
                                        className="border rounded p-2 w-full bg-white"
                                    >
                                        {dropdownOptions[key].map((opt) => (
                                            <option key={`${key}-${opt}`} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                            <div className="mb-2">
                                <label className="block font-semibold">Catatan Tambahan:</label>
                                <textarea
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    className="border rounded p-2 w-full bg-white"
                                    placeholder="Masukkan catatan tambahan (opsional)"
                                    rows={3}
                                />
                            </div>
                            <button
                                onClick={handleGenerateContent}
                                className="mt-4 w-full bg-green-500 text-white py-2 rounded-md"
                                disabled={loading}
                            >
                                {loading ? "Generating..." : "Generate"}
                            </button>
                        </div>
                    )}

                    {/* Right column: Generated content (if any) */}
                    {step === 3 && (
                        <div className="p-4 overflow-y-auto">
                            <h3 className="text-xl font-bold">Generated Content</h3>
                            <div className="border p-4 rounded-lg bg-gray-50">
                                <div
                                    className="generated-content"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(generatedContent)
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="flex justify-between mt-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="bg-gray-500 text-white py-2 px-4 rounded-md"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-red-500 text-white py-2 px-4 rounded-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
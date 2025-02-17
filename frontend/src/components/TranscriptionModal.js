// src/components/TranscriptionModal.js
"use client";

import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useJobs } from "../hooks/useJobs"; // Import the jobs context
import DOMPurify from "dompurify";

export default function TranscriptionModal({
    isOpen,
    onClose,
    transcription,
    onDone = () => { },
}) {
    if (!isOpen || !transcription) return null;

    // Use global jobs context instead of a passed prop
    const { addJob, updateJobStatus } = useJobs();

    const [step, setStep] = useState(1); // 1: Transcription, 2: Config, 3: Generated Content
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
        "Penyuntingan Otomatis": "Tanpa Sensor",
    });
    const [additionalNotes, setAdditionalNotes] = useState("");

    const dropdownOptions = {
        "Gaya Bahasa": ["Netral", "Santai", "Formal", "Sastra", "Provokatif"],
        "Kepadatan Informasi": ["Ringkas", "Sedang", "Lengkap", "Mendetail"],
        "Sentimen Terhadap Objek Berita": ["Netral", "Positif", "Negatif"],
        "Gaya Penyampaian": ["Langsung", "Naratif", "Analitis", "Deskriptif"],
        "Format Output": ["Artikel", "Berita", "Esai", "Opini", "Caption Instagram", "Caption Facebook", "Tweet/Cuitan"],
        "Gaya Kutipan": ["Langsung", "Tidak Langsung", "Campuran"],
        "Pilihan Bahasa & Dialek": ["Baku", "Non-Baku", "Daerah", "Gaul"],
        "Penyuntingan Otomatis": ["Tanpa Sensor", "Disesuaikan", "Sensor Ketat"],
    };

    const handleOptionChange = (e) => {
        setSelectedOptions({ ...selectedOptions, [e.target.name]: e.target.value });
    };

    const handleGenerateContent = async () => {
        setLoading(true);
        setGeneratedContent("");
        setStep(3); // Move to generated content column

        // Combine the config options + additional notes
        const combinedConfig = {
            ...selectedOptions,
            "Catatan Tambahan": additionalNotes,
        };

        // Generate a unique job ID
        const jobId = uuidv4();
        const job = {
            job_id: jobId,
            status: "pending",
            type: "content-generation",
            title: `Content: ${transcription.title || "Untitled"}`,
        };

        // Add job with "pending" status to the global jobs list
        addJob(job);

        try {
            // Update job to "processing" as we start the API call
            updateJobStatus({ ...job, status: "processing" });

            const token = localStorage.getItem("token");
            const API_BASE_URL =
                process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";
            const response = await axios.post(
                `${API_BASE_URL}/generate/`,
                {
                    job_id: jobId, // Include the job ID here
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
                    config: combinedConfig, // <---- pass combined config here
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setGeneratedContent(response.data.article);

            // Update job status to "completed" on success
            updateJobStatus({ ...job, status: "completed" });
            if (onDone) onDone();
        } catch (error) {
            console.error("Error generating content:", error);
            // Update job status to "failed" if there is an error
            updateJobStatus({ ...job, status: "failed" });
            if (onDone) onDone();
        }

        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full h-[80vh] flex flex-col">
                {/* Scrollable Content Area */}
                <div
                    className={`flex flex-grow transition-all duration-300 ${step === 1
                        ? "grid-cols-1"
                        : step === 2
                            ? "grid-cols-2"
                            : "grid-cols-3"
                        } grid gap-4 overflow-hidden`}
                >
                    {/* Column 1: Transcription Info */}
                    <div className="p-4 overflow-y-auto">
                        <h2 className="text-2xl font-bold">
                            {transcription.title || "Transcription Details"}
                        </h2>
                        <p className="text-sm text-gray-600">
                            Source: {transcription.source}
                        </p>

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
                                <source
                                    src={transcription.video_url}
                                    type="audio/mp3"
                                />
                                Your browser does not support the audio element.
                            </audio>
                        )}

                        <p className="text-gray-800 whitespace-pre-wrap">
                            {transcription.transcript}
                        </p>

                        {step === 1 && (
                            <button
                                onClick={() => setStep(2)}
                                className="mt-4 w-full bg-purple-500 text-white py-2 rounded-md"
                            >
                                Generate Content
                            </button>
                        )}
                    </div>

                    {/* Column 2: Content Generation Config */}
                    {step > 1 && (
                        <div className="p-4 overflow-y-auto">
                            <h3 className="text-xl font-bold">Generate Content</h3>
                            {Object.keys(selectedOptions).map((key) => (
                                <div key={key} className="mb-2">
                                    <label className="block font-semibold">
                                        {key}:
                                    </label>
                                    <select
                                        name={key}
                                        value={selectedOptions[key]}
                                        onChange={handleOptionChange}
                                        className="border rounded p-2 w-full bg-white"
                                    >
                                        {dropdownOptions[key].map((opt) => (
                                            <option
                                                key={`${key}-${opt}`}
                                                value={opt}
                                            >
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                            {/* Textarea for Additional Notes */}
                            <div className="mb-2">
                                <label className="block font-semibold">
                                    Catatan Tambahan:
                                </label>
                                <textarea
                                    value={additionalNotes}
                                    onChange={(e) =>
                                        setAdditionalNotes(e.target.value)
                                    }
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

                    {/* Column 3: Generated Content (Rich Text Output) */}
                    {step === 3 && (
                        <div className="p-4 overflow-y-auto">
                            <h3 className="text-xl font-bold">
                                Generated Content
                            </h3>
                            <div className="border p-4 rounded-lg bg-gray-50">
                                {/* Sanitize the HTML output using DOMPurify */}
                                <div
                                    className="generated-content"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            DOMPurify.sanitize(
                                                generatedContent
                                            ),
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Back / Close Button */}
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
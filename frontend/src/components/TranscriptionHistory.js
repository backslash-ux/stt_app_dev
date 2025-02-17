// src/components/TranscriptionHistory.js

"use client";

import { useState } from "react";
import TranscriptionModal from "./TranscriptionModal";

export default function TranscriptionHistory({ transcriptionHistory, onDone = () => { }, onJobUpdate = () => { }, }) {
    const [selectedTranscription, setSelectedTranscription] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Ensure transcriptionHistory is an array
    const safeTranscriptionHistory = Array.isArray(transcriptionHistory)
        ? transcriptionHistory
        : [];

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Transcribed Audio</h2>
            <div className="space-y-3">
                {safeTranscriptionHistory.length === 0 ? (
                    <p className="text-gray-500">No transcriptions found.</p>
                ) : (
                    safeTranscriptionHistory
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map((transcription) => (
                            <div
                                key={transcription.id}
                                className="bg-gray-50 p-4 rounded-lg shadow cursor-pointer overflow-hidden hover:bg-gray-100 transition"
                                onClick={() => {
                                    setSelectedTranscription(transcription);
                                    setIsModalOpen(true);
                                }}
                            >
                                <p className="font-semibold truncate text-gray-900">
                                    {transcription.title?.trim() || "Untitled Transcription"}
                                </p>
                                <p className="text-sm text-gray-600">{transcription.source}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(transcription.created_at).toLocaleString()}
                                </p>
                            </div>
                        ))
                )}
            </div>

            {isModalOpen && selectedTranscription && (
                <TranscriptionModal
                    transcription={selectedTranscription}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onDone={onDone} // Now defined via default prop
                    onJobUpdate={onJobUpdate} // Forward to TranscriptionModal
                />
            )}
        </div>
    );
}
// src/components/ContentHistory.js

"use client";

import { useState } from "react";
import ContentModal from "./ContentModal";

export default function ContentHistory({ contentHistory }) {
    const [selectedContent, setSelectedContent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Content Generation History</h2>
            {contentHistory.length === 0 ? (
                <p>No generated content found.</p>
            ) : (
                [...contentHistory]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((entry) => (
                        <div
                            key={entry.id}
                            className="border-b py-2 cursor-pointer hover:bg-gray-100 transition"
                            onClick={() => {
                                setSelectedContent(entry);
                                setIsModalOpen(true);
                            }}
                        >
                            <p className="font-semibold">
                                {entry.transcription_title || "Unknown Source"}
                            </p>
                            <p className="text-sm text-gray-600">
                                {new Date(entry.created_at).toLocaleString()}
                            </p>
                        </div>
                    ))
            )}

            {isModalOpen && (
                <ContentModal
                    content={selectedContent}
                    onClose={() => setIsModalOpen(false)}
                    isOpen={isModalOpen}
                />
            )}
        </div>
    );
}
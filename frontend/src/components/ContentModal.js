// src/components/ContentModal.js
"use client";

import React from "react";
import DOMPurify from "dompurify";

export default function ContentModal({ isOpen, onClose, content }) {
    if (!isOpen || !content) return null;

    // Attempt to parse the config if it comes in as a string:
    let configObj = {};
    try {
        configObj =
            typeof content.config === "string"
                ? JSON.parse(content.config)
                : content.config || {};
    } catch (e) {
        console.error("Error parsing config:", e);
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Generated Content</h2>

                {/* Two-column layout (30% : 70%) with flexible, scrollable columns */}
                <div className="flex-1 grid grid-cols-[30%,70%] gap-4 overflow-hidden">

                    {/* Column 1: Info & Config */}
                    <div className="flex flex-col h-full border-r pr-4 overflow-y-auto">
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Transcription Source:</strong>{" "}
                            {content.transcription_title || content.title || "Unknown"}
                        </p>

                        <p className="text-sm text-gray-600 mb-4">
                            <strong>Created At:</strong>{" "}
                            {new Date(content.created_at).toLocaleString()}
                        </p>

                        {Object.keys(configObj).length > 0 ? (
                            <div className="border p-4 rounded-md bg-gray-50 mb-4">
                                <h3 className="text-lg font-bold mb-2">Your Configuration:</h3>
                                <ul className="list-disc pl-4">
                                    {Object.entries(configObj).map(([key, value]) => (
                                        <li key={key}>
                                            <strong>{key}:</strong> {value}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="border p-4 rounded-md bg-gray-50 mb-4">
                                <p>No configuration found.</p>
                            </div>
                        )}
                    </div>

                    {/* Column 2: Generated Content */}
                    <div className="flex flex-col h-full overflow-y-auto">
                        <div className="border p-4 bg-gray-100 rounded-md flex-1 overflow-y-auto">
                            <div
                                className="generated-content"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(content.generated_content),
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Close button at the bottom */}
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
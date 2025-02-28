// src/components/ContentModal.js
"use client";

import React from "react";
import DOMPurify from "dompurify";

export default function ContentModal({ isOpen, onClose, content }) {
    if (!isOpen || !content) return null;

    // Attempt to parse configuration from content
    let configObj = {};
    try {
        configObj =
            typeof content.config === "string"
                ? JSON.parse(content.config)
                : content.config || {};
    } catch (e) {
        console.error("Error parsing config:", e);
    }

    // Fallback function using document.execCommand to copy HTML
    const fallbackCopyHtmlToClipboard = (html) => {
        const tempElement = document.createElement("div");
        tempElement.style.position = "absolute";
        tempElement.style.left = "-9999px";
        tempElement.style.top = "0";
        tempElement.innerHTML = html;
        tempElement.contentEditable = true;
        document.body.appendChild(tempElement);

        const range = document.createRange();
        range.selectNodeContents(tempElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        try {
            const successful = document.execCommand("copy");
            if (successful) {
                alert("Generated content copied using fallback!");
            } else {
                alert("Fallback copy failed.");
            }
        } catch (err) {
            console.error("Fallback: Unable to copy", err);
        }
        document.body.removeChild(tempElement);
    };

    // Function to handle copying the generated content
    const handleCopy = async () => {
        const htmlContent = content.generated_content;
        // Check if running in a browser
        if (typeof window === "undefined") {
            alert("Clipboard API is not available in this environment.");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.write) {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        "text/html": new Blob([htmlContent], { type: "text/html" }),
                        "text/plain": new Blob(
                            [htmlContent.replace(/<[^>]+>/g, "")],
                            { type: "text/plain" }
                        )
                    })
                ]);
                alert("Generated content copied with rich text formatting!");
            } catch (err) {
                console.error("Clipboard API write failed:", err);
                // Use fallback if Clipboard API fails (e.g. on HTTP)
                fallbackCopyHtmlToClipboard(htmlContent);
            }
        } else {
            // Clipboard API not available; use fallback
            fallbackCopyHtmlToClipboard(htmlContent);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Generated Content</h2>

                {/* Two-column layout (30% : 70%) */}
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
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold">Generated Content</h3>
                            {/* Always show the copy button */}
                            <button
                                onClick={handleCopy}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="border p-4 bg-gray-100 rounded-md flex-1 overflow-y-auto">
                            <div
                                className="generated-content"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(content.generated_content)
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Close button */}
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
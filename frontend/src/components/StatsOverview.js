// src/components/StatsOverview.js
"use client";
// ^ If you need to use state/hooks or other client-side features

export default function StatsOverview({ transcriptionCount, contentCount }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-bold mb-2">Stats Overview</h3>
            <p className="text-gray-600">
                <strong>Transcriptions:</strong> {transcriptionCount}
            </p>
            <p className="text-gray-600">
                <strong>Generated Content:</strong> {contentCount}
            </p>
        </div>
    );
}
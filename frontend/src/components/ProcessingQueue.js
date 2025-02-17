// src/components/ProcessingQueue.js
"use client";

import { useEffect } from "react";

export default function ProcessingQueue({ processingQueue }) {
    useEffect(() => {
        console.log("🟢 ProcessingQueue Updated:", processingQueue);
    }, [processingQueue]);

    // Sort the jobs by created_at descending so the newest job is first
    const sortedJobs = (processingQueue || []).slice().sort((a, b) => {
        // If either is missing a created_at, treat that as "older" (just in case)
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
    });

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Ongoing Jobs</h2>
            <div className="space-y-3">
                {sortedJobs.length > 0 ? (
                    sortedJobs.map((job) => (
                        <div
                            key={job.job_id}
                            className={`p-4 rounded-lg shadow cursor-pointer transition ${job.status === "processing" ? "bg-blue-100" : "bg-gray-50"
                                } hover:bg-gray-200`}
                        >
                            <p className="font-semibold">{job.title || "Untitled Job"}</p>
                            <p className="text-xs text-gray-500">Status: {job.status}</p>

                            {/* Show creation time if available */}
                            {job.created_at && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Created: {new Date(job.created_at).toLocaleString()}
                                </p>
                            )}

                            {/* Show completion time if job is completed */}
                            {job.status === "completed" && job.completed_at && (
                                <p className="text-xs text-gray-400">
                                    Completed: {new Date(job.completed_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No ongoing jobs.</p>
                )}
            </div>
        </div>
    );
}
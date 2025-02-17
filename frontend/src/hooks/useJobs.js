// src/hooks/useJobs.js
"use client";
import axios from "axios";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export function ProcessingQueue({ processingQueue }) {
    useEffect(() => {
        console.log("🟢 ProcessingQueue Updated:", processingQueue);
    }, [processingQueue]);

    // Sort the jobs by created_at descending so the newest job is first
    const sortedJobs = (processingQueue || []).slice().sort((a, b) => {
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

                            {job.created_at && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Created: {new Date(job.created_at).toLocaleString()}
                                </p>
                            )}

                            {job.completed_at && job.status === "completed" && (
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

const JobsContext = createContext();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";
const JOBS_STORAGE_KEY = "processingQueue";

export function JobsProvider({ children }) {
    // Clear stale jobs from localStorage on mount so old job IDs are removed.
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(JOBS_STORAGE_KEY);
        }
    }, []);

    // Load initial queue state from localStorage if available.
    const [processingQueue, setProcessingQueue] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem(JOBS_STORAGE_KEY);
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.error("Error reading stored jobs:", error);
                return [];
            }
        }
        return []; // Return empty array during SSR
    });

    const queueRef = useRef(processingQueue);

    useEffect(() => {
        queueRef.current = processingQueue;
        if (typeof window !== "undefined") {
            localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(processingQueue));
        }
    }, [processingQueue]);

    // This effect polls every second to see if the token is gone.
    // If no token is found, clear the job queue.
    useEffect(() => {
        const checkToken = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setProcessingQueue([]);
                localStorage.removeItem(JOBS_STORAGE_KEY);
            }
        };

        checkToken(); // initial check
        const intervalId = setInterval(checkToken, 1000);
        return () => clearInterval(intervalId);
    }, []);

    const addJob = (job) => {
        setProcessingQueue((prev) => {
            const exists = prev.some((j) => j.job_id === job.job_id);
            if (!exists) {
                return [
                    ...prev,
                    {
                        ...job,
                        created_at: new Date().toISOString(),
                    },
                ];
            }
            return prev;
        });
    };

    const updateJobStatus = useCallback((updatedJob) => {
        setProcessingQueue((prev) => {
            let hasStatusChange = false;
            const updatedQueue = prev.map((job) => {
                if (job.job_id === updatedJob.job_id && job.status !== updatedJob.status) {
                    hasStatusChange = true;
                    const isCompleting = updatedJob.status === "completed" && !job.completed_at;
                    return {
                        ...job,
                        status: updatedJob.status,
                        completed_at: isCompleting ? new Date().toISOString() : job.completed_at,
                    };
                }
                return job;
            });
            return hasStatusChange ? updatedQueue : prev;
        });
    }, []);

    useEffect(() => {
        const fetchJobStatuses = async () => {
            const currentQueue = queueRef.current;
            if (currentQueue.length === 0) {
                console.log("⚠️ No jobs to fetch!");
                return;
            }
            if (typeof window === "undefined") {
                return;
            }
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("❌ No authentication token found.");
                return;
            }
            console.log("🔄 Fetching job statuses for jobs:", currentQueue.map((job) => job.job_id));

            try {
                const jobsStatus = await Promise.all(
                    currentQueue.map(async (job) => {
                        try {
                            const res = await axios.get(
                                `${API_BASE_URL}/jobs/${job.job_id}/status`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            console.log(`✅ Fetched status for job ${job.job_id}:`, res.data.status);
                            return { job_id: job.job_id, status: res.data.status };
                        } catch (error) {
                            console.error(`❌ Error fetching job ${job.job_id} status:`, error);
                            return { job_id: job.job_id, status: "failed" };
                        }
                    })
                );
                jobsStatus.forEach((jobStatus) => {
                    updateJobStatus(jobStatus);
                });
            } catch (error) {
                console.error("❌ Error polling job statuses:", error);
            }
        };

        const intervalId = setInterval(fetchJobStatuses, 5000);
        return () => clearInterval(intervalId);
    }, [updateJobStatus]);

    return (
        <JobsContext.Provider value={{ processingQueue, addJob, updateJobStatus }}>
            {children}
        </JobsContext.Provider>
    );
}

export function useJobs() {
    return useContext(JobsContext);
}
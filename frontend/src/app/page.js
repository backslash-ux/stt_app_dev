// src/app/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";
import useHistory from "../hooks/useHistory";
import { useJobs } from "../hooks/useJobs";
import TranscribeSection from "../components/TranscribeSection";
import TranscriptionHistory from "../components/TranscriptionHistory";
import ContentHistory from "../components/ContentHistory";
import ProcessingQueue from "../components/ProcessingQueue";

export default function Home() {
  const user = useAuth();
  const { transcriptionHistory, contentHistory, refreshHistory } = useHistory(user);
  const { processingQueue, isLoading } = useJobs();  // Add isLoading from useJobs
  const router = useRouter();

  const [showWarning, setShowWarning] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("showWarning") !== "false";
    }
    return true;
  });

  const dismissWarning = () => {
    setShowWarning(false);
    localStorage.setItem("showWarning", "false");
  };

  const prevQueueRef = useRef([]);

  useEffect(() => {
    processingQueue.forEach((currentJob) => {
      const oldJob = prevQueueRef.current.find((j) => j.job_id === currentJob.job_id);
      if (oldJob && oldJob.status !== "completed" && currentJob.status === "completed") {
        refreshHistory();
      }
    });
    prevQueueRef.current = processingQueue;
  }, [processingQueue, refreshHistory]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-2">
        ACTS (Audio Recording & Creative Transcription System)
      </h1>
      <p className="text-gray-600 text-center mb-6">
        Logged in as: <span className="font-medium">{user.email}</span>
      </p>

      {showWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded-lg mb-6 relative">
          <button
            onClick={dismissWarning}
            className="absolute top-2 right-2 text-yellow-700 hover:text-yellow-900"
          >
            ✖
          </button>
          <h2 className="font-bold text-lg">⚠️ Before using this tool:</h2>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Ensure your audio/video is within the recommended length (max 15 - 30 minutes).</li>
            <li>Keep file sizes manageable (less than 25MB).</li>
            <li>Make sure your YouTube link is valid and not region-locked.</li>
            <li>Be aware of copyrighted content.</li>
            <li>Exceeding the recommended duration may result in incomplete/failed transcriptions.</li>
            <li>This tool is for informational & educational purposes only.</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="col-span-1 lg:col-span-3 bg-white p-6 rounded-lg shadow h-[28rem] flex items-center">
          <div className="w-full">
            <TranscribeSection />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-5 bg-white p-6 rounded-lg shadow h-[28rem] overflow-y-auto">
          <TranscriptionHistory
            transcriptionHistory={transcriptionHistory}
            onDone={refreshHistory}
          />
        </div>

        <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-lg shadow h-[28rem] overflow-y-auto">
          <ProcessingQueue processingQueue={processingQueue} isLoading={isLoading} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="col-span-1 lg:col-span-6 bg-white p-6 rounded-lg shadow h-[28rem] overflow-y-auto">
          <ContentHistory contentHistory={contentHistory} />
        </div>

        <div className="col-span-1 lg:col-span-4 bg-white p-6 rounded-lg shadow h-[28rem] overflow-y-auto">
          <StatsOverview
            transcriptionCount={transcriptionHistory.length}
            contentCount={contentHistory.length}
          />
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/login");
        }}
        className="mt-6 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md mx-auto w-full max-w-xs"
      >
        Logout
      </button>
    </div>
  );
}

function StatsOverview({ transcriptionCount, contentCount }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">User Stats</h2>
      <ul className="space-y-2">
        <li>
          <strong>Total Transcriptions:</strong> {transcriptionCount}
        </li>
        <li>
          <strong>Total Content Generated:</strong> {contentCount}
        </li>
      </ul>
    </div>
  );
}
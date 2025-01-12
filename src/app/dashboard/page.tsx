"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

interface Notes {
  notes: string;
}

export default function Dashboard() {
  const [url, setUrl] = useState<string>("");
  const [notes, setNotes] = useState<Notes | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotes(null);

    try {
      // First API call - Get transcript
      setStatus("Fetching transcript...");
      const transcriptResponse = await fetch(
        `/api/transcript?url=${encodeURIComponent(url)}`
      );

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(errorData.error || "Failed to fetch transcript");
      }

      const transcriptData = await transcriptResponse.json();

      if (!transcriptData.transcript) {
        throw new Error("No transcript received from API");
      }

      // Second API call - Generate notes
      setStatus("Generating notes...");
      const notesResponse = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: JSON.stringify(transcriptData.transcript),
        }),
      });

      if (!notesResponse.ok) {
        const errorData = await notesResponse.json();
        throw new Error(errorData.error || "Failed to generate notes");
      }

      const notesData = await notesResponse.json();
      setNotes({
        notes: notesData.notes,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">
          YouTube Notes Generator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="flex gap-4">
            <Input
              type="url"
              placeholder="Enter YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="min-w-[150px]">
              {loading ? "Processing..." : "Generate Notes"}
            </Button>
          </div>

          {status && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p>{status}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
          )}
        </form>

        {notes && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Generated Notes</h2>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                <ReactMarkdown>{notes.notes}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

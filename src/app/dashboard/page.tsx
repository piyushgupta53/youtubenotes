"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Notes {
  title: string;
  summary: string;
  keyPoints: string[];
}

export default function Dashboard() {
  const [url, setUrl] = useState<string>("");
  const [notes, setNotes] = useState<Notes | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/generate-notes?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate notes");
      }

      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError("Failed to generate notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">YouTube Notes Generator</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="flex gap-4">
          <Input
            type="url"
            placeholder="Enter YouTube URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate Notes"}
          </Button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </form>

      {notes && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Title</h2>

          <div>
            <h3 className="text-xl font-semibold mb-2">Summary</h3>
            <p className="text-gray-700">Summary</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Key Points</h3>
            {JSON.stringify(notes, null, 2)}
            {/* <ul className="list-disc pl-6 space-y-2">
              {notes.keyPoints.map((point, index) => (
                <li key={index} className="text-gray-700">
                  {point}
                </li>
              ))}
            </ul> */}
          </div>
        </div>
      )}
    </div>
  );
}

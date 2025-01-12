import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPSEEK_KEY) {
      throw new Error("DeepSeek API key is not configured");
    }

    const body = await request.json();

    if (!body.transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const deepseekPayload = {
      messages: [
        {
          content:
            "The following data is a transcript from a video. Your task is to extract and organize the key points into well-structured, detailed notes. Ensure the notes are concise yet comprehensive, preserving the flow of the content.",
          role: "system",
        },
        {
          content: `Please create organized notes from this transcript: ${body.transcript}`,
          role: "user",
        },
      ],
      model: "deepseek-chat",
      max_tokens: 2048,
      temperature: 0.7,
      response_format: {
        type: "text",
      },
    };

    const notesResponse = await axios({
      method: "post",
      url: "https://api.deepseek.com/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
      },
      data: deepseekPayload,
    });

    return NextResponse.json(
      {
        notes: notesResponse.data.choices[0].message.content,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Notes API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate notes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

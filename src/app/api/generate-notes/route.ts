import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    if (!process.env.SUPADATA_KEY) {
      throw new Error("API key is not configured");
    }

    const response = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?url=${url}`,
      {
        headers: {
          "x-api-key": process.env.SUPADATA_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transcript");
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate transcript" },
      { status: 500 }
    );
  }
}

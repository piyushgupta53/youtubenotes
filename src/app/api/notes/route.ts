import { NextResponse } from "next/server";
import axios from "axios";
import { systemPrompt } from "@/lib/constants";

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
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.transcript },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(
            "https://api.deepseek.com/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
              },
              body: JSON.stringify(deepseekPayload),
            }
          );

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            // Keep the last partial line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

              try {
                if (trimmedLine.startsWith("data: ")) {
                  const jsonStr = trimmedLine.slice(6);
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(content);
                  }
                }
              } catch (e) {
                console.error("Error parsing line:", trimmedLine);
              }
            }
          }

          // Process any remaining buffer content
          if (buffer) {
            try {
              const parsed = JSON.parse(buffer.replace(/^data: /, ""));
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(content);
              }
            } catch (e) {
              console.error("Error parsing final buffer:", buffer);
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
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

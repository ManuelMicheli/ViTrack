import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for transcribeAudio()
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await transcribeAudio(buffer, audioFile.name || "voice.webm");

    if (!text) {
      return NextResponse.json(
        { error: "Transcription failed", text: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Voice API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

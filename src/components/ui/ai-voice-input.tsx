"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  visualizerBars?: number;
  className?: string;
  disabled?: boolean;
}

export function AIVoiceInput({
  onStart,
  onStop,
  onTranscription,
  onError,
  visualizerBars = 48,
  className,
  disabled = false,
}: AIVoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Timer while recording
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (recording) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      setTime(0);
    }
    return () => clearInterval(intervalId);
  }, [recording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        if (audioBlob.size < 1000) {
          // Too short / empty recording
          onError?.("Registrazione troppo breve. Riprova.");
          return;
        }

        // Send to transcription API
        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "voice.webm");

          const res = await fetch("/api/voice", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const { text } = await res.json();
            if (text) {
              onTranscription?.(text);
            } else {
              onError?.("Non sono riuscito a trascrivere l'audio.");
            }
          } else {
            onError?.("Errore nella trascrizione.");
          }
        } catch {
          onError?.("Errore di rete nella trascrizione.");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      onStart?.();
    } catch {
      onError?.("Microfono non disponibile. Controlla i permessi del browser.");
    }
  }, [onStart, onTranscription, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      onStop?.(time);
    }
  }, [recording, time, onStop]);

  const handleClick = () => {
    if (disabled || transcribing) return;
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const active = recording || transcribing;

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
            active
              ? "bg-none"
              : "bg-none hover:bg-white/10",
            (disabled || transcribing) && "opacity-40 cursor-not-allowed"
          )}
          type="button"
          onClick={handleClick}
          disabled={disabled || transcribing}
        >
          {recording ? (
            <div
              className="w-6 h-6 rounded-sm animate-spin bg-white cursor-pointer pointer-events-auto"
              style={{ animationDuration: "3s" }}
            />
          ) : transcribing ? (
            <div className="w-6 h-6 rounded-full border-2 border-white/50 border-t-white animate-spin" />
          ) : (
            <Mic className="w-6 h-6 text-white/70" />
          )}
        </button>

        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300",
            active ? "text-white/70" : "text-white/30"
          )}
        >
          {formatTime(time)}
        </span>

        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                recording
                  ? "bg-white/50 animate-pulse"
                  : "bg-white/10 h-1"
              )}
              style={
                recording && isClient
                  ? {
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="h-4 text-xs text-white/70">
          {transcribing
            ? "Trascrivo..."
            : recording
              ? "Sto ascoltando..."
              : "Premi per parlare"}
        </p>
      </div>
    </div>
  );
}

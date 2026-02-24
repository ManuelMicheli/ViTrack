"use client";

import type { ChatMessage } from "@/lib/types";
import { TextBubble } from "./TextBubble";
import { MealConfirmCard } from "./MealConfirmCard";
import { MealLoggedCard } from "./MealLoggedCard";
import { WorkoutConfirmCard } from "./WorkoutConfirmCard";
import { WorkoutLoggedCard } from "./WorkoutLoggedCard";
import { DailySummaryCard } from "./DailySummaryCard";
import { MealSuggestionCard } from "./MealSuggestionCard";
import { WaterLoggedCard } from "./WaterLoggedCard";
import { WeightLoggedCard } from "./WeightLoggedCard";
import { WeeklySummaryCard } from "./WeeklySummaryCard";

interface MessageRendererProps {
  message: ChatMessage;
  onSendMessage: (text: string) => void;
}

export function MessageRenderer({ message, onSendMessage }: MessageRendererProps) {
  const handleMealConfirm = (tempId: string) => {
    onSendMessage(`Conferma pasto ${tempId}`);
  };
  const handleMealCancel = (tempId: string) => {
    onSendMessage(`Annulla pasto ${tempId}`);
  };
  const handleWorkoutConfirm = (tempId: string) => {
    onSendMessage(`Conferma allenamento ${tempId}`);
  };
  const handleWorkoutCancel = (tempId: string) => {
    onSendMessage(`Annulla allenamento ${tempId}`);
  };
  const handleSuggestionSelect = (optionName: string) => {
    onSendMessage(`Scelgo: ${optionName}`);
  };

  switch (message.message_type) {
    case "meal_confirm":
      return <MealConfirmCard message={message} onConfirm={handleMealConfirm} onCancel={handleMealCancel} />;
    case "meal_logged":
    case "meal_saved":
      if (message.metadata && "items" in message.metadata) {
        return <MealLoggedCard message={message} />;
      }
      return <TextBubble message={message} />;
    case "workout_confirm":
      return <WorkoutConfirmCard message={message} onConfirm={handleWorkoutConfirm} onCancel={handleWorkoutCancel} />;
    case "workout_logged":
    case "workout_saved":
      if (message.metadata && "exercises" in message.metadata) {
        return <WorkoutLoggedCard message={message} />;
      }
      return <TextBubble message={message} />;
    case "daily_summary":
      if (message.metadata && "calories" in message.metadata) {
        return <DailySummaryCard message={message} />;
      }
      return <TextBubble message={message} />;
    case "weekly_summary":
      if (message.metadata && "avg_daily_calories" in message.metadata) {
        return <WeeklySummaryCard message={message} />;
      }
      return <TextBubble message={message} />;
    case "meal_suggestion":
      if (message.metadata && "options" in message.metadata) {
        return <MealSuggestionCard message={message} onSelect={handleSuggestionSelect} />;
      }
      return <TextBubble message={message} />;
    case "water_logged":
      if (message.metadata && "current_ml" in message.metadata) {
        return <WaterLoggedCard message={message} />;
      }
      return <TextBubble message={message} />;
    case "weight_logged":
      if (message.metadata && "weight_kg" in message.metadata) {
        return <WeightLoggedCard message={message} />;
      }
      return <TextBubble message={message} />;
    case "text":
    case "need_info":
    case "command_result":
    case "error":
    default:
      return <TextBubble message={message} />;
  }
}

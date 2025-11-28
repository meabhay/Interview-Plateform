"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { MessageSquare, User } from "lucide-react";

interface SavedMessage {
  role: "assistant" | "user";
  content: string;
}

const InterviewTranscript = ({
  conversation,
}: {
  conversation: SavedMessage[];
}) => {
  return (
    <Card className="bg-white/60 border border-black/10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-dark flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-dark/80" />
          Interview Transcript
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : ""
            }`}
          >
            {message.role === "assistant" && (
              <div className="p-2 bg-white rounded-full">
                <User className="w-5 h-5 text-dark/70" />
              </div>
            )}
            <p
              className={`max-w-lg p-3 rounded-2xl ${
                message.role === "user"
                  ? "bg-green/20 text-dark"
                  : "bg-white/80 text-dark/90"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InterviewTranscript;

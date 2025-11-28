"use client";

import React from "react";
import {
  BrainCircuit,
  MessageSquare,
  Target,
  Timer,
  Users,
  Layout,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import InterviewTranscript from "./interview-transcript";
import PersonalizedLearningPath from "./learning-path";
import { toast } from "sonner";
import Link from "next/link";
import { InterviewFeedback } from "@prisma/client";

interface FeedbackPageProps {
  feedback: InterviewFeedback & {
    interview: { name: string; role: string } | null;
  };
}

const FeedbackPageContent: React.FC<FeedbackPageProps> = ({ feedback }) => {
  // 1. Log the entire object received from the backend.
  console.log("[FE] Full 'feedback' prop received:", feedback);

  let parsedFeedback;
  try {
    // 2. The 'feedBack' column (with a capital 'B') contains the JSON string.
    parsedFeedback = JSON.parse(feedback.feedBack as string);
    console.log(
      "[FE] Successfully parsed 'feedback.feedBack':",
      parsedFeedback
    );
  } catch (error) {
    console.log(
      "[FE] Content of 'feedback.feedBack' that failed to parse:",
      feedback.feedBack
    );
    // This fallback handles old data where 'feedBack' was just a plain string.
    parsedFeedback = {
      summary: feedback.feedBack,
      transcript: [],
      weakTopics: [],
    };
  }

  const scores = [
    {
      name: "Problem Solving",
      value: feedback.problemSolving,
      Icon: BrainCircuit,
    },
    { name: "System Design", value: feedback.systemDesign, Icon: Layout },
    {
      name: "Communication Skills",
      value: feedback.communicationSkills,
      Icon: MessageSquare,
    },
    {
      name: "Technical Accuracy",
      value: feedback.technicalAccuracy,
      Icon: Target,
    },
    {
      name: "Behavioral Responses",
      value: feedback.behavioralResponses,
      Icon: Users,
    },
    { name: "Time Management", value: feedback.timeManagement, Icon: Timer },
  ];

  const overallScore = Math.round(
    scores.reduce((acc, score) => acc + score.value, 0) / scores.length
  );

  const getScoreColor = (score: number) => "text-green";

  return (
    <div className="relative z-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="bg-white/60 border border-black/10 rounded-4xl shadow-lg">
          <CardContent className="p-8 text-dark">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-dark/70 text-sm font-medium mb-2">
                  Interview Feedback Report
                </p>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-dark">
                  {feedback.interview?.name || "Interview"}
                </h1>
                <p className="text-dark/80 text-lg">
                  {feedback.interview?.role}
                </p>
              </div>
              <div className="flex flex-col items-end bg-white/50 backdrop-blur-sm rounded-2xl p-6 min-w-[140px]">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-dark/80" />
                  <span className="text-sm font-medium text-dark">
                    Overall Score
                  </span>
                </div>
                <div className="text-5xl font-bold text-dark">
                  {overallScore}
                </div>
                <div className="text-sm text-dark/70">out of 100</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-dark/80" />
            <h2 className="text-2xl font-bold text-dark">
              Performance Breakdown
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scores.map(({ name, value, Icon }) => (
              <Card
                key={name}
                className="bg-white/60 border border-black/10 transition-all hover:scale-105 hover:shadow-lg cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white shadow-sm">
                      <Icon className={`w-6 h-6 ${getScoreColor(value)}`} />
                    </div>
                    <div
                      className={`text-4xl font-bold ${getScoreColor(value)}`}
                    >
                      {value}
                    </div>
                  </div>
                  <h3 className="font-semibold text-dark text-lg">{name}</h3>
                  <div className="mt-3 w-full bg-black/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all bg-green"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-white/60 border border-black/10 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-dark flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg">
                <BrainCircuit className="w-6 h-6 text-dark/80" />
              </div>
              AI-Generated Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-dark/80 leading-relaxed text-base whitespace-pre-wrap">
                {parsedFeedback.summary}
              </p>
            </div>
          </CardContent>
        </Card>

        <InterviewTranscript conversation={parsedFeedback.transcript || []} />
        {parsedFeedback.weakTopics && (
          <PersonalizedLearningPath topics={parsedFeedback.weakTopics} />
        )}

        <div className="flex justify-center gap-4 pt-4">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="primary-button bg-green text-white shadow-lg cursor-pointer"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPageContent;

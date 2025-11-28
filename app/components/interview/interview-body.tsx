"use client";
import Vapi from "@vapi-ai/web";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useTransition } from "react";

export interface SavedMessage {
  role: "assistant" | "user";
  content: string;
}

const interviewerAssistant = {
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional job interviewer conducting a real-time voice and coding interview. Your goal is to assess the candidate's qualifications, motivation, and technical skills.

Interview Guidelines:
1.  **Follow the Structured Flow**: Follow the question list here: {{questions}}.
2.  **Ask Questions Sequentially**: Go through the list of questions one by one. Do not skip any.
4.  **Engage Naturally**: For voice questions, listen actively and ask brief follow-up questions if a response is vague. Keep the conversation flowing.
5.  **Be Professional and Concise**: Use official yet friendly language. Keep your spoken responses short and to the point, as in a real conversation.
6.  **Answer Candidate Questions**: If asked about the role or company, provide a clear answer. If you don't know, redirect them to HR.
7.  **Conclude Properly**: After all questions are done, thank the candidate for their time and inform them that the company will be in touch. End on a positive note.`,
      },
    ],
  },
};

type InterviewBodyprops = {
  id: string;
  questions: string;
  role: string;
  userId: string;
  startInterview: boolean;
  handleLastMessageChange: (message: string) => void;
  isHangingUp: boolean;
  conversation: SavedMessage[];
  setConversation: (conversation: SavedMessage[]) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
};

const InterviewBody = ({
  id,
  questions,
  role,
  userId,
  startInterview,
  handleLastMessageChange,
  isHangingUp,
  conversation,
  setConversation,
  setIsSubmitting,
}: InterviewBodyprops) => {
  const session = useSession();
  const [callStart, setCallStart] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  // Use a ref to hold a single, stable instance of the Vapi SDK
  const vapiRef = React.useRef<Vapi | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Initialize Vapi and set up listeners only once on component mount.
    // This prevents re-running this setup on every state change.
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
    }
    const vapiInstance = vapiRef.current;

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onCallStart = () => setCallStart(true);
    const onCallEnd = () => setCallStart(false);

    // Define the error handler function.
    const onError = (e: any) => {
      console.error("VAPI Error:", e);
    };

    vapiInstance.on("speech-start", onSpeechStart);
    vapiInstance.on("speech-end", onSpeechEnd);
    vapiInstance.on("call-start", onCallStart);
    vapiInstance.on("call-end", onCallEnd);
    // Attach the error listener.
    vapiInstance.on("error", onError);

    return () => {
      // Clean up listeners when the component unmounts
      vapiInstance.off("speech-start", onSpeechStart);
      vapiInstance.off("speech-end", onSpeechEnd);
      vapiInstance.off("call-start", onCallStart);
      vapiInstance.off("call-end", onCallEnd);
      // Now correctly remove the error listener.
      vapiInstance.off("error", onError);
    };
  }, []); // Empty dependency array ensures this runs only once.

  // This effect handles incoming messages and depends on conversation state.
  useEffect(() => {
    if (!vapiRef.current) return;
    const vapiInstance = vapiRef.current;

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        // Use the functional update form of setState to avoid stale state issues.
        setConversation((prevConversation) => [
          ...prevConversation,
          { role: message.role, content: message.transcript },
        ]);
      }
    };

    vapiInstance.on("message", onMessage);
    return () => {
      vapiInstance.off("message", onMessage);
    };
  }, [setConversation]); // Dependency on setConversation

  useEffect(() => {
    if (conversation.length > 0) {
      const last = conversation[conversation.length - 1];
      if (last?.content) {
        handleLastMessageChange(last.content);
      }
    }
  }, [conversation, handleLastMessageChange]);

  const handlehangUp = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          userid: userId,
          conversation: conversation,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/dashboard/feedback/${result.interviewId}`);
      } else {
        const errorResult = await response.json();
        alert(`Error: ${errorResult.message || "Failed to save feedback."}`);
        setIsSubmitting(false);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error on hang up:", error);
      alert("An unexpected error occurred. Redirecting to dashboard.");
      setIsSubmitting(false);
      router.push("/dashboard");
    }
  }, [id, userId, conversation, router, setIsSubmitting]);

  useEffect(() => {
    if (isHangingUp) {
      handlehangUp();
    }
  }, [isHangingUp, handlehangUp]);

  useEffect(() => {
    if (startInterview) handleCallConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startInterview]);

  const handleCallConnect = async () => {
    if (!vapiRef.current) {
      console.error("Vapi not initialized");
      return;
    }

    try {
      // The start method takes an assistant object or an assistantId.
      // We are creating a temporary assistant on the fly.
      await vapiRef.current.start({
        ...interviewerAssistant,
        model: {
          ...interviewerAssistant.model,
          messages: [
            {
              role: "system",
              content: `You are a professional technical interviewer. Your goal is to conduct a challenging and insightful technical interview for a candidate applying for the role of **${role}**.
              
Interview Guidelines:
1.  **Generate Technical Questions**: Based on the job role of **${role}**, generate a series of technical questions. These questions should be varied and cover different aspects of the required tech stack and skills for this position. Do not ask generic behavioral questions.
2.  **Ensure Variety**: Do not ask the same questions in every interview. You must generate a unique set of questions for each new session.
3.  **Ask One Question at a Time**: Ask a single question and wait for the candidate's complete response before moving to the next one.
4.  **Drill Down**: If a candidate's answer is good, ask a more difficult follow-up question on the same topic to gauge the depth of their knowledge. If an answer is vague or incorrect, gently probe to see if they can elaborate or correct themselves.
5.  **Be Professional and Conversational**: Maintain a professional yet approachable tone. Keep your questions and responses concise.
6.  **Manage the Flow**: You are in control of the interview. Guide the conversation through approximately 5-7 technical questions.
7.  **Conclude Properly**: After you have asked enough questions, thank the candidate for their time and inform them that the company will be in touch with the next steps. End the interview on a positive note.`,
            },
          ],
        },
        firstMessage: `Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience for the ${role} role.`,
      });
    } catch (error) {
      console.error("Error starting Vapi call:", error);
    }
  };

  const handleCallStop = () => {
    setCallStart(false);
    vapiRef.current?.stop();
  };

  return (
    <section className="flex items-center justify-center gap-6 z-60">
      <>
        <div className="flex flex-col items-center justify-center h-[400px] w-full max-w-xl p-6 border-2 border-black rounded-[45px] bg-[#e7e9fb] shadow-md ">
          <div className="relative w-60 h-60 flex items-center justify-center">
            {isSpeaking && (
              <div className="absolute w-28 h-28 bg-[#f78c74]/45 rounded-full animate-ping z-10" />
            )}
            <Image
              src="/robot-orange.png"
              alt="AI Interviewer"
              width={240}
              height={240}
              className="rounded-full animate-pulse p-4 z-20 pointer-events-none"
            />
          </div>
          <span className="text-xl font-semibold text-center">
            AI Interviewer
          </span>
        </div>
        <div className="hidden md:flex flex-col items-center justify-center h-[400px] w-full max-w-xl p-6 border-2 border-black rounded-[45px] bg-[#e7e9fb] shadow-md gap-4">
          <Image
            src={session.data?.user?.image || "/profile-image.png"}
            alt="User Image"
            width={180}
            height={180}
            className="rounded-full pointer-events-none"
          />
          <span className="text-xl font-semibold text-center">
            {session.data?.user?.name || "You"} (You)
          </span>
        </div>
      </>
    </section>
  );
};

export default InterviewBody;

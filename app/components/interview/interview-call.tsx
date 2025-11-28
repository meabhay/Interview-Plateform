import React, { use, useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "../ui/card";
import InterviewHeader from "./interview-header";
import InterviewBody, { SavedMessage } from "./interview-body";
import InterviewFooter from "./interview-footer";

interface InterviewProps {
  InterViewData: any;
  startInterview: boolean;
  conversation: SavedMessage[];
  setConversation: (conversation: SavedMessage[]) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  noOfQuestions: number;
}

const InterviewCall = ({
  InterViewData,
  startInterview,
  conversation,
  setConversation,
  setIsSubmitting,
  noOfQuestions,
}: InterviewProps) => {
  const [currentmessage, setCurrentmessage] = useState("");
  const [isHangingUp, setIsHangingUp] = React.useState(false);

  const handleLastMessageChange = (message: string) => {
    setCurrentmessage(message);
  };

  const handleHangUp = () => {
    setIsHangingUp(true);
  };

  return (
    <Card className="h-full w-full py-4 px-0 bg-transparent border-none shadow-none">
      <CardHeader>
        <InterviewHeader {...InterViewData} />
      </CardHeader>
      <CardContent className="px-0 z-20">
        <InterviewBody
          {...InterViewData}
          startInterview={startInterview}
          handleLastMessageChange={handleLastMessageChange}
          isHangingUp={isHangingUp}
          setConversation={setConversation}
          conversation={conversation}
          setIsSubmitting={setIsSubmitting}
          noOfQuestions={noOfQuestions}
        />
      </CardContent>
      <InterviewFooter Message={currentmessage} HangUpFunction={handleHangUp} />
    </Card>
  );
};

export default InterviewCall;

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  BookOpen,
  Zap,
  Youtube,
  FileText,
  Book,
  ExternalLink,
} from "lucide-react";

interface LearningResource {
  topic: string;
  resourceType: "video" | "article" | "docs";
  resourceTitle: string;
  resourceUrl: string;
}

interface PersonalizedLearningPathProps {
  topics: LearningResource[];
}

const PersonalizedLearningPath: React.FC<PersonalizedLearningPathProps> = ({
  topics,
}) => {
  const getIconForType = (type: string) => {
    switch (type) {
      case "video":
        return <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case "article":
        return <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      case "docs":
        return <Book className="w-5 h-5 text-green-600 flex-shrink-0" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-500 flex-shrink-0" />;
    }
  };

  if (!topics || topics.length === 0) {
    return null; // Don't render the component if there are no topics
  }

  return (
    <Card className="bg-white/60 border border-black/10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-dark flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg">
            <Zap className="w-6 h-6 text-dark/80" />
          </div>
          Personalized Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-dark/80 mb-4">
          Based on your interview, here are some key areas to focus on for
          improvement:
        </p>
        <ul className="space-y-3">
          {topics.map((item, index) => (
            <a
              key={index}
              href={item.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block p-4 bg-white/50 rounded-lg transition-all hover:bg-white/80 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {getIconForType(item.resourceType)}
                <div>
                  <h4 className="font-bold text-dark group-hover:text-indigo-600">
                    {item.topic}
                  </h4>
                  <p className="text-sm text-dark/70 group-hover:underline">
                    {item.resourceTitle}
                  </p>
                </div>
              </div>
              <ExternalLink className="absolute top-4 right-4 w-4 h-4 text-dark/40 group-hover:text-indigo-600" />
            </a>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PersonalizedLearningPath;

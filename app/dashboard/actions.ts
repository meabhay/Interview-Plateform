"use server";

import { notFound } from "next/navigation";
import { prisma } from "@/prisma/prisma";
import { auth } from "@/app/(auth-pages)/auth";
import { revalidatePath } from "next/cache";

export async function getCompletedInterviews() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const interviews = await prisma.interview.findMany({
    where: {
      userId: session.user.id,
      isCompleted: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return interviews;
}

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      totalInterviews: 0,
      completedInterviewsCount: 0,
      averageScore: 0,
      skillsData: [],
    };
  }

  const userId = session.user.id;

  const allInterviews = await prisma.interview.findMany({
    where: { userId },
    include: {
      feedBack: true,
    },
  });

  const totalInterviews = allInterviews.length;
  const completedInterviews = allInterviews.filter((i) => i.isCompleted);
  const completedInterviewsCount = completedInterviews.length;

  let averageScore = 0;
  const skills: { [key: string]: number[] } = {
    problemSolving: [],
    systemDesign: [],
    communicationSkills: [],
    technicalAccuracy: [],
    behavioralResponses: [],
    timeManagement: [],
  };

  if (completedInterviewsCount > 0) {
    let totalScoreSum = 0;
    completedInterviews.forEach((interview) => {
      if (interview.feedBack) {
        const feedback = interview.feedBack;
        const scores = [
          feedback.problemSolving,
          feedback.systemDesign,
          feedback.communicationSkills,
          feedback.technicalAccuracy,
          feedback.behavioralResponses,
          feedback.timeManagement,
        ];
        totalScoreSum += scores.reduce((a, b) => a + b, 0);

        Object.keys(skills).forEach((key) => {
          skills[key].push(feedback[key as keyof typeof feedback] as number);
        });
      }
    });
    // Calculate the average score based on the total sum of all score points divided by the number of score points.
    const totalScorePoints = completedInterviews.reduce(
      (acc, interview) => acc + (interview.feedBack ? 6 : 0),
      0
    );
    averageScore =
      totalScorePoints > 0 ? Math.round(totalScoreSum / totalScorePoints) : 0;
  }

  const skillsData = Object.entries(skills).map(([key, values]) => ({
    type: key.replace(/([A-Z])/g, " $1").trim(),
    value:
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0,
  }));

  return {
    totalInterviews,
    completedInterviewsCount,
    averageScore,
    skillsData,
  };
}

export async function getInterviewFeedback(interviewId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }
  const userId = session.user.id;
  const userRole = session.user.role;

  const feedback = await prisma.interviewFeedback.findFirst({
    where:
      userRole === "HR"
        ? {
            // HR can view any feedback by interviewId
            interviewId: interviewId,
          }
        : {
            // Regular users can only view their own feedback
            interviewId: interviewId,
            userId: userId,
          },
    include: {
      interview: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  if (!feedback) {
    notFound(); // If feedback is not found, show a 404 page
  }

  return feedback;
}

export async function deleteInterview(interviewId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  try {
    // Use a transaction to ensure both the feedback and the interview are deleted atomically.
    await prisma.$transaction(async (tx) => {
      // First, verify the interview belongs to the user to prevent unauthorized deletions.
      const interview = await tx.interview.findUnique({
        where: { id: interviewId, userId: session.user.id },
        select: { id: true },
      });

      if (!interview) {
        throw new Error("Interview not found or user not authorized.");
      }

      // Next, delete the associated feedback record(s).
      await tx.interviewFeedback.deleteMany({
        where: { interviewId: interviewId },
      });

      // Finally, delete the interview itself.
      await tx.interview.delete({
        where: { id: interviewId },
      });
    });

    // Revalidate the path to refresh the data on the client side.
    revalidatePath("/dashboard");
    return { success: "Interview deleted successfully." };
  } catch (error) {
    console.error("Failed to delete interview:", error);
    return {
      error:
        "Could not delete the interview. It may have already been deleted.",
    };
  }
}

export async function getLeaderboardData() {
  const session = await auth();
  const usersWithInterviews = await prisma.user.findMany({
    include: {
      interviews: {
        where: { isCompleted: true },
        include: {
          feedBack: true,
        },
      },
    },
  });

  const userScores = usersWithInterviews
    .map((user) => {
      const completedFeedbacks = user.interviews
        .map((i) => i.feedBack)
        .filter((fb) => fb !== null);

      if (completedFeedbacks.length === 0) {
        return null; // User has no completed interviews with feedback
      }

      let totalScoreSum = 0;
      let totalScoreCount = 0;

      completedFeedbacks.forEach((feedback) => {
        if (feedback) {
          const scores = [
            feedback.problemSolving,
            feedback.systemDesign,
            feedback.communicationSkills,
            feedback.technicalAccuracy,
            feedback.behavioralResponses,
            feedback.timeManagement,
          ];
          totalScoreSum += scores.reduce((a, b) => a + b, 0);
          totalScoreCount += scores.length;
        }
      });

      const averageScore =
        totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : 0;

      return {
        name: user.name,
        image: user.image,
        score: averageScore,
        id: user.id,
      };
    })
    .filter(
      (
        user
      ): user is {
        name: string | null;
        image: string | null;
        score: number;
        id: string;
      } => user !== null
    );

  const sortedUsers = userScores.sort((a, b) => b.score - a.score);

  const currentUserRank =
    sortedUsers.findIndex((u) => u.id === session?.user?.id) + 1;
  const currentUserScore = sortedUsers.find(
    (u) => u.id === session?.user?.id
  )?.score;

  return {
    topUsers: sortedUsers.slice(0, 3),
    currentUser: session?.user
      ? {
          rank: currentUserRank,
          score: currentUserScore,
          name: session.user.name,
          image: session.user.image,
        }
      : null,
  };
}

export async function getHRDashboardData() {
  const totalUsers = await prisma.user.count();
  const totalInterviews = await prisma.interview.count();
  const completedInterviews = await prisma.interview.count({
    where: { isCompleted: true },
  });

  const recentInterviews = await prisma.interview.findMany({
    where: { isCompleted: true },
    orderBy: {
      createdAt: "desc", // Corrected from 'updatedAt' to 'createdAt'
    },
    take: 5,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    stats: {
      totalUsers,
      totalInterviews,
      completedInterviews,
    },
    recentInterviews: recentInterviews.map((i) => ({
      id: i.id,
      name: i.name,
      user: { name: i.user.name },
      updatedAt: i.createdAt, // Use createdAt as the value for updatedAt
    })),
  };
}

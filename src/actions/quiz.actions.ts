"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import {
  QuizServerService,
  CreateQuizData,
  SubmitQuizData,
} from "../services/quiz.server.service";
import prisma from "@/lib/db";

/**
 * Helper to get the local database User ID from local JWT session
 */
async function getLocalUserId(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    return parseInt(decoded.userId);
  } catch {
    throw new Error("Unauthorized: Session expired or invalid");
  }
}

export async function createQuizAction(
  data: Omit<CreateQuizData, "professorId">,
) {
  try {
    const localUserId = await getLocalUserId();

    // Validate professor has access to the course
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course || course.professorId !== localUserId) {
      return {
        success: false,
        error: "Unauthorized to create quizzes for this course",
      };
    }

    const quizData: CreateQuizData = {
      ...data,
      professorId: localUserId,
    };

    const newQuiz = await QuizServerService.createQuiz(quizData);
    return { success: true, data: JSON.parse(JSON.stringify(newQuiz)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create quiz";
    return { success: false, error: errorMessage };
  }
}

export async function getQuizzesByCourseAction(courseId: number) {
  try {
    // Optionally: check if the user is enrolled or is the professor of the course
    const quizzes = await QuizServerService.getQuizzesByCourse(courseId);
    return { success: true, data: JSON.parse(JSON.stringify(quizzes)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve course quizzes";
    return { success: false, error: errorMessage };
  }
}

export async function getQuizByIdAction(quizId: number) {
  try {
    // Optionally: check if user has access to view this quiz
    const quiz = await QuizServerService.getQuizById(quizId);

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(quiz)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve quiz details";
    return { success: false, error: errorMessage };
  }
}

export async function deleteQuizAction(quizId: number) {
  try {
    const localUserId = await getLocalUserId();

    // Auth Check: Is this professor the owner of the quiz's course?
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz || quiz.course.professorId !== localUserId) {
      return { success: false, error: "Unauthorized to delete this quiz" };
    }

    const deletedQuiz = await QuizServerService.deleteQuiz(quizId);
    return { success: true, data: JSON.parse(JSON.stringify(deletedQuiz)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete quiz";
    return { success: false, error: errorMessage };
  }
}

export async function submitQuizAction(
  quizId: number,
  answers: SubmitQuizData["answers"],
) {
  try {
    const localUserId = await getLocalUserId();

    const submissionData: SubmitQuizData = {
      quizId,
      studentId: localUserId,
      answers,
    };

    const submission = await QuizServerService.submitQuiz(submissionData);
    return { success: true, data: JSON.parse(JSON.stringify(submission)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit quiz";
    return { success: false, error: errorMessage };
  }
}

export async function getQuizResultsAction(quizId: number) {
  try {
    const localUserId = await getLocalUserId();

    // Auth Check: Is this professor the owner of the quiz's course?
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    if (quiz.course.professorId !== localUserId) {
      return { success: false, error: "Unauthorized to view these results" };
    }

    const results = await QuizServerService.getQuizResults(quizId);
    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve quiz results";
    return { success: false, error: errorMessage };
  }
}

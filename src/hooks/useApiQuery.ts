import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useErrorHandler } from "./useErrorHandler";
import { AppError, createAPIError } from "../utils/errorHandler";

// Import our new Server Actions
import {
  getUserProfileAction,
  getStudentStatsAction,
  updateBasicUserProfileAction,
} from "../actions/user.actions";
import { UpdateProfileRequest } from "../services/user.service";

import {
  getAllCoursesAction,
  getCourseByIdAction,
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
  enrollStudentAction,
  getCourseStatsAction,
  getStudentCoursesAction,
} from "../actions/course.actions";
import { CreateCourseData, UpdateCourseData } from "../services/course.service";

import {
  getQuizzesByCourseAction,
  getQuizByIdAction,
  createQuizAction,
} from "../actions/quiz.actions";
import { CreateQuizData } from "../services/quiz.server.service";

import {
  getSchedulesByCourseIdAction,
  getSchedulesByProfessorIdAction,
  getStudentScheduleAction,
  createScheduleAction,
  deleteScheduleAction,
} from "../actions/schedule.actions";
import { CreateScheduleData } from "../services/schedule.service";

import {
  getProfessorSessionsAction,
  getStudentSessionsAction,
  createAttendanceSessionAction,
  updateSessionStatusAction,
  scanQRCodeAction,
  CreateSessionData,
} from "../actions/attendance.actions";

// Generic API Hook Wrapper for Server Actions
// Server actions return { success: boolean, data?: any, error?: string }
async function handleServerAction<T>(
  actionPromise: Promise<{ success: boolean; data?: T; error?: string }>,
): Promise<T> {
  const result = await actionPromise;
  if (!result.success) {
    throw new Error(result.error || "Server Action failed");
  }
  return result.data as T;
}

// Generic API query hook
export function useApiQuery<TData = unknown, TError = AppError>(
  queryKey: (string | number)[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        const err = error as Error;
        const appError =
          error instanceof AppError
            ? error
            : createAPIError(err.message || "Action request failed", 500, {
                originalError: error,
              });
        handleError(appError);
        throw appError;
      }
    },
    ...options,
  });
}

// Generic API mutation hook
export function useApiMutation<
  TData = unknown,
  TVariables = unknown,
  TError = AppError,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>,
) {
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        const err = error as Error;
        const appError =
          error instanceof AppError
            ? error
            : createAPIError(err.message || "Action request failed", 500, {
                originalError: error,
              });
        handleError(appError);
        throw appError;
      }
    },
    onSuccess: (data: TData, variables: TVariables, context: unknown) => {
      if (options?.onSuccess) {
        // Cast to avoid "Expected 4 arguments" if there's a type mismatch with UseMutationOptions
        (
          options.onSuccess as (
            data: TData,
            variables: TVariables,
            context: unknown,
          ) => void
        )(data, variables, context);
      }
    },
    onError: (error: TError, variables: TVariables, context: unknown) => {
      if (options?.onError) {
        (
          options.onError as (
            error: TError,
            variables: TVariables,
            context: unknown,
          ) => void
        )(error, variables, context);
      }
    },
    ...options,
  });
}

// Specific API hooks for common operations

// --- User Profile ---
export function useUserProfile() {
  return useApiQuery(
    ["user", "profile"],
    () => handleServerAction(getUserProfileAction()),
    { staleTime: 10 * 60 * 1000 },
  );
}

export function useStudentStats() {
  return useApiQuery(
    ["student", "stats"],
    () => handleServerAction(getStudentStatsAction()),
    { staleTime: 5 * 60 * 1000 },
  );
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (data: UpdateProfileRequest) =>
      handleServerAction(updateBasicUserProfileAction(data)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      },
    },
  );
}

// --- Courses ---
export function useCourses(
  professorOnly = false,
  isActive?: boolean,
  summary = false,
) {
  return useApiQuery(
    ["courses", String(professorOnly), String(isActive), String(summary)],
    () =>
      handleServerAction(getAllCoursesAction(professorOnly, isActive, summary)),
    { staleTime: 5 * 60 * 1000 },
  );
}

export function useStudentCourses() {
  return useApiQuery(
    ["courses", "student"],
    () => handleServerAction(getStudentCoursesAction()),
    { staleTime: 5 * 60 * 1000 },
  );
}

export function useCourse(courseId: number) {
  return useApiQuery(
    ["course", courseId],
    () => handleServerAction(getCourseByIdAction(courseId)),
    { enabled: !!courseId },
  );
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (data: Omit<CreateCourseData, "professorId">) =>
      handleServerAction(createCourseAction(data)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["courses"] });
      },
    },
  );
}

export function useUpdateCourse(courseId: number) {
  const queryClient = useQueryClient();
  return useApiMutation(
    (data: UpdateCourseData) =>
      handleServerAction(updateCourseAction(courseId, data)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      },
    },
  );
}

export function useDeleteCourse(courseId: number) {
  const queryClient = useQueryClient();
  return useApiMutation(
    () => handleServerAction(deleteCourseAction(courseId)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["courses"] });
      },
    },
  );
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ courseId, studentId }: { courseId: number; studentId?: number }) =>
      handleServerAction(enrollStudentAction(courseId, studentId)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        queryClient.invalidateQueries({ queryKey: ["course"] });
      },
    },
  );
}

export function useCourseStats(courseId: number) {
  return useApiQuery(
    ["course", courseId, "stats"],
    () => handleServerAction(getCourseStatsAction(courseId)),
    { enabled: !!courseId },
  );
}

// --- Quizzes ---
export function useQuizzes(courseId: number) {
  return useApiQuery(
    ["course", courseId, "quizzes"],
    () => handleServerAction(getQuizzesByCourseAction(courseId)),
    { enabled: !!courseId },
  );
}

export function useQuiz(quizId: number) {
  return useApiQuery(
    ["quiz", quizId],
    () => handleServerAction(getQuizByIdAction(quizId)),
    { enabled: !!quizId },
  );
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (data: Omit<CreateQuizData, "professorId">) =>
      handleServerAction(createQuizAction(data)),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["course", variables.courseId, "quizzes"],
        });
      },
    },
  );
}

// --- Schedules ---
export function useProfessorSchedules(activeOnly = false) {
  return useApiQuery(["schedules", "professor"], () =>
    handleServerAction(getSchedulesByProfessorIdAction(activeOnly)),
  );
}

export function useStudentSchedules(activeOnly = true) {
  return useApiQuery(["schedules", "student"], () =>
    handleServerAction(getStudentScheduleAction(activeOnly)),
  );
}

export function useCourseSchedules(courseId: number, activeOnly = false) {
  return useApiQuery(
    ["course", courseId, "schedules"],
    () =>
      handleServerAction(getSchedulesByCourseIdAction(courseId, activeOnly)),
    { enabled: !!courseId },
  );
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (data: Omit<CreateScheduleData, "professorId">) =>
      handleServerAction(createScheduleAction(data)),
    {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["schedules"] }),
    },
  );
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (scheduleId: number) =>
      handleServerAction(deleteScheduleAction(scheduleId)),
    {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["schedules"] }),
    },
  );
}

// --- Attendance Sessions ---
export function useProfessorSessions() {
  return useApiQuery(["attendance", "sessions", "professor"], () =>
    handleServerAction(getProfessorSessionsAction()),
  );
}

export function useStudentSessions() {
  return useApiQuery(["attendance", "sessions", "student"], () =>
    handleServerAction(getStudentSessionsAction()),
  );
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (data: CreateSessionData) =>
      handleServerAction(createAttendanceSessionAction(data)),
    {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["attendance", "sessions"] }),
    },
  );
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: "ACTIVE" | "COMPLETED" | "CANCELLED";
    }) => handleServerAction(updateSessionStatusAction(sessionId, status)),
    {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["attendance"] }),
    },
  );
}

export function useScanQRCode() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({
      sessionId,
      qrCode,
      locationData,
    }: {
      sessionId: string;
      qrCode: string;
      locationData?: Record<string, unknown>;
    }) =>
      handleServerAction(
        scanQRCodeAction({ sessionId, qrCode, ...locationData }),
      ),
    {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["attendance"] }),
    },
  );
}

export default useApiQuery;

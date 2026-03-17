"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import DashboardLayout from "../components/common/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { MaterialsList } from "../components/common/MaterialsList";
import { FileText, ArrowLeft, Clock, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { QuizDashboard } from "../components/quiz/QuizDashboard";
import { getCourseImage } from "@/utils/courseImages";

interface CourseDetails {
  id: number;
  courseCode: string;
  courseName: string;
  description: string;
  credits: number;
  professor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string;
    professor?: {
      firstName: string;
      lastName: string;
    };
  }>;
  coverImage?: string;
}

export default function StudentCourseDetails() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await apiClient.get(`/api/courses/${id}`);
        if (response.success) {
          setCourse(response.data as CourseDetails);
        } else {
          toast.error("Failed to load course details");
          router.push("/dashboard/student/courses");
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course details");
        router.push("/student-courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id, router]);

  if (loading) {
    return (
      <DashboardLayout userName={user?.firstName} userType="student">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) return null;

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <DashboardLayout userName={user?.firstName} userType="student">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent hover:text-indigo-600"
            onClick={() => router.push("/dashboard/student/courses")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-gray-800">
                {!imgError ? (
                  <Image
                    src={
                      course.coverImage ||
                      getCourseImage(course.courseName, course.id)
                    }
                    alt={course.courseName}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => setImgError(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold">
                    {course.courseCode}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {course.credits} Credits
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {course.courseName}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {/* Aggregate professors from course and schedules */}
                  Professor:{" "}
                  {(() => {
                    const doctorPrefixes = ["د.", "د/", "أ.د", "أ.م.د", "م.د"];
                    const isDoctor = (name: string) =>
                      doctorPrefixes.some((pref) => name.includes(pref));

                    const professorSet = new Set<string>();
                    const leadProfName = course.professor
                      ? `${course.professor.firstName} ${course.professor.lastName}`
                      : null;

                    if (leadProfName) {
                      professorSet.add(leadProfName);
                    }

                    const scheduleProfs: string[] = [];
                    course.schedules?.forEach((s) => {
                      if (s.professor) {
                        const name = `${s.professor.firstName} ${s.professor.lastName}`;
                        if (!scheduleProfs.includes(name)) {
                          scheduleProfs.push(name);
                        }
                      }
                    });

                    // Only add schedule professors if they are doctors
                    scheduleProfs.forEach((p) => {
                      if (isDoctor(p) && !professorSet.has(p)) {
                        professorSet.add(p);
                      }
                    });

                    // Fallback if no lead or doctors: show all
                    if (professorSet.size === 0 && scheduleProfs.length > 0) {
                      scheduleProfs.forEach((p) => professorSet.add(p));
                    }

                    return Array.from(professorSet).join(", ") || "TBA";
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b border-gray-200 dark:border-gray-700 bg-transparent p-0 mb-8 rounded-none">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-6 py-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-6 py-3"
            >
              Resources & Materials
            </TabsTrigger>
            <TabsTrigger
              value="quizzes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-6 py-3"
            >
              Quizzes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-cardDark p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Schedule
                </h3>
                <div className="space-y-3">
                  {course.schedules && course.schedules.length > 0 ? (
                    course.schedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                      >
                        <span className="font-medium">
                          {dayNames[schedule.dayOfWeek]}
                        </span>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {schedule.startTime} - {schedule.endTime}
                          <span className="mx-2">›</span>
                          {schedule.room || "TBA"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No schedule set</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-cardDark p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {course.description || "No description available."}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Course Materials
                </h3>
                <p className="text-gray-500 text-sm">
                  Download lecture notes and view resources.
                </p>
              </div>
            </div>

            <MaterialsList courseId={course.id} userRole="STUDENT" />
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <QuizDashboard courseId={course.id} userRole="STUDENT" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

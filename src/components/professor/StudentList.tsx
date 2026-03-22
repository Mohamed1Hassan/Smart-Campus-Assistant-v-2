/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useAttendanceSessions } from "../../hooks/useAttendanceSessions";
import { Badge } from "../ui/badge";

interface StudentListProps {
  sessionId: string;
}

interface AttendanceRecordData {
  id: string;
  student: {
    name: string;
    universityId: string;
  };
  markedAt: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  fraudScore: number;
}

export function StudentList({ sessionId }: StudentListProps) {
  const { getSessionRecords } = useAttendanceSessions();
  const [records, setRecords] = useState<AttendanceRecordData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const data = (await getSessionRecords(sessionId)) as any;
        if (!isMounted) return;

        // Backend returns { data: records, meta: ... }
        const rawRecords = data?.data || (Array.isArray(data) ? data : []);
        const count = rawRecords.length || 0;
        
        setDebugInfo(
          `Session: ${sessionId.substring(0, 8)}... | ${count} records`,
        );

        if (rawRecords) {
          // Map backend student fields to frontend expected structure
          const mappedRecords = rawRecords.map((r: any) => ({
            ...r,
            student: {
              ...r.student,
              name: r.student ? `${r.student.firstName} ${r.student.lastName}` : "Unknown Student"
            }
          }));
          setRecords(mappedRecords);
        }
      } catch (e) {
        if (isMounted) setDebugInfo(`Error: ${e}`);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchRecords();
    } else {
      setDebugInfo("No active session selected");
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [sessionId, getSessionRecords]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No students have marked attendance yet.</p>
        <p className="text-xs text-gray-400 mt-2 font-mono">{debugInfo}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="text-xs text-gray-400 mb-2 font-mono px-6">
        {debugInfo}
      </div>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            <th className="px-6 py-3">Student</th>
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">Time</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Fraud Score</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="bg-white border-b dark:bg-gray-900 dark:border-gray-700"
            >
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                {record.student.name}
              </td>
              <td className="px-6 py-4">{record.student.universityId}</td>
              <td className="px-6 py-4">
                {new Date(record.markedAt).toLocaleTimeString()}
              </td>
              <td className="px-6 py-4">
                <Badge
                  variant={
                    record.status === "PRESENT" ? "default" : "destructive"
                  }
                >
                  {record.status}
                </Badge>
              </td>
              <td className="px-6 py-4">
                {record.fraudScore > 0 ? (
                  <span className="text-red-500 font-medium">
                    {record.fraudScore}%
                  </span>
                ) : (
                  <span className="text-green-500">0%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

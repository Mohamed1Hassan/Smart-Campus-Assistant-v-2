"use client";

import React from "react";
import { BookOpen, Shield, Archive, Plus, Search, X, Loader2, ShieldOff, Check } from "lucide-react";

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewingUser: any;
  showArchivedCourses: boolean;
  setShowArchivedCourses: (show: boolean) => void;
  isAssigningCourse: boolean;
  setIsAssigningCourse: (assigning: boolean) => void;
  courseSearchTerm: string;
  setCourseSearchTerm: (term: string) => void;
  allCourses: any[];
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  handleAssignCourse: () => void;
  handleUnassignCourse: (id: string) => void;
  isOperationLoading: boolean;
}

export default function UserInfoModal({
  isOpen,
  onClose,
  viewingUser,
  showArchivedCourses,
  setShowArchivedCourses,
  isAssigningCourse,
  setIsAssigningCourse,
  courseSearchTerm,
  setCourseSearchTerm,
  allCourses,
  selectedCourseId,
  setSelectedCourseId,
  handleAssignCourse,
  handleUnassignCourse,
  isOperationLoading,
}: UserInfoModalProps) {
  if (!isOpen || !viewingUser) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Column: User Profile */}
        <div className="w-full md:w-80 bg-gradient-to-b from-gray-50 to-white border-r border-gray-100 p-8 flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-500/20 mb-8 transition-transform group-hover:scale-105 duration-300">
              {viewingUser.firstName?.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 border-4 border-white rounded-full shadow-sm"></div>
          </div>
          
          <h4 className="font-black text-2xl text-gray-900 leading-tight mb-2 tracking-tight">
            {viewingUser.firstName} {viewingUser.lastName}
          </h4>
          <div className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest mb-10 shadow-lg shadow-blue-500/20">
            {viewingUser.role}
          </div>

          <div className="w-full space-y-4 text-left">
            <InfoChip label="University ID" value={viewingUser.universityId} />
            <InfoChip label="Email Address" value={viewingUser.email} />

            {viewingUser.role === "STUDENT" && (
              <>
                <InfoChip label="Major" value={viewingUser.major || "N/A"} />
                <InfoChip label="Academic Year" value={viewingUser.year ? `Year ${viewingUser.year}` : "N/A"} />
              </>
            )}

            {viewingUser.role === "PROFESSOR" && viewingUser.department && (
              <InfoChip label="Department" value={viewingUser.department} />
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-auto w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-gray-200"
          >
            Close Profile
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto max-h-[90vh] custom-scrollbar bg-white">
          {viewingUser.role === "PROFESSOR" ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Teaching Curriculum</h3>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Manage assigned courses and academic capacity</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowArchivedCourses(!showArchivedCourses)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                      showArchivedCourses 
                      ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-inner' 
                      : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <Archive className={`w-3.5 h-3.5 ${showArchivedCourses ? 'text-amber-600' : ''}`} />
                    {showArchivedCourses ? 'Archived' : 'View Archived'}
                  </button>
                  
                  {!isAssigningCourse ? (
                    <button 
                      onClick={() => setIsAssigningCourse(true)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Assign Course
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                       <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-100">
                         <Search className="w-3.5 h-3.5" />
                         Selecting Course...
                       </div>
                       <button 
                         onClick={() => setIsAssigningCourse(false)}
                         className="p-2.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-2xl transition-all"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  )}
                </div>
              </div>

              {isAssigningCourse && (
                <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search courses..."
                      value={courseSearchTerm}
                      onChange={(e) => setCourseSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {allCourses
                      .filter(ac => 
                        !viewingUser.courses?.some((vc: any) => vc.id === String(ac.id)) &&
                        (ac.courseCode.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
                         ac.courseName.toLowerCase().includes(courseSearchTerm.toLowerCase()))
                      )
                      .map(course => (
                        <button
                          key={course.id}
                          onClick={() => setSelectedCourseId(String(course.id))}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            selectedCourseId === String(course.id) 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                            : 'bg-white border-gray-100 hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <div className={`text-[10px] font-black uppercase ${selectedCourseId === String(course.id) ? 'text-blue-100' : 'text-blue-600'}`}>
                              {course.courseCode}
                            </div>
                            <div className="text-sm font-bold truncate">{course.courseName}</div>
                          </div>
                          {selectedCourseId === String(course.id) && <Check className="w-4 h-4" />}
                        </button>
                      ))
                    }
                  </div>

                  {selectedCourseId && (
                    <div className="flex items-center justify-end pt-4 border-t border-gray-100 gap-3">
                      <button
                        onClick={handleAssignCourse}
                        disabled={isOperationLoading}
                        className="px-6 py-2.5 bg-green-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-green-500/20"
                      >
                        {isOperationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Assignment"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingUser.courses && viewingUser.courses.length > 0 ? (
                  viewingUser.courses
                    .filter((c: any) => c.isArchived === showArchivedCourses)
                    .map((course: any) => (
                    <div key={course.id} className="group bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          {course.courseCode}
                        </span>
                        <button
                          onClick={() => handleUnassignCourse(course.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h5 className="font-bold text-gray-900 mb-4">{course.courseName}</h5>

                      <div className="mt-auto space-y-3 pt-4 border-t border-gray-100/50">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                          <span>Availability</span>
                          <span className="text-gray-900">{course.studentCount} / {course.capacity}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(course.studentCount / course.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-900 mb-1">No courses assigned</h4>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-[40px] p-12">
               <Shield className="w-12 h-12 text-indigo-500 mb-8" />
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">System Administrator</h3>
              <p className="text-gray-500 max-w-sm font-medium">Detailed academic management restricted to Student/Professor roles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="text-[8px] uppercase font-black text-gray-400 mb-1.5 tracking-widest leading-none">
        {label}
      </div>
      <div className="text-sm font-bold text-gray-900 leading-tight truncate">
        {value}
      </div>
    </div>
  );
}

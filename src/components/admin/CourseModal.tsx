"use client";

import React from "react";
import { X, Plus, Edit2, ImageIcon, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Professor {
  id: number;
  firstName: string;
  lastName: string;
  universityId: string;
}

interface CourseModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  modalMode: "create" | "edit";
  formData: {
    courseCode: string;
    courseName: string;
    description: string;
    major: string;
    level: number;
    credits: number;
    professorId: string;
    semester: string;
    academicYear: string;
    capacity: number;
    coverImage: string;
  };
  setFormData: (data: CourseModalProps["formData"]) => void;
  professors: Professor[];
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function CourseModal({
  showModal,
  setShowModal,
  modalMode,
  formData,
  setFormData,
  professors,
  isSubmitting,
  handleSubmit,
}: CourseModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl my-auto shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-white/60"
      >
        <div className="p-10 border-b border-gray-100 bg-gradient-to-br from-gray-50/80 to-white/20 relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-8 right-8 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group/close"
          >
            <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform duration-300" />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-300">
              {modalMode === "create" ? (
                <Plus className="w-8 h-8" />
              ) : (
                <Edit2 className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {modalMode === "create" ? "Curriculum Evolution" : "Refine Offering"}
              </h3>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {modalMode === "create"
                  ? "Initialize a new academic course in the system."
                  : "Update course parameters and identifiers."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Full Academic Title
              </label>
              <input
                required
                type="text"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-200 font-bold text-gray-900 shadow-sm"
                placeholder="Fundamentals of Neural Networks"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Course Token (Code)
              </label>
              <input
                required
                type="text"
                value={formData.courseCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    courseCode: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-mono font-black text-blue-600 bg-blue-50/10 shadow-sm"
                placeholder="CS-402"
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Curriculum Abstract
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all resize-none font-medium text-gray-600 shadow-sm"
                placeholder="Establish a brief overview of the learning objectives and core curriculum components..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                Visual Identity URL
              </label>
              <input
                type="text"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all text-xs font-mono text-gray-400 shadow-sm"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Academic Domain
              </label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm"
                placeholder="e.g. Computer Science"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Level
              </label>
              <div className="relative group/sel">
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map((lv) => (
                    <option key={lv} value={lv}>
                      Level {lv}
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-4 h-4 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover/sel:translate-y-[-40%] transition-transform" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Academic Credits
              </label>
              <input
                required
                type="number"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    credits: parseInt(e.target.value),
                  })
                }
                className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm"
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Faculty Assignment
              </label>
              <div className="relative group/sel">
                <select
                  required
                  value={formData.professorId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professorId: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">Choose Professor...</option>
                  {professors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-4 h-4 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover/sel:translate-y-[-40%] transition-transform" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                Academic Term
              </label>
              <div className="relative group/sel">
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="FALL">Fall Semester</option>
                  <option value="SPRING">Spring Semester</option>
                  <option value="SUMMER">Summer Term</option>
                </select>
                <ChevronRight className="w-4 h-4 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover/sel:translate-y-[-40%] transition-transform" />
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-gray-50 flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-8 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-sm"
            >
              Discard Changes
            </button>
            <button
              disabled={isSubmitting}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-[10px] uppercase tracking-widest flex items-center gap-3 group disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5 group-hover:scale-125 transition-transform" />
              )}
              <span>{modalMode === "create" ? "Initiate Offering" : "Authorize Changes"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

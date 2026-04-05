"use client";

import React from "react";
import { Plus, Loader2 } from "lucide-react";

interface UserAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  newUser: any;
  setNewUser: (user: any) => void;
}

export default function UserAddModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  newUser,
  setNewUser,
}: UserAddModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Add New Member</h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Provision a new identity for the campus ecosystem.
          </p>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">First Name</label>
              <input
                required
                type="text"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Last Name</label>
              <input
                required
                type="text"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Email Address</label>
            <input
              required
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <input
              required
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
              placeholder="Set a secure password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">University ID</label>
              <input
                required
                type="text"
                value={newUser.universityId}
                onChange={(e) => setNewUser({ ...newUser, universityId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                placeholder="e.g. 20240001"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm bg-gray-50"
              >
                <option value="STUDENT">Student</option>
                <option value="PROFESSOR">Professor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {newUser.role === "STUDENT" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Major</label>
                <input
                  type="text"
                  value={newUser.major}
                  onChange={(e) => setNewUser({ ...newUser, major: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                  placeholder="e.g. CS"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Year</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={newUser.year}
                  onChange={(e) => setNewUser({ ...newUser, year: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                  placeholder="1-4"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Department</label>
              <input
                type="text"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                placeholder="e.g. Information Systems"
              />
            </div>
          )}

          <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2 group"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />}
              Create Identity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

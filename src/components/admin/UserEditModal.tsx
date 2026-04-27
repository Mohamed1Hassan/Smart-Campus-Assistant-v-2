"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";

export interface EditingUser {
  id: string;
  firstName: string;
  lastName: string;
  universityId: string;
  [key: string]: string | number | boolean | undefined | null | unknown[];
}

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingUser: EditingUser | null;
  setEditingUser: React.Dispatch<React.SetStateAction<EditingUser | null>>;
  editPassword: string;
  setEditPassword: (pass: string) => void;
}

export default function UserEditModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingUser,
  setEditingUser,
  editPassword,
  setEditPassword,
}: UserEditModalProps) {
  if (!isOpen || !editingUser) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Modify Identity</h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Update core attributes for <span className="text-blue-600">@{editingUser.universityId}</span>
          </p>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">First Name</label>
              <input
                required
                type="text"
                value={editingUser.firstName}
                onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Last Name</label>
              <input
                required
                type="text"
                value={editingUser.lastName}
                onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">University ID</label>
            <input
              required
              type="text"
              value={editingUser.universityId}
              onChange={(e) => setEditingUser({ ...editingUser, universityId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">New Password (Optional)</label>
            <input
              type="password"
              value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
              placeholder="Enter new password to change"
            />
          </div>

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
              className="px-8 py-3 bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-200 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : <Check className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

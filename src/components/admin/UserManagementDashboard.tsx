import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  ShieldOff,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Edit,
  Users,
  Clock,
  Plus,
  Trash2,
  X,
  Check,
  Shield,
  BookOpen,
  Archive,
} from "lucide-react";
import { apiClient } from "@/services/api";
import NextImage from "next/image";
import { getCourseImage } from "@/utils/courseImages";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  universityId: string;
  role: string;
  major?: string;
  department?: string;
  year?: number;
  courses?: {
    id: string;
    courseCode: string;
    courseName: string;
    semester: string;
    academicYear: string;
    capacity: number;
    studentCount: number;
    isArchived: boolean;
    coverImage?: string;
    scheduleTime?: string;
  }[];
  isActive: boolean;
  lastActive?: string;
}

export default function UserManagementDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All Roles");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [isAssigningCourse, setIsAssigningCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [showArchivedCourses, setShowArchivedCourses] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    universityId: "",
    password: "",
    role: "STUDENT",
    major: "",
    year: "",
    department: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async (targetPage: number, search: string, role: string) => {
    setLoading(true);
    try {
      let url = `/admin/users?page=${targetPage}&limit=${pagination.limit}`;
      if (search) url += `&query=${encodeURIComponent(search)}`;
      if (role !== "All Roles") {
        const roleValue = role === "Student" ? "STUDENT" : role === "Professor" ? "PROFESSOR" : "ADMIN";
        url += `&role=${roleValue}`;
      }

      const result = await apiClient.get<{
        users: User[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>(url);
      if (result.success && result.data) {
        setUsers(result.data.users || []);
        setPagination({
          page: result.data.page,
          limit: result.data.limit,
          total: result.data.total,
          totalPages: result.data.totalPages,
        });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]); // Only depend on limit

  const fetchAvailableCourses = async () => {
    try {
      const response = await apiClient.get<any[]>("/api/courses");
      if (response.success && response.data) {
        setAllCourses(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch available courses:", error);
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedCourseId || !viewingUser) return;
    setIsOperationLoading(true);
    try {
      const response = await apiClient.put(`/api/courses/${selectedCourseId}`, {
        professorId: parseInt(viewingUser.id)
      });
      if (response.success) {
        // Refresh viewing user data
        const updatedUserResponse = await apiClient.get<{ users: User[] }>("/api/admin/users", {
          params: { query: viewingUser.universityId }
        });
        if (updatedUserResponse.success && updatedUserResponse.data && updatedUserResponse.data.users.length > 0) {
          setViewingUser(updatedUserResponse.data.users[0]);
        }
        setIsAssigningCourse(false);
        setSelectedCourseId("");
        fetchUsers(pagination.page, searchTerm, filterRole); // Refresh main list too
      }
    } catch (error) {
      console.error("Failed to assign course:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUnassignCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to unassign this professor from this course?")) return;
    setIsOperationLoading(true);
    try {
      // We assign it to some placeholder or just null if possible
      // Looking at course service, we need a professorId. 
      // For now, let's assume we can set it to an unassigned state if the backend allows, 
      // or I'll need to know which professor ID represents "None".
      
      const response = await apiClient.put(`/api/courses/${courseId}`, {
        professorId: 1 // Assuming 1 is a system/admin account that can hold orphan courses
      });
      
      if (response.success) {
        // Refresh viewing user data
        const updatedUserResponse = await apiClient.get<{ users: User[] }>("/api/admin/users", {
          params: { query: viewingUser?.universityId }
        });
        if (updatedUserResponse.success && updatedUserResponse.data && updatedUserResponse.data.users.length > 0) {
          setViewingUser(updatedUserResponse.data.users[0]);
        }
        fetchUsers(pagination.page, searchTerm, filterRole);
      }
    } catch (error) {
      console.error("Failed to unassign course:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page, searchTerm, filterRole);
  }, [pagination.page]); // Only trigger when page changes (search/filter handled by debounce)

  // Debounced search and filter effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchUsers(1, searchTerm, filterRole);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, filterRole]); // Do not depend on fetchUsers or pagination.page

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const result = await apiClient.patch("/admin/users", {
        userId: parseInt(userId),
        isActive: !currentStatus,
      });
      if (result.success) {
        fetchUsers(pagination.page, searchTerm, filterRole);
      }
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    )
      return;

    try {
      const result = await apiClient.delete(`/admin/users?userId=${userId}`);
      if (result.success) {
        fetchUsers(pagination.page, searchTerm, filterRole);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await apiClient.post("/admin/users", newUser);
      if (result.success) {
        setIsAddModalOpen(false);
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          universityId: "",
          password: "",
          role: "STUDENT",
          major: "",
          year: "",
          department: "",
        });
        fetchUsers(1, searchTerm, filterRole);
      } else {
        alert(result.message || "Failed to create user");
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Error occurred";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        userId: parseInt(editingUser.id),
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        universityId: editingUser.universityId,
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      const result = await apiClient.put("/admin/users", payload);
      if (result.success) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setEditPassword("");
        fetchUsers(pagination.page, searchTerm, filterRole);
      } else {
        alert(result.message || "Failed to update user");
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Error occurred";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mix-blend-isolation">
      {/* Header Area */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage all students and professors across the university.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-500/20 transition-all text-sm shrink-0"
        >
          + Add New User
        </button>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Add New User</h3>
              <p className="text-sm text-gray-500">
                Create a new account manually.
              </p>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    First Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Last Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                  placeholder="Set a secure password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    University ID
                  </label>
                  <input
                    required
                    type="text"
                    value={newUser.universityId}
                    onChange={(e) =>
                      setNewUser({ ...newUser, universityId: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder="e.g. 20240001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm bg-gray-50"
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
                    <label className="text-sm font-semibold text-gray-700">
                      Major
                    </label>
                    <input
                      type="text"
                      value={newUser.major}
                      onChange={(e) =>
                        setNewUser({ ...newUser, major: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                      placeholder="e.g. CS"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Year
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={newUser.year}
                      onChange={(e) =>
                        setNewUser({ ...newUser, year: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                      placeholder="1-4"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder="e.g. Information Systems"
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <p className="text-sm text-gray-500">
                Update user details. Leave password blank to keep it unchanged.
              </p>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    First Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Last Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  University ID
                </label>
                <input
                  required
                  type="text"
                  value={editingUser.universityId}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, universityId: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                  placeholder="e.g. 20240001"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                  placeholder="Enter new password to change"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && viewingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">
            {/* Left Column: User Profile */}
            <div className="w-full md:w-80 bg-gray-50/50 border-r border-gray-100 p-8 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20 mb-6">
                  {viewingUser.firstName?.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
              
              <h4 className="font-bold text-2xl text-gray-900 leading-tight mb-2">
                {viewingUser.firstName} {viewingUser.lastName}
              </h4>
              <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider mb-8">
                {viewingUser.role}
              </div>

              <div className="w-full space-y-4 text-left">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">University ID</div>
                  <div className="text-sm font-semibold text-gray-900">{viewingUser.universityId}</div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Email</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{viewingUser.email}</div>
                </div>

                {viewingUser.role === "STUDENT" && (
                  <>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Major</div>
                      <div className="text-sm font-semibold text-gray-900">{viewingUser.major || "N/A"}</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Academic Year</div>
                      <div className="text-sm font-semibold text-gray-900">{viewingUser.year ? `Year ${viewingUser.year}` : "N/A"}</div>
                    </div>
                  </>
                )}

                {viewingUser.role === "PROFESSOR" && viewingUser.department && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Department</div>
                    <div className="text-sm font-semibold text-gray-900">{viewingUser.department}</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="mt-auto w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg shadow-gray-200"
              >
                Close Summary
              </button>
            </div>

            {/* Right Column: Content (Courses etc) */}
            <div className="flex-1 p-8 overflow-visible flex flex-col">
              {viewingUser.role === "PROFESSOR" ? (
                <>
                  <div className="flex items-center justify-between mb-8 overflow-visible relative">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Teaching Curriculum</h3>
                        <p className="text-gray-500">Manage assigned courses and student capacity</p>
                      </div>
                      
                      {/* Archived Toggle */}
                      <button 
                        onClick={() => setShowArchivedCourses(!showArchivedCourses)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold ${
                          showArchivedCourses 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-inner' 
                          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        <Archive className={`w-4 h-4 ${showArchivedCourses ? 'text-amber-600' : ''}`} />
                        {showArchivedCourses ? 'Showing Archived' : 'View Archived'}
                        {viewingUser.courses && viewingUser.courses.filter(c => c.isArchived).length > 0 && !showArchivedCourses && (
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    </div>
                    
                    {!isAssigningCourse ? (
                      <button 
                        onClick={() => {
                          fetchAvailableCourses();
                          setIsAssigningCourse(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Assign New Course
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 min-w-[320px] animate-in slide-in-from-right duration-300 relative">
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="w-4 h-4" />
                          </div>
                          <input 
                            type="text"
                            placeholder="Search code or name..."
                            value={courseSearchTerm}
                            onFocus={() => {
                              if (!allCourses.length) fetchAvailableCourses();
                            }}
                            onChange={(e) => setCourseSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             {allCourses.length > 0 && (
                               <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-md">
                                 {allCourses.filter(ac => !viewingUser.courses?.some(vc => vc.id === String(ac.id))).length} available
                               </span>
                             )}
                             {courseSearchTerm && (
                              <button 
                                onClick={() => {
                                  setCourseSearchTerm("");
                                  setSelectedCourseId("");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="absolute top-[110%] left-0 right-0 z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                          {allCourses.length > 0 ? (
                            <>
                              {allCourses
                                .filter(ac => 
                                  !viewingUser.courses?.some(vc => vc.id === String(ac.id)) &&
                                  (ac.courseCode.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
                                   ac.courseName.toLowerCase().includes(courseSearchTerm.toLowerCase()))
                                )
                                .map(course => (
                                  <button
                                    key={course.id}
                                    onClick={() => {
                                      setSelectedCourseId(String(course.id));
                                      setCourseSearchTerm(`${course.courseCode} - ${course.courseName}`);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between group transition-all ${selectedCourseId === String(course.id) ? 'bg-blue-50' : ''}`}
                                  >
                                    <div>
                                      <div className={`text-sm font-bold ${selectedCourseId === String(course.id) ? 'text-blue-700' : 'text-gray-900'} group-hover:text-blue-700`}>{course.courseCode}</div>
                                      <div className="text-xs text-gray-500">{course.courseName}</div>
                                    </div>
                                    {selectedCourseId === String(course.id) && (
                                      <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                  </button>
                                ))
                              }
                              {allCourses.filter(ac => 
                                  !viewingUser.courses?.some(vc => vc.id === String(ac.id)) &&
                                  (ac.courseCode.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
                                   ac.courseName.toLowerCase().includes(courseSearchTerm.toLowerCase()))
                              ).length === 0 && (
                                <div className="p-8 text-center">
                                  <div className="text-sm font-bold text-gray-900 mb-1">No matches found</div>
                                  <div className="text-xs text-gray-500">Try a different name or code.</div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-8 text-center flex flex-col items-center gap-3">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                              <div className="text-xs font-medium text-gray-500">Fetching available courses...</div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={handleAssignCourse}
                            disabled={!selectedCourseId || isOperationLoading}
                            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                          >
                            {isOperationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Confirm
                          </button>
                          <button 
                            onClick={() => {
                              setIsAssigningCourse(false);
                              setSelectedCourseId("");
                              setCourseSearchTerm("");
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {viewingUser.courses && viewingUser.courses.filter(c => c.isArchived === showArchivedCourses).length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {viewingUser.courses
                          .filter(c => c.isArchived === showArchivedCourses)
                          .map((course, idx) => (
                          <div key={idx} className={`group relative bg-white rounded-3xl border overflow-hidden hover:shadow-2xl transition-all duration-500 ${course.isArchived ? 'border-amber-100 grayscale-[0.3]' : 'border-gray-100'}`}>
                            {/* Card Header with Image */}
                            <div className="h-32 relative">
                              <div className={`absolute inset-0 z-10 ${course.isArchived ? 'bg-gradient-to-t from-amber-900/80 via-transparent to-transparent' : 'bg-gradient-to-t from-black/80 via-transparent to-transparent'}`} />
                              <NextImage
                                src={
                                  course.coverImage ||
                                  getCourseImage(course.courseName, course.id)
                                }
                                alt={course.courseName}
                                fill
                                unoptimized
                                className="absolute inset-0 object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 z-20 p-5 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                  <span className={`px-3 py-1 backdrop-blur-md rounded-full text-[10px] font-bold text-white border ${course.isArchived ? 'bg-amber-500/30 border-amber-400/50' : 'bg-white/20 border-white/30'}`}>
                                    {course.courseCode} • {course.semester} {course.isArchived && "• ARCHIVED"}
                                  </span>
                                  <button 
                                    onClick={() => handleUnassignCourse(course.id)}
                                    className="p-2 bg-red-500/20 hover:bg-red-500 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                                    title="Unassign Professor"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <h5 className="text-lg font-bold text-white line-clamp-1 truncate">
                                  {course.courseName}
                                </h5>
                              </div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="p-5 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                  <Users className="w-4 h-4" />
                                  <span>Enrolled Students</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                  {course.studentCount} / {course.capacity}
                                </span>
                              </div>
                              
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ${course.isArchived ? 'bg-amber-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min((course.studentCount / course.capacity) * 100, 100)}%` }}
                                />
                              </div>

                              {course.scheduleTime && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-2xl">
                                  <Clock className="w-4 h-4 text-blue-500" />
                                  <span className="font-semibold">{course.scheduleTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                          <BookOpen className="w-10 h-10 text-gray-300" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">No {showArchivedCourses ? 'Archived' : 'Active'} Courses</h4>
                        <p className="text-gray-500 max-w-xs">
                          {showArchivedCourses 
                            ? "This professor doesn't have any archived curriculum records." 
                            : "This professor isn't assigned to any active courses yet."}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center bg-gray-50 rounded-[40px] border border-gray-100">
                   <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/5 mb-8">
                    <Shield className="w-12 h-12 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">System Administrator</h3>
                  <p className="text-gray-500 max-w-sm">Detailed academic management is restricted to Student and Professor roles.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Area */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center bg-white">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm bg-gray-50 font-medium text-gray-700 cursor-pointer min-w-[140px]"
            >
              <option>All Roles</option>
              <option>Student</option>
              <option>Professor</option>
              <option>Admin</option>
            </select>
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Role & Dept
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50/50 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                      {user.firstName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {user.universityId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium">
                    {user.role}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.department || user.major}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:shadow-sm transition-all ${user.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    {user.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.lastActive || "N/A"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      className={`p-1.5 rounded-lg transition-colors ${user.isActive ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                      title={user.isActive ? "Suspend User" : "Activate User"}
                    >
                      {user.isActive ? (
                        <ShieldOff className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setEditPassword("");
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setViewingUser(user);
                        setIsInfoModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="View Details"
                    >
                      <div className="w-4 h-4 flex items-center justify-center font-bold font-serif text-sm border border-current rounded-full leading-none shrink-0" style={{ paddingBottom: "1px" }}>i</div>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete User"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No users found matching your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} users
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-3 py-1 border border-gray-200 rounded-md transition-all ${pagination.page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 text-gray-700"}`}
          >
            Prev
          </button>
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-3 py-1 border rounded-md transition-all ${pagination.page === i + 1 ? "bg-blue-50 text-blue-600 font-medium border-blue-200" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-3 py-1 border border-gray-200 rounded-md transition-all ${pagination.page === pagination.totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 text-gray-700"}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

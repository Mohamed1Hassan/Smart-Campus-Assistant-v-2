import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Filter,
  ShieldOff,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { apiClient } from "@/services/api";

// Lazy load heavy modal components for better Lighthouse performance
const UserAddModal = dynamic(() => import("./UserAddModal"), { 
  loading: () => <Loader2 className="animate-spin" />,
  ssr: false 
});
const UserEditModal = dynamic(() => import("./UserEditModal"), { 
  loading: () => <Loader2 className="animate-spin" />,
  ssr: false 
});
const UserInfoModal = dynamic(() => import("./UserInfoModal"), { 
  loading: () => <Loader2 className="animate-spin" />,
  ssr: false 
});

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mix-blend-isolation">
      {/* Header Area */}
      <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-gray-50/50 to-white/30">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">
            User Management
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Supervise students and faculty members across the campus.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest shrink-0 flex items-center gap-2 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Lazy Loaded Modals */}
      <UserAddModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleAddUser}
        isSubmitting={isSubmitting}
        newUser={newUser}
        setNewUser={setNewUser}
      />

      <UserEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditUser}
        isSubmitting={isSubmitting}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        editPassword={editPassword}
        setEditPassword={setEditPassword}
      />

      <UserInfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        viewingUser={viewingUser}
        showArchivedCourses={showArchivedCourses}
        setShowArchivedCourses={setShowArchivedCourses}
        isAssigningCourse={isAssigningCourse}
        setIsAssigningCourse={(val) => {
          if (val) fetchAvailableCourses();
          setIsAssigningCourse(val);
        }}
        courseSearchTerm={courseSearchTerm}
        setCourseSearchTerm={setCourseSearchTerm}
        allCourses={allCourses}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        handleAssignCourse={handleAssignCourse}
        handleUnassignCourse={handleUnassignCourse}
        isOperationLoading={isOperationLoading}
      />

      {/* Filter Area */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-6 items-center bg-white/50">
        <div className="relative w-full md:w-96 group">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium shadow-sm"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group">
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none pl-11 pr-11 py-3 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-[10px] font-black uppercase tracking-widest text-gray-700 cursor-pointer min-w-[160px] shadow-sm"
            >
              <option>All Roles</option>
              <option>Student</option>
              <option>Professor</option>
              <option>Admin</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 first:pl-10">
                Identity
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                Role & Division
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                Security Status
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                Last Activity
              </th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pr-10">
                Operations
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50 bg-white/30">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-blue-50/30 transition-all group/row"
              >
                <td className="px-8 py-5 first:pl-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/10 shrink-0 group-hover/row:scale-110 transition-transform duration-300">
                      {user.firstName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 group-hover/row:text-blue-600 transition-colors">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                        ID: {user.universityId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm text-gray-900 font-bold">
                    {user.role}
                  </div>
                  <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                    {user.department || user.major}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer hover:shadow-md transition-all active:scale-95 ${
                      user.isActive 
                      ? "bg-green-50 text-green-700 border-green-100 shadow-sm shadow-green-500/5" 
                      : "bg-red-50 text-red-700 border-red-100 shadow-sm shadow-red-500/5"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                    ></span>
                    {user.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-gray-500">
                  {user.lastActive || "N/A"}
                </td>
                <td className="px-8 py-5 text-right pr-10">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      className={`p-2 rounded-xl transition-all ${user.isActive ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
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
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all px-3"
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setViewingUser(user);
                        setIsInfoModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all px-4"
                      title="View Details"
                    >
                      <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-4 h-4 flex items-center justify-center border-2 border-current rounded-lg text-[8px] leading-none pt-0.5">i</div>
                        <span>Profile</span>
                      </div>
                    </button>
                    <div className="h-4 w-px bg-gray-100 mx-1"></div>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-100 transition-all"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
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
      <div className="p-6 border-t border-gray-100 bg-white/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100/50 px-4 py-2 rounded-full border border-gray-100">
          Showing <span className="text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
          <span className="text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
          <span className="text-blue-600">{pagination.total}</span> entries
        </div>
        <div className="flex gap-1.5 bg-gray-100/30 p-1.5 rounded-2xl border border-gray-100">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              pagination.page === 1 
              ? "text-gray-300 cursor-not-allowed" 
              : "bg-white text-gray-600 hover:bg-white hover:text-blue-600 shadow-sm border border-gray-100"
            }`}
          >
            Prev
          </button>
          <div className="hidden sm:flex items-center gap-1">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                  pagination.page === i + 1 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "hover:bg-white text-gray-400 border border-transparent hover:border-gray-100 hover:text-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              pagination.page === pagination.totalPages 
              ? "text-gray-300 cursor-not-allowed" 
              : "bg-white text-gray-600 hover:bg-white hover:text-blue-600 shadow-sm border border-gray-100"
            }`}
          >
            Next
          </button>
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

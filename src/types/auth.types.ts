// Shared Authentication Types

export interface User {
  id: string;
  universityId: string;
  email: string;
  role: "student" | "professor" | "admin";
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isActive: boolean;
  major?: string;
  level?: number;
  faceDescriptor?: unknown; // To be refined if possible
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

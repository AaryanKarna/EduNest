/**
 * types.ts
 * Type definitions for EduNest educational platform
 */

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'link';
  url: string;
  size?: string;
  updatedDate?: string;
}

export interface Assignment {
  id: string;
  title: string;
  topic: string;
  dueDate: string;
  status: 'pending' | 'submitted';
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  instructorName: string;
  department: string;
  duration: string;
  level: string;
  studentCount: number;
  enrolledStudents: string[]; // User IDs of enrolled students
  materials: Material[];
  assignments: Assignment[];
  semester?: string; // e.g. "Autumn 2026", "Spring 2026", "Autumn 2025"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

export interface Message {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  timestamp: string;
  agentId?: string;
  attachment?: {
    name: string;
    type: string;
    size?: string;
    isImage?: boolean;
    dataUrl?: string; // Base64 data if image or text file
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  content?: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade?: string;
  feedback?: string;
}

export interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'teacher';
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'teacher';
  title: string;
  content: string;
  replies: ForumReply[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string; // Target user ID, 'all' or 'teachers' to filter
  role?: 'student' | 'teacher';
  title: string;
  description: string;
  type: 'material' | 'assignment' | 'submission' | 'forum' | 'announcement';
  courseId: string;
  courseCode: string;
  courseTitle: string;
  createdAt: string;
  read: boolean;
}


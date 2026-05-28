/**
 * api.ts
 * Frontend API client helper to interact with EduNest Express Server
 */

import { Course, Material, Assignment, User, Message, Submission, ForumPost, AppNotification } from "../types";

export const API_BASE = "/api";

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Authentication failed.");
  }
  return res.json();
}

export async function registerUser(name: string, email: string, password: string, role: 'student' | 'teacher'): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Registration failed.");
  }
  return res.json();
}

export async function getCourses(): Promise<Course[]> {
  const res = await fetch(`${API_BASE}/courses`);
  if (!res.ok) {
    throw new Error("Failed to fetch courses.");
  }
  return res.json();
}

export async function createCourse(data: {
  title: string;
  code: string;
  description: string;
  instructorName: string;
  department: string;
  duration: string;
  level: string;
  semester?: string;
}): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to create new course.");
  }
  return res.json();
}

export async function enrollStudent(courseId: string, studentEmail: string): Promise<{ success: boolean; course: Course }> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentEmail }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to enroll student.");
  }
  return res.json();
}

export async function addMaterial(courseId: string, title: string, type: 'pdf' | 'docx' | 'link', url?: string, size?: string): Promise<Material> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/materials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, type, url, size }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to upload study material.");
  }
  return res.json();
}

export async function addAssignment(courseId: string, title: string, topic: string, dueDate: string): Promise<Assignment> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, topic, dueDate }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to create assignment.");
  }
  return res.json();
}

export async function getActivities(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/activities`);
  if (!res.ok) {
    throw new Error("Failed to fetch activities.");
  }
  return res.json();
}

export async function logActivity(studentId: string, text: string, subject: string): Promise<any> {
  const res = await fetch(`${API_BASE}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, text, subject }),
  });
  if (!res.ok) {
    throw new Error("Failed to log activity.");
  }
  return res.json();
}

export async function askAIChat(
  courseId: string, 
  prompt: string, 
  chatHistory: Message[], 
  studentName?: string,
  agentId?: string,
  attachment?: {
    name: string;
    type: string;
    size?: string;
    isImage?: boolean;
    dataUrl?: string;
  }
): Promise<string> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, chatHistory, studentName, agentId, attachment }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to query AI Assistant.");
  }
  const data = await res.json();
  return data.response;
}

// 9. Course Submissions API
export async function getSubmissions(courseId: string): Promise<Submission[]> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/submissions`);
  if (!res.ok) {
    throw new Error("Failed to fetch course submissions.");
  }
  return res.json();
}

export async function submitAssignment(
  courseId: string,
  data: {
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    content?: string;
  }
): Promise<Submission> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to submit assignment.");
  }
  return res.json();
}

export async function gradeSubmission(submissionId: string, grade: string, feedback?: string): Promise<Submission> {
  const res = await fetch(`${API_BASE}/submissions/${submissionId}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grade, feedback }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to grade submission.");
  }
  return res.json();
}

// 10. Forum API
export async function getForumPosts(courseId: string): Promise<ForumPost[]> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/forum`);
  if (!res.ok) {
    throw new Error("Failed to fetch discussion forum.");
  }
  return res.json();
}

export async function createForumPost(
  courseId: string,
  data: {
    authorId: string;
    authorName: string;
    authorRole: 'student' | 'teacher';
    title: string;
    content: string;
  }
): Promise<ForumPost> {
  const res = await fetch(`${API_BASE}/courses/${courseId}/forum`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to post thread on forum.");
  }
  return res.json();
}

export async function createForumReply(
  postId: string,
  data: {
    authorId: string;
    authorName: string;
    authorRole: 'student' | 'teacher';
    content: string;
  }
): Promise<ForumPost> {
  const res = await fetch(`${API_BASE}/forum/posts/${postId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to reply to the thread.");
  }
  return res.json();
}

// 11. Notifications API
export async function getNotifications(userId?: string, role?: 'student' | 'teacher'): Promise<AppNotification[]> {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (role) params.append("role", role);

  const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch notifications.");
  }
  return res.json();
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) {
    throw new Error("Failed to mark notification as read.");
  }
  return res.json();
}

export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error("Failed to mark all notifications as read.");
  }
  return res.json();
}

import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  ChevronRight, 
  User, 
  Timer, 
  BarChart, 
  PlayCircle, 
  Download, 
  CheckCircle, 
  Bot, 
  Send,
  Sparkles,
  RefreshCw,
  HelpCircle,
  FileText,
  MessageSquare,
  Upload,
  Award,
  Plus,
  Paperclip,
  Image as ImageIcon,
  Zap,
  BookOpen,
  AlertTriangle,
  Check
} from "lucide-react";
import { Course, Material, User as UserType, Message, Submission, ForumPost } from "../types";
import { askAIChat, logActivity, getSubmissions, submitAssignment, gradeSubmission, getForumPosts, createForumPost, createForumReply } from "../services/api";
import NotificationBell from "./NotificationBell";

interface CoursePageProps {
  course: Course;
  user: UserType;
  onBackToDashboard: () => void;
}

export default function CoursePage({ course, user, onBackToDashboard }: CoursePageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      sender: "ai",
      text: `Hi ${user.name}! I'm your dedicated EduNest AI Coach for "${course.title}". Ask me any questions about our curriculum modules, homework questions, or exams!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  
  const [inputText, setInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
  // Custom AI Coaches & Multimodal File selections states
  const [selectedAgentId, setSelectedAgentId] = useState<string>("coach-general");
  const [selectedAttachment, setSelectedAttachment] = useState<{
    name: string;
    type: string;
    size?: string;
    isImage?: boolean;
    dataUrl?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingMatId, setDownloadingMatId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'curriculum' | 'assignments' | 'forum'>('curriculum');
  
  // Real database states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [forumLoading, setForumLoading] = useState(false);

  // Assignment submissions states
  const [submitAsgId, setSubmitAsgId] = useState<string | null>(null);
  const [solutionContent, setSolutionContent] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedFileName, setSubmittedFileName] = useState("");

  // Teacher grading states
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [givenGrade, setGivenGrade] = useState("");
  const [givenFeedback, setGivenFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  // Forum states
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [postingForum, setPostingForum] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newReplyContent, setNewReplyContent] = useState("");
  const [replyingForum, setReplyingForum] = useState(false);

  // Fetching methods
  const fetchSubmissionsData = async () => {
    try {
      setSubmissionsLoading(true);
      const list = await getSubmissions(course.id);
      setSubmissions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchForumData = async () => {
    try {
      setForumLoading(true);
      const list = await getForumPosts(course.id);
      setForumPosts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setForumLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchSubmissionsData();
    } else if (activeTab === 'forum') {
      fetchForumData();
    }
  }, [activeTab, course.id]);

  // Handle student submission action
  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitAsgId) return;

    const trimmedAsgName = attachmentName.trim();
    if (!trimmedAsgName) {
      setSubmissionError("Attachment file name cannot be empty.");
      return;
    }

    const dotIndex = trimmedAsgName.lastIndexOf('.');
    if (dotIndex === -1) {
      setSubmissionError("The attachment file name must include a valid extension (e.g. '.pdf', '.docx', '.zip', '.py').");
      return;
    }

    const fileExt = trimmedAsgName.substring(dotIndex + 1);
    if (!fileExt) {
      setSubmissionError("Please specify a standard file extension after the dot (e.g. '.pdf', '.docx').");
      return;
    }

    if (!/^[a-zA-Z0-9]{1,8}$/.test(fileExt)) {
      setSubmissionError(`"${fileExt}" is not a valid file extension. Please use letters and numbers only.`);
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionError(null);
      const fileType = fileExt;
      await submitAssignment(course.id, {
        assignmentId: submitAsgId,
        studentId: user.id,
        studentName: user.name,
        studentEmail: user.email,
        fileName: trimmedAsgName,
        fileType,
        fileSize: "1.4 MB",
        content: solutionContent
      });

      setSubmittedFileName(trimmedAsgName);
      setIsSubmittedSuccess(true);
      setSolutionContent("");
      setAttachmentName("");

      // Refresh submissions
      fetchSubmissionsData();
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle teacher grading action
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;
    if (!givenGrade.trim()) {
      alert("Grade is required.");
      return;
    }
    try {
      setGrading(true);
      await gradeSubmission(gradingSubmissionId, givenGrade, givenFeedback);
      alert(`Success: Submission has been graded successfully.`);
      setGradingSubmissionId(null);
      setGivenGrade("");
      setGivenFeedback("");

      // Refresh submissions
      fetchSubmissionsData();
    } catch (err: any) {
      alert(err.message || "Failed to submit grade.");
    } finally {
      setGrading(false);
    }
  };

  // Handle forum posting
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert("Title and content are required.");
      return;
    }
    try {
      setPostingForum(true);
      await createForumPost(course.id, {
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        title: newPostTitle,
        content: newPostContent
      });
      alert("Success: Your discussion thread has been posted to the forum.");
      setNewPostTitle("");
      setNewPostContent("");
      fetchForumData();
    } catch (err: any) {
      alert(err.message || "Failed to create post.");
    } finally {
      setPostingForum(false);
    }
  };

  // Handle replying to forum post
  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedPostId || !newReplyContent.trim()) return;
    try {
      setReplyingForum(true);
      await createForumReply(expandedPostId, {
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        content: newReplyContent
      });
      setNewReplyContent("");
      fetchForumData();
    } catch (err: any) {
      alert(err.message || "Failed to reply.");
    } finally {
      setReplyingForum(false);
    }
  };

  // Auto scroll chat scroll container
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Please upload a file smaller than 8 MB.");
      return;
    }

    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + " MB" 
      : (file.size / 1024).toFixed(0) + " KB";

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: sizeStr,
        isImage: file.type.startsWith("image/"),
        dataUrl: reader.result as string
      });

      // Visually prompt if it is an image to switch/suggest the visual coach
      if (file.type.startsWith("image/")) {
        setSelectedAgentId("coach-visual");
        setMessages(prev => [
          ...prev,
          {
            id: "msg_auto_visual_" + Date.now(),
            sender: "ai",
            text: `I notice you attached a photo image/diagram: **${file.name}** (${sizeStr}). I've automatically engaged the **Diagram & File Explainer** agent! Press **Send** to dissect its components together.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentId: "coach-visual"
          }
        ]);
      } else {
        // Document uploaded
        setMessages(prev => [
          ...prev,
          {
            id: "msg_auto_doc_" + Date.now(),
            sender: "ai",
            text: `I notice you uploaded a document attachment: **${file.name}** (${sizeStr}). Submit with a question so we can analyze it!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    let greeting = "";
    if (agentId === "coach-socratic") {
      greeting = `Hello, I am your **Socratic Mental Mentor**. I won't just hand you answers—let's uncover solutions together! Ask me a question about your curriculum or files, and we'll break it down step-by-step. What is on your mind?`;
    } else if (agentId === "coach-stress") {
      greeting = `Hey there, I am your **Study Buddy & Vibe Coach**! I'm here to cheer you on, handle study fatigue, keep stress low, and optimize your Pomodoro sessions. High-fives! How's your energy level feeling right now?`;
    } else if (agentId === "coach-critic") {
      greeting = `Greetings! I am your academic **Homework Draft Critic**. Feel free to paste draft answers or outline documents here. I will evaluate and proofread them to make sure they are pristine. What draft shall we inspect today?`;
    } else if (agentId === "coach-visual") {
      greeting = `Hello! I am your **Diagram & File Explainer**. I have multimodal computer vision. Upload any scanned diagrams, math formula screenshots, architectural charts, or code screenshots, and I will walk you through them step-by-step. Let me see your files!`;
    } else {
      greeting = `Hi ${user.name}! I'm your dedicated **EduNest General Coach** for "${course.title}". Ask me any questions about curriculum modules, downloads, homework problems, or exams!`;
    }

    setMessages(prev => [
      ...prev,
      {
        id: "msg_agent_switch_" + Date.now(),
        sender: "ai",
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentId: agentId
      }
    ]);
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const prompt = (customText || inputText).trim();
    if (!prompt && !selectedAttachment) return;

    // Add user message to state
    const newUserMsg: Message = {
      id: "msg_u_" + Date.now(),
      sender: "student",
      text: prompt || `Please dissect my uploaded attachment: ${selectedAttachment?.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentId: selectedAgentId,
      attachment: selectedAttachment ? { ...selectedAttachment } : undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    
    const currentAttachment = selectedAttachment;
    setSelectedAttachment(null);
    setAiLoading(true);

    try {
      // Query the backend server-side Gemini route, passing agent selection and attachment objects
      const replies = await askAIChat(
        course.id, 
        prompt || `Please explain the attached file: ${currentAttachment?.name}`, 
        [...messages, newUserMsg], 
        user.name,
        selectedAgentId,
        currentAttachment ? {
          name: currentAttachment.name,
          type: currentAttachment.type,
          size: currentAttachment.size,
          isImage: currentAttachment.isImage,
          dataUrl: currentAttachment.dataUrl
        } : undefined
      );
      
      const newAiMsg: Message = {
        id: "msg_ai_" + Date.now(),
        sender: "ai",
        text: replies,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentId: selectedAgentId
      };

      setMessages(prev => [...prev, newAiMsg]);

    } catch (err: any) {
      console.error(err);
      
      const errorMsg: Message = {
        id: "msg_err_" + Date.now(),
        sender: "ai",
        text: "I experienced a glitch communicating with the server. Please ensure you are connected to the internet and configured credentials safely in Secrets.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadMaterial = async (mat: Material) => {
    setDownloadingMatId(mat.id);
    try {
      // Log the download activity on back-end
      await logActivity(user.id, `Downloaded "${mat.title}"`, course.title);
      
      // Simulate network lag
      await new Promise(resolve => setTimeout(resolve, 600));
      alert(`Download complete: '${mat.title}' has been saved to your downloads cache.`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingMatId(null);
    }
  };

  const autoQuery = (text: string) => {
    setInputText(text);
    handleSendMessage(undefined, text);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Mini head overlay */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 h-14 flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 p-2 hover:bg-slate-50 text-blue-900 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Dashboard
        </button>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            Active Syllabus Workspace: {course.code}
          </span>
          <NotificationBell user={user} />
        </div>
      </header>

      {/* Grid container with Course content + AI Sidebar */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 relative">
        
        {/* Left Side: Study Course Content (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Course Banner Card with hotlinked picture */}
          <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 shadow-soft bg-blue-950 flex flex-col justify-end">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/40 to-transparent z-10" />
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5518jbyJ6ctKjHZ4tMNlTip9beTO9LOqh_8FMbMPy-iPbK50SiLElT3_QXbUFVXnwK5sNB8lNqstlSNI8ntqzCTZLGfz7BC3HbTeGC9bDoMtw4iUu5chfbfCk6fVcHWpVJg_ekyR0lKFEOIAvYzMI_QhLU50vlmLgR-V9xos30fM-gB3F6M3y4t74vuBJMPLZJFgRlsRS58sRXOzDZOleICpCijHsrmsYWMHKe4edvzQYYCFO5-aUdI3g_zwwBoUWnFqa6LG4WGAC" 
              alt="Psychology textbook background mockup" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" 
            />
            
            <div className="relative p-6 md:p-8 z-20 text-white space-y-2">
              <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold font-mono inline-block">
                {course.code}
              </span>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight">
                {course.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-150/90 font-medium">
                <span className="flex items-center gap-1"><User className="w-4 h-4 text-blue-300" /> Prof. Elena Vance</span>
                <span className="flex items-center gap-1"><Timer className="w-4 h-4 text-blue-300" /> {course.duration}</span>
                <span className="flex items-center gap-1"><BarChart className="w-4 h-4 text-blue-300" /> {course.level}</span>
              </div>
            </div>
          </div>

          {/* Premium Tab Bar */}
          <nav className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-soft gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("curriculum")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "curriculum"
                  ? "bg-blue-900 text-white shadow-soft"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              Syllabus & Materials
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === "assignments"
                  ? "bg-blue-900 text-white shadow-soft"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Award className="w-4 h-4" />
              Assignments & Grades
              {course.assignments.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {course.assignments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("forum");
                setExpandedPostId(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "forum"
                  ? "bg-blue-900 text-white shadow-soft"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Discussion Forum
            </button>
          </nav>

          {/* Active Tab Workspace Contents */}
          {activeTab === "curriculum" && (
            <div className="space-y-6">
              {/* Collapsible Curriculum modules display */}
              <div className="space-y-4">
                <h3 className="font-display font-extrabold text-base text-blue-950">
                  Interactive Course Syllabus Curriculum
                </h3>

                <div className="space-y-3.5">
                  {/* Module 1 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm">
                          01
                        </div>
                        <span className="font-bold text-sm text-slate-900">Module 1: Foundations of the Curriculum</span>
                      </div>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono uppercase font-semibold">Active</span>
                    </div>
                    <div className="space-y-2.5 text-xs text-slate-600 font-medium pl-11">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-2 text-slate-700"><PlayCircle className="w-4.5 h-4.5 text-slate-400 shrink-0" /> Basic Overview and Defining Statements</span>
                        <span className="font-mono text-slate-400">12:45 sec</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-2 text-slate-700"><PlayCircle className="w-4.5 h-4.5 text-slate-400 shrink-0" /> Core theoretical context from Nepalese perspectives</span>
                        <span className="font-mono text-slate-400">Reading Assignment</span>
                      </div>
                    </div>
                  </div>

                  {/* Module 2 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm">
                          02
                        </div>
                        <span className="font-bold text-sm text-slate-900">Module 2: Practical Exercises and Integrative Lab</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Not Started</span>
                    </div>
                    <div className="space-y-2.5 text-xs text-slate-600 font-medium pl-11">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-2 text-slate-700"><PlayCircle className="w-4.5 h-4.5 text-slate-400 shrink-0" /> Analytical models and past problem reviews</span>
                        <span className="font-mono text-slate-400">20:15 sec</span>
                      </div>
                    </div>
                  </div>

                  {/* Module 3 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm">
                          03
                        </div>
                        <span className="font-bold text-sm text-slate-900">Module 3: Exam Prep and Capstone Submissions</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Not Started</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Downloadable study materials lists */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
                <h3 className="font-display font-extrabold text-sm text-blue-950 mb-4 uppercase tracking-wider">
                  Downloadable Course Materials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.materials.map((mat) => (
                    <div 
                      key={mat.id}
                      className="p-3.5 rounded-xl border border-slate-200 border-dashed hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-slate-800"
                    >
                      <div className="flex items-center gap-2.5 font-normal">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{mat.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Format: {mat.type.toUpperCase()} {mat.size ? `• ${mat.size}` : ""}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadMaterial(mat)}
                        disabled={downloadingMatId === mat.id}
                        className="p-2 bg-slate-50 text-slate-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Download this file"
                      >
                        <Download className={`w-4 h-4 ${downloadingMatId === mat.id ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === "assignments" && (
            <div className="space-y-6">
              {/* If User is Student, show assignments list + solve console */}
              {user.role === "student" ? (
                <div className="space-y-6">
                  {/* Solve submission dialog container */}
                  {submitAsgId && (
                    <div className="bg-amber-50/50 border border-amber-200 p-6 rounded-xl space-y-4 shadow-soft overflow-hidden">
                      {isSubmittedSuccess ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -15, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 100, damping: 15 }}
                          className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl flex flex-col items-center text-center space-y-5 shadow-soft"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: [0, 1.25, 1], rotate: 0 }}
                            transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 12 }}
                            className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-sm"
                          >
                            <Check className="w-10 h-10 stroke-[3.5]" />
                          </motion.div>
                          
                          <div className="space-y-1.5">
                            <h4 className="font-extrabold text-base text-slate-900">Assignment Draft Submitted!</h4>
                            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                              Your solution file <strong className="text-emerald-800 font-mono break-all bg-emerald-100/60 px-1.5 py-0.5 rounded">"{submittedFileName}"</strong> has been successfully uploaded and registered in the database.
                            </p>
                          </div>

                          <div className="bg-white px-4 py-2.5 rounded-lg border border-emerald-100 flex items-center gap-2 text-xs text-slate-600 font-mono shadow-tiny">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span>Status: <strong className="text-emerald-700 font-bold">Successfully Uploaded</strong> (1.4 MB)</span>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSubmitAsgId(null);
                              setIsSubmittedSuccess(false);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-lg shadow-soft cursor-pointer transition-colors"
                          >
                            Done & Back to Tasks
                          </motion.button>
                        </motion.div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase font-mono">Solution Workspace</span>
                              <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                                Submitting: {course.assignments.find(a => a.id === submitAsgId)?.title}
                              </h4>
                            </div>
                            <button
                              onClick={() => {
                                setSubmitAsgId(null);
                                setSolutionContent("");
                                setAttachmentName("");
                                setSubmissionError(null);
                              }}
                              className="text-xs text-slate-400 hover:text-slate-800 font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                          <form onSubmit={handleSubmissionSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Attachment File Name</label>
                                <input
                                  type="text"
                                  required
                                  value={attachmentName}
                                  onChange={(e) => {
                                    setAttachmentName(e.target.value);
                                    if (submissionError) setSubmissionError(null);
                                  }}
                                  placeholder="e.g. Rohan_Sharma_Asg1_Syllabus.docx"
                                  className="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-800 outline-none focus:ring-1 focus:ring-blue-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex gap-1.5 items-center">
                                  Select Demo Resource (Auto-fill)
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAttachmentName(`${user.name.replace(" ", "_")}_Draft_Report.pdf`);
                                      setSubmissionError(null);
                                    }}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold"
                                  >
                                    Draft_Report.pdf
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAttachmentName(`${user.name.replace(" ", "_")}_CodeSolution.py`);
                                      setSubmissionError(null);
                                    }}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold"
                                  >
                                    CodeSolution.py
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Write Notes / Text Draft Solution (Optional)</label>
                              <textarea
                                value={solutionContent}
                                onChange={(e) => setSolutionContent(e.target.value)}
                                placeholder="Write your research paper drafts or code snippets here..."
                                rows={4}
                                className="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-800 font-normal outline-none focus:ring-1 focus:ring-blue-900 custom-scrollbar"
                              />
                            </div>

                            {submissionError && (
                              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-start gap-2.5 leading-relaxed">
                                <AlertTriangle className="w-4 h-4 text-red-655 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="font-bold block mb-0.5">Validation Error</strong> 
                                  <span>{submissionError}</span>
                                </div>
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={submitting}
                              className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-soft"
                            >
                              <Upload className="w-4 h-4 animate-pulse" />
                              {submitting ? "Uploading draft..." : "Submit File to Instructor"}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  )}

                  {/* Course Syllabus Assignments List */}
                  <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-soft">
                    <h4 className="font-extrabold text-base text-slate-900">Current Assigned Tasks</h4>
                    <div className="space-y-4">
                      {course.assignments.map((asg) => {
                        // Find matching submission dynamically
                        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === user.id);
                        return (
                          <div key={asg.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="space-y-1">
                              <div className="flex gap-2 items-center">
                                <span className="text-[9px] uppercase font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                                  Due: {asg.dueDate}
                                </span>
                                {sub ? (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${sub.status === "graded" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>
                                    {sub.status.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded uppercase">
                                    PENDING
                                  </span>
                                )}
                              </div>
                              <h5 className="font-extrabold text-sm text-slate-950">{asg.title}</h5>
                              <p className="text-[11px] text-slate-500 font-medium">{asg.topic}</p>
                            </div>

                            <div className="shrink-0">
                              {sub ? (
                                <div className="text-right">
                                  <span className="text-[10px] font-semibold text-slate-500 block">Submitted: {sub.submittedAt}</span>
                                  <span className="text-[11px] font-bold text-slate-800 italic truncate block max-w-xs">{sub.fileName} ({sub.fileSize})</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSubmitAsgId(asg.id);
                                    setAttachmentName(`${user.name.replace(" ", "_")}_AssignmentDraft.pdf`);
                                    setSubmissionError(null);
                                    setIsSubmittedSuccess(false);
                                  }}
                                  className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-soft cursor-pointer transition-all flex items-center gap-1"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  Submit Solution
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submission Grades & Evaluations History Panel */}
                  <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-soft">
                    <h4 className="font-extrabold text-base text-slate-900">Your Grades & Evaluative Feedback</h4>
                    {submissions.filter(s => s.studentId === user.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No submissions made by you yet this term.</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.filter(s => s.studentId === user.id).map((sub) => {
                          const asg = course.assignments.find(a => a.id === sub.assignmentId);
                          return (
                            <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-soft">
                              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                <div>
                                  <h5 className="font-bold text-xs text-slate-900">{asg?.title || "Syllabus Project"}</h5>
                                  <p className="text-[10px] text-slate-400 font-medium">Submitted file: {sub.fileName} • {sub.submittedAt}</p>
                                </div>
                                <div className="text-right">
                                  {sub.status === "graded" ? (
                                    <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg px-3 py-1 font-mono font-extrabold text-center">
                                      <span className="text-[9px] block text-emerald-700 leading-none uppercase">Grade</span>
                                      <span className="text-base leading-tight">{sub.grade}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] bg-sky-50 text-sky-850 px-2 py-1 rounded font-bold">Evaluation Pending</span>
                                  )}
                                </div>
                              </div>
                              {sub.status === "graded" && sub.feedback && (
                                <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100">
                                  <p className="text-[9px] uppercase font-bold text-emerald-800 tracking-wide flex items-center gap-1 mb-1">
                                    <Award className="w-3.5 h-3.5" />
                                    Instructor Comments:
                                  </p>
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                                    "{sub.feedback}"
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Teach Dashboard Evaluation View */
                <div className="space-y-6">
                  {/* Instructor Evaluate overlay form inline */}
                  {gradingSubmissionId && (
                    <div className="bg-emerald-50/40 border border-emerald-200 p-6 rounded-xl space-y-4 shadow-soft">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider">Evaluation Hub</span>
                          <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                            Evaluating Submission of {submissions.find(s => s.id === gradingSubmissionId)?.studentName}
                          </h4>
                          <p className="text-[10px] text-slate-500">File: {submissions.find(s => s.id === gradingSubmissionId)?.fileName}</p>
                        </div>
                        <button
                          onClick={() => setGradingSubmissionId(null)}
                          className="text-xs text-slate-400 hover:text-slate-800 font-medium cursor-pointer"
                        >
                          Dismiss Form
                        </button>
                      </div>

                      <form onSubmit={handleGradeSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Assign Grade</label>
                            <input
                              type="text"
                              required
                              value={givenGrade}
                              onChange={(e) => setGivenGrade(e.target.value)}
                              placeholder="e.g. A, B+, 95/100"
                              className="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-900 font-bold outline-none focus:ring-1 focus:ring-blue-900"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Evaluative Feedback / Improvement Points</label>
                            <input
                              type="text"
                              value={givenFeedback}
                              onChange={(e) => setGivenFeedback(e.target.value)}
                              placeholder="Great research, check standard deviation formatting on module 2 statistics..."
                              className="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-blue-900"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={grading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-soft cursor-pointer transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {grading ? "Submitting Grade..." : "Lock Grade & Notify Student"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Teacher View Course Submissions List */}
                  <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-soft">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-950">Active Students Tasks Submissions</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Verify submissions, review attachment archives, and write numeric/letter grades</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold">
                        {submissions.length} Total Submissions
                      </span>
                    </div>

                    {submissions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">No Student has submitted solutions for assignments in Modern Psychology yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((sub) => {
                          const asg = course.assignments.find(a => a.id === sub.assignmentId);
                          return (
                            <div 
                              key={sub.id} 
                              className={`p-4 rounded-xl border transition-all ${
                                sub.status === "graded" 
                                  ? "border-slate-200 bg-white" 
                                  : "border-amber-200 bg-amber-50/10 shadow-soft"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
                                <div>
                                  <div className="flex gap-2 items-center">
                                    <span className="text-xs font-bold text-slate-900">{sub.studentName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({sub.studentEmail})</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    Submission: <span className="font-bold text-slate-700">{asg?.title || "Syllabus Project"}</span> • {sub.submittedAt}
                                  </p>
                                </div>
                                <div>
                                  {sub.status === "graded" ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-bold">Graded: {sub.grade}</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setGradingSubmissionId(sub.id);
                                        setGivenGrade("");
                                        setGivenFeedback("");
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-soft flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Award className="w-3.5 h-3.5" />
                                      Grade Now
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 font-normal border border-slate-100 mb-2 whitespace-pre-wrap">
                                <p className="text-[9px] uppercase font-mono font-bold text-slate-400 mb-1.5">Submitted Notes / Solution Draft Content:</p>
                                {sub.content || "[No notes written. Standard file was submitted.]"}
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                Attached Archive: <span className="font-bold text-blue-900 underline cursor-pointer hover:text-blue-950">{sub.fileName} ({sub.fileSize})</span>
                              </div>

                              {sub.status === "graded" && sub.feedback && (
                                <div className="mt-2.5 text-[10px] text-slate-500 bg-slate-50/50 p-2 border border-slate-100 rounded-lg">
                                  <span className="font-bold text-slate-700 block">Feedback left:</span>
                                  <span className="italic">"{sub.feedback}"</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discussion Forum Tab */}
          {activeTab === "forum" && (
            <div className="space-y-6">
              {expandedPostId ? (
                /* Thread view with Replies */
                (() => {
                  const post = forumPosts.find(p => p.id === expandedPostId);
                  if (!post) {
                    setExpandedPostId(null);
                    return null;
                  }
                  return (
                    <div className="space-y-4">
                      {/* Back handle */}
                      <button
                        onClick={() => setExpandedPostId(null)}
                        className="text-xs text-blue-900 hover:text-blue-950 font-bold flex items-center gap-1 pb-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Discuss Board
                      </button>

                      {/* Main Post Card */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2 items-center">
                            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold flex items-center justify-center uppercase">
                              {post.authorName.substring(0, 2)}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{post.authorName}</p>
                              <p className="text-[9px] text-indigo-700 uppercase font-mono tracking-wider leading-none">
                                {post.authorRole === "teacher" ? "Faculty Representative" : "Course Student"}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">{post.createdAt}</span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{post.title}</h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2 whitespace-pre-wrap">
                            {post.content}
                          </p>
                        </div>
                      </div>

                      {/* Replies header */}
                      <div className="pt-2">
                        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest block mb-3">
                          Replies ({post.replies.length})
                        </h4>

                        {post.replies.length === 0 ? (
                          <div className="p-6 bg-white border border-slate-200 border-dashed rounded-xl text-center text-slate-400 text-xs italic">
                            No answers posted yet. Solve or post suggestions below.
                          </div>
                        ) : (
                          <div className="space-y-3 pl-4 md:pl-8 border-l-2 border-slate-100">
                            {post.replies.map((rep) => (
                              <div key={rep.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-soft space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex gap-2 items-center">
                                    <span className={`w-6 h-6 rounded-full text-[9px] font-bold flex items-center justify-center uppercase ${rep.authorRole === "teacher" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-900"}`}>
                                      {rep.authorName.substring(0, 2)}
                                    </span>
                                    <div>
                                      <p className="text-xs font-semibold text-slate-800">{rep.authorName}</p>
                                      <p className="text-[8px] text-slate-400 font-mono tracking-wider font-bold">
                                        {rep.authorRole === "teacher" ? "FACULTY REPRESENTATIVE" : "STUDENT"}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-mono">{rep.createdAt}</span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium pl-8 leading-relaxed whitespace-pre-wrap">
                                  {rep.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Submit Reply Form Card */}
                      <form onSubmit={handleCreateReply} className="bg-white border border-slate-200 p-4 rounded-xl shadow-soft space-y-3.5">
                        <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Leave a Helpful Response</h5>
                        <textarea
                          required
                          value={newReplyContent}
                          onChange={(e) => setNewReplyContent(e.target.value)}
                          placeholder="Provide supportive solutions, list citation standards, or add notes for clarification..."
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-1 focus:ring-blue-900 font-normal custom-scrollbar"
                        />
                        <button
                          type="submit"
                          disabled={replyingForum || !newReplyContent.trim()}
                          className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-soft text-left"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {replyingForum ? "Sending Answer..." : "Publish Answer"}
                        </button>
                      </form>
                    </div>
                  );
                })()
              ) : (
                /* Thread list main view */
                <div className="space-y-6">
                  {/* Create post toggle segment collapsing card */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-soft space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-blue-900" />
                      Start a New Discussion Thread
                    </h4>

                    <form onSubmit={handleCreatePost} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Question / Study Topic</label>
                        <input
                          type="text"
                          required
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          placeholder="e.g. Clarification regarding exponential decay quotient formulas?"
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-850 outline-none focus:ring-1 focus:ring-blue-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Details Context</label>
                        <textarea
                          required
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="Explain what study modules or text drafts you are confused about or want feedback on from class colleagues..."
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-850 outline-none focus:ring-1 focus:ring-blue-900 font-normal custom-scrollbar"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={postingForum}
                        className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-soft cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {postingForum ? "Posting thread..." : "Post Study Topic Thread"}
                      </button>
                    </form>
                  </div>

                  {/* Forum Threads database block */}
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-soft space-y-4">
                    <h4 className="font-extrabold text-base text-slate-900 uppercase tracking-widest text-xs">University Discussion Forum Board</h4>
                    {forumPosts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">No threads posted yet. Be the first to start a cooperative learning debate!</p>
                    ) : (
                      <div className="space-y-4">
                        {forumPosts.map((post) => (
                          <div 
                            key={post.id}
                            onClick={() => setExpandedPostId(post.id)}
                            className="p-4 rounded-xl border border-slate-100 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center"
                          >
                            <div className="space-y-1">
                              <div className="flex gap-2 items-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${post.authorRole === "teacher" ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-blue-900"}`}>
                                  {post.authorRole === "teacher" ? "FACULTY" : "STUDENT"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{post.createdAt}</span>
                              </div>
                              <h5 className="font-extrabold text-sm text-slate-900 hover:text-blue-900 transition-colors">
                                {post.title}
                              </h5>
                              <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-lg mt-1">{post.content}</p>
                              <p className="text-[10px] text-slate-400 font-bold">Author: {post.authorName}</p>
                            </div>

                            <div className="shrink-0 bg-white border border-slate-200 text-slate-600 rounded-xl px-3.5 py-1.5 text-center shadow-soft">
                              <span className="text-sm font-extrabold block text-blue-900 leading-none">{post.replies.length}</span>
                              <span className="text-[9px] uppercase font-mono tracking-wider leading-none text-slate-400 select-none">Replies</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Course Specific AI Chat Sidebar (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-soft flex flex-col h-[calc(100vh-120px)] sticky top-20 overflow-hidden">
          
          {/* Assistant header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-900">
                <Bot className="w-4.5 h-4.5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1">
                  {selectedAgentId === "coach-socratic" ? "Socratic Mentor" :
                   selectedAgentId === "coach-stress" ? "Study Buddy & Vibe" :
                   selectedAgentId === "coach-critic" ? "Homework Draft Critic" :
                   selectedAgentId === "coach-visual" ? "Diagram Explainer" :
                   "EduNest AI Coach"}
                </h4>
                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">
                  {selectedAgentId === "coach-socratic" ? "socratic guide agent" :
                   selectedAgentId === "coach-stress" ? "energy & study flow" :
                   selectedAgentId === "coach-critic" ? "grading rubric expert" :
                   selectedAgentId === "coach-visual" ? "multimodal visual agent" :
                   "gemini flash assistant"}
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                setMessages([
                  {
                    id: "msg_init_reset",
                    sender: "ai",
                    text: `Hi ${user.name}! I have successfully refreshed my memory. Ask me anything about the downloadable materials or assignments for "${course.title}"!`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }
                ]);
              }}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Reset Chat History"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Horizontal Specialized Agent Ribbons */}
          <div className="bg-slate-100/60 p-2.5 border-b border-slate-200 shrink-0">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select Multi-Expert AI Coach (Free):</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 select-none custom-scrollbar-horizontal shrink-0">
              {[
                { id: "coach-general", title: "General Coach", icon: <Bot className="w-3.5 h-3.5" />, desc: "General curriculum help" },
                { id: "coach-socratic", title: "Socratic Mentor", icon: <HelpCircle className="w-3.5 h-3.5" />, desc: "Step-by-step guidance" },
                { id: "coach-stress", title: "Vibe Buddy", icon: <Timer className="w-3.5 h-3.5 animate-pulse text-amber-500" />, desc: "Motivate & break" },
                { id: "coach-critic", title: "Draft Critic", icon: <FileText className="w-3.5 h-3.5" />, desc: "Check essay/code" },
                { id: "coach-visual", title: "File Interpreter", icon: <ImageIcon className="w-3.5 h-3.5 text-blue-600" />, desc: "Dissect charts/math" },
              ].map((agent) => {
                const isActive = selectedAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleAgentChange(agent.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border shrink-0 transition-all ${
                      isActive 
                        ? "bg-blue-900 border-blue-900 text-white shadow-soft" 
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    title={agent.desc}
                  >
                    {agent.icon}
                    <span>{agent.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick topics recommendation pills */}
          <div className="p-3 bg-blue-50/50 border-b border-slate-100 text-center space-y-1.5 shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Recommended exam prep topics:</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => autoQuery(`Summarize the course syllabus and tell me key exam goals for ${course.title}.`)}
                className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-blue-100 hover:border-blue-900 font-semibold text-slate-700 transition"
              >
                Syllabus Summary
              </button>
              <button
                type="button"
                onClick={() => autoQuery(`Give me 3 practice quiz questions based on the ${course.title} curriculum.`)}
                className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-blue-100 hover:border-blue-900 font-semibold text-slate-700 transition"
              >
                Practice Questions
              </button>
              <button
                type="button"
                onClick={() => autoQuery(`How should I prepare for assignments related to "${course.assignments[0]?.title || "curriculum"}"?`)}
                className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-blue-100 hover:border-blue-900 font-semibold text-slate-700 transition"
              >
                Assignment Help
              </button>
            </div>
          </div>

          {/* Chat scrolling log lists */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isAi ? "items-start" : "items-end"} gap-1`}
                >
                  <div 
                    className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                      isAi 
                        ? "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-soft" 
                        : "bg-blue-900 text-white rounded-tr-none shadow-soft whitespace-pre-wrap"
                    }`}
                  >
                    {!isAi && msg.attachment && (
                      <div className="mb-2 p-2 rounded-lg bg-blue-950/40 border border-blue-800 flex items-center gap-2 max-w-sm text-left">
                        {msg.attachment.isImage && msg.attachment.dataUrl ? (
                          <div className="w-12 h-12 rounded bg-slate-900 overflow-hidden shrink-0 border border-blue-700">
                            <img src={msg.attachment.dataUrl} alt="Visual Attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-blue-900/60 flex items-center justify-center text-white shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-[10px] font-bold text-blue-100 truncate leading-none mb-1">{msg.attachment.name}</p>
                          <span className="text-[8px] font-mono text-blue-300 capitalize">{msg.attachment.type.split("/")[1] || "document"} • {msg.attachment.size}</span>
                        </div>
                      </div>
                    )}

                    {isAi ? (
                      <div className="space-y-1.5 break-words">
                        <Markdown
                          components={{
                            p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed font-normal">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-extrabold text-slate-900">{children}</strong>,
                            code: ({ children }) => <code className="bg-slate-100 text-red-650 px-1 py-0.5 rounded font-mono text-[10px] break-all">{children}</code>,
                            h3: ({ children }) => <h3 className="font-bold text-sm text-slate-950 mt-3 mb-1">{children}</h3>,
                            h4: ({ children }) => <h4 className="font-bold text-xs text-slate-900 mt-2 mb-1">{children}</h4>,
                            hr: () => <hr className="my-2.5 border-slate-200" />
                          }}
                        >
                          {msg.text}
                        </Markdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono tracking-wider px-1.5">
                    {msg.sender === "student" ? "You" : "Coach"} • {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {aiLoading && (
              <div className="flex items-center gap-1.5 p-3 bg-white text-slate-600 rounded-xl rounded-tl-none border border-slate-100 shadow-soft max-w-[80%] animate-pulse shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-900 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">AI Coach is thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Prompt Message bar with attachment tray */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white space-y-1.5 sticky bottom-0 shrink-0">
            {selectedAttachment && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  {selectedAttachment.isImage && selectedAttachment.dataUrl ? (
                    <div className="w-10 h-10 rounded border border-slate-300 overflow-hidden shrink-0 bg-slate-100">
                      <img src={selectedAttachment.dataUrl} alt="Thumbnail preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-700 truncate leading-none mb-1">{selectedAttachment.name}</p>
                    <p className="text-[8px] font-mono text-slate-400 leading-none">{selectedAttachment.type.split("/")[1] || "document"} • {selectedAttachment.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttachment(null)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-150 transition-colors"
                  title="Remove attachment"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
            )}

            <div className="relative flex items-center gap-2">
              {/* Invisible file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,.pdf,.docx,.txt,.json,.csv,.js,.ts" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-blue-900 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 transition shrink-0"
                title="Attach Syllabus Draft, Essay or Scanned Diagram File"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    selectedAgentId === "coach-socratic" ? "Type your doubt, ask a clue..." :
                    selectedAgentId === "coach-stress" ? "Feeling tired? Ask about schedule or break..." :
                    selectedAgentId === "coach-critic" ? "Paste outline draft/code here for review..." :
                    selectedAgentId === "coach-visual" ? "What diagram or photo do you want me to explain?" :
                    "Ask your AI Coach..."
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:ring-1 focus:ring-blue-900 outline-none placeholder-slate-400 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={aiLoading || (!inputText.trim() && !selectedAttachment)}
                  className="absolute right-2 p-1.5 text-blue-900 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 text-center font-medium leading-none">
              EduNest AI answers are contextualized with Nepalese curriculum criteria.
            </p>
          </form>

        </div>

      </div>

      {/* Corporate footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-8 px-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 EduNest Nepal Cooperative Inc. Kathmandu Campuses. All rights reserved.</p>
          <div className="flex gap-4">    
            <span>Support: helpdesk@kusoed.edu.np</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Submission, ForumPost, AppNotification, Course } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in the workspace secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Database State
const users = [
  {
    id: "usr_1",
    name: "Rohan Sharma",
    email: "aryankarna_btechedit2024@kusoed.edu.np",
    password: "password123",
    role: "student" as const,
  },
  {
    id: "usr_2",
    name: "Prof. Elena Vance",
    email: "prof.vance@kusoed.edu.np",
    password: "password123",
    role: "teacher" as const,
  },
  {
    id: "usr_3",
    name: "Aashish Adhikari",
    email: "aashish@kusoed.edu.np",
    password: "password123",
    role: "student" as const,
  },
];

const courses: Course[] = [
  {
    id: "course_1",
    title: "Introduction to Modern Psychology",
    code: "PSY-101",
    description: "Overview of psychological science covering cognitive development, biological base of behavior, perception, social psychology, and clinical approaches modeled around contemporary research and Nepalese societal contexts.",
    instructorName: "Prof. Elena Vance",
    department: "Social Sciences",
    duration: "12 Weeks",
    level: "Intermediate",
    studentCount: 2,
    enrolledStudents: ["usr_1", "usr_3"],
    semester: "Autumn 2026",
    materials: [
      {
        id: "mat_1_1",
        title: "Syllabus_Fall2024.pdf",
        type: "pdf" as const,
        url: "#",
        size: "2.4 MB",
        updatedDate: "Oct 12",
      },
      {
        id: "mat_1_2",
        title: "Lecture_Notes_Mod1.docx",
        type: "docx" as const,
        url: "#",
        size: "1.1 MB",
        updatedDate: "Oct 15",
      },
      {
        id: "mat_1_3",
        title: "Supplementary_Readings_Nepal_Context.zip",
        type: "link" as const,
        url: "https://example.edu.np/psychology/nepal_supplements",
        size: "15.8 MB",
        updatedDate: "Oct 20",
      }
    ],
    assignments: [
      {
        id: "asg_1_1",
        title: "Mathematics and Psychology Connection Journal",
        topic: "Connecting cognitive models to mathematical functions.",
        dueDate: "Tomorrow",
        status: "pending" as const,
      },
      {
        id: "asg_1_2",
        title: "Research Essay: Mental Health Stigma in Nepal",
        topic: "Exploring psychological perspectives and cultural patterns in local contexts.",
        dueDate: "Oct 28, 2026",
        status: "pending" as const,
      }
    ],
  },
  {
    id: "course_2",
    title: "Introduction to IT",
    code: "COMP-101",
    description: "Fundamental concepts of Information Technology, computing infrastructures, database structures, client-server models, networking fundamentals, and computer hardware architectures.",
    instructorName: "Dr. Emily Watson",
    department: "Computer Science & Engineering",
    duration: "14 Weeks",
    level: "Basic",
    studentCount: 1,
    enrolledStudents: ["usr_1"],
    semester: "Autumn 2026",
    materials: [
      {
        id: "mat_2_1",
        title: "IT101_Course_Guide.pdf",
        type: "pdf" as const,
        url: "#",
        size: "4.2 MB",
        updatedDate: "Oct 05",
      },
      {
        id: "mat_2_2",
        title: "Lab_4_Networking_Manual.pdf",
        type: "pdf" as const,
        url: "#",
        size: "2.1 MB",
        updatedDate: "Oct 18",
      }
    ],
    assignments: [
      {
        id: "asg_2_1",
        title: "Python Scripting Fundamentals Lab",
        topic: "Basic syntax, loops, and conditional statements in Python.",
        dueDate: "Oct 24, 2026",
        status: "pending" as const,
      }
    ],
  },
  {
    id: "course_3",
    title: "Advanced Engineering Mathematics",
    code: "MATH-201",
    description: "Comprehensive analytical frameworks containing linear algebra, integration & derivatives, Laplace transfroms, and differential equations applicable to engineering and technical modeling.",
    instructorName: "Prof. Alan Turing",
    department: "Mathematics",
    duration: "16 Weeks",
    level: "Advanced",
    studentCount: 1,
    enrolledStudents: ["usr_1"],
    semester: "Autumn 2026",
    materials: [
      {
        id: "mat_3_1",
        title: "Advanced_Calculus_Syllabus.pdf",
        type: "pdf" as const,
        url: "#",
        size: "1.8 MB",
        updatedDate: "Oct 01",
      },
      {
        id: "mat_3_2",
        title: "Linear_Algebra_Overview_Notes.pdf",
        type: "pdf" as const,
        url: "#",
        size: "3.5 MB",
        updatedDate: "Oct 10",
      }
    ],
    assignments: [
      {
        id: "asg_3_1",
        title: "Mathematics Problem Set 5",
        topic: "Integration, derivatives, and multidimensional calculus.",
        dueDate: "Tomorrow",
        status: "pending" as const,
      }
    ],
  },
  {
    id: "course_4",
    title: "Basic Calculus & Differential Equations",
    code: "MATH-101",
    description: "Fundamental math concepts, differentials, single-variable optimization, limit theories, integrals, and system series applicable for scientific research.",
    instructorName: "Dr. Shankar Dev",
    department: "Mathematics",
    duration: "14 Weeks",
    level: "Basic",
    studentCount: 2,
    enrolledStudents: ["usr_1", "usr_3"],
    semester: "Autumn 2025",
    materials: [
      {
        id: "mat_4_1",
        title: "Syllabus_Math101_Archived.pdf",
        type: "pdf" as const,
        url: "#",
        size: "3.1 MB",
        updatedDate: "Sep 2025",
      },
      {
        id: "mat_4_2",
        title: "Limits_and_Integrals_CheatSheet.pdf",
        type: "pdf" as const,
        url: "#",
        size: "1.5 MB",
        updatedDate: "Nov 2025",
      }
    ],
    assignments: [],
  },
  {
    id: "course_5",
    title: "Programming Fundamentals with C",
    code: "COMP-102",
    description: "Procedural language foundations utilizing C. Memory management, pointers, array elements, and basic diagnostic debugging techniques.",
    instructorName: "Prof. Alan Turing",
    department: "Computer Science & Engineering",
    duration: "16 Weeks",
    level: "Basic",
    studentCount: 2,
    enrolledStudents: ["usr_1", "usr_3"],
    semester: "Autumn 2025",
    materials: [
      {
        id: "mat_5_1",
        title: "C_Language_Structures.pdf",
        type: "pdf" as const,
        url: "#",
        size: "1.9 MB",
        updatedDate: "Aug 2025",
      }
    ],
    assignments: [],
  },
  {
    id: "course_6",
    title: "Communication Skills & Academic Writing",
    code: "ENG-101",
    description: "Technical correspondence, report construction, peer reviews, citation structures, and language polishing in advanced academic writing.",
    instructorName: "Prof. Elena Vance",
    department: "Humanities",
    duration: "12 Weeks",
    level: "Basic",
    studentCount: 2,
    enrolledStudents: ["usr_1", "usr_3"],
    semester: "Spring 2026",
    materials: [
      {
        id: "mat_6_1",
        title: "ENG101_Syllabus.pdf",
        type: "pdf" as const,
        url: "#",
        size: "1.2 MB",
        updatedDate: "Feb 2026",
      }
    ],
    assignments: [],
  }
];

// Activity log tracking
const activityLog = [
  {
    id: "act_1",
    studentId: "usr_1",
    text: "Watched 'Linear Algebra Overview'",
    subject: "Advanced Engineering Mathematics",
    timeAgo: "2 hours ago"
  },
  {
    id: "act_2",
    studentId: "usr_1",
    text: "Downloaded 'Lab_4_Networking_Manual.pdf'",
    subject: "Introduction to IT",
    timeAgo: "Yesterday"
  },
  {
    id: "act_3",
    studentId: "usr_1",
    text: "Completed Quiz: Binary Systems",
    subject: "Introduction to IT",
    timeAgo: "2 days ago"
  }
];

// Rich In-Memory Stores for Submissions, Forums, and Notifications
const submissions: Submission[] = [
  {
    id: "sub_1",
    assignmentId: "asg_1_1",
    courseId: "course_1",
    studentId: "usr_1",
    studentName: "Rohan Sharma",
    studentEmail: "aryankarna_btechedit2024@kusoed.edu.np",
    fileName: "Rohan_Sharma_CognitiveMath_Journal.pdf",
    fileType: "pdf",
    fileSize: "1.4 MB",
    content: "This paper models cognitive retention rates using exponential decay functions with adjustment quotients based on environmental stimulus in Kathmandu university campuses...",
    submittedAt: "Oct 24, 2026",
    status: "graded" as const,
    grade: "A",
    feedback: "Excellent interdisciplinary connections, Rohan! Your decay models are very well formulated."
  },
  {
    id: "sub_2",
    assignmentId: "asg_1_2",
    courseId: "course_1",
    studentId: "usr_3",
    studentName: "Aashish Adhikari",
    studentEmail: "aashish@kusoed.edu.np",
    fileName: "Nepal_Mental_Health_Stigma_Review.docx",
    fileType: "docx",
    fileSize: "850 KB",
    content: "An extensive review of sociological factors and access barriers to therapy in rural Nepal, analyzing regional community mental health campaigns run by NGOs.",
    submittedAt: "Oct 25, 2026",
    status: "submitted" as const,
  }
];

const forumPosts: ForumPost[] = [
  {
    id: "forum_1",
    courseId: "course_1",
    authorId: "usr_1",
    authorName: "Rohan Sharma",
    authorRole: "student" as const,
    title: "Relevance of Piagetian stages in Nepalese rural development?",
    content: "In our lecture on cognitive development, we discussed Piaget's developmental stages. I was wondering how cultural factors in outer districts of Nepal affect these benchmarks, or if there are local studies on this at TU/KU?",
    createdAt: "Oct 22, 2026, 11:30 AM",
    replies: [
      {
        id: "rep_1",
        authorId: "usr_2",
        authorName: "Prof. Elena Vance",
        authorRole: "teacher" as const,
        content: "Excellent questioning, Rohan! Indeed, Vygotsky's socio-cultural approach often fits better when investigating developmental trajectories in diverse, communal Nepalese villages. I can upload a PDF supplement on cross-cultural cognitive testing tomorrow.",
        createdAt: "Oct 22, 2026, 2:15 PM"
      }
    ]
  },
  {
    id: "forum_2",
    courseId: "course_2",
    authorId: "usr_1",
    authorName: "Rohan Sharma",
    authorRole: "student" as const,
    title: "Need help configuring local loopback in Cisco Packet Tracer",
    content: "I am trying to simulate Lab 4 networking manual on my own but the packets keep dropping. Anyone else facing this or have a fix?",
    createdAt: "Oct 24, 2026, 09:00 AM",
    replies: []
  }
];

const notifications: AppNotification[] = [
  {
    id: "notif_1",
    userId: "usr_1",
    role: "student" as const,
    title: "New Study Material",
    description: "Prof. Elena Vance uploaded 'Supplementary_Readings_Nepal_Context.zip' to Introduction to Modern Psychology.",
    type: "material" as const,
    courseId: "course_1",
    courseCode: "PSY-101",
    courseTitle: "Introduction to Modern Psychology",
    createdAt: "Just now",
    read: false
  },
  {
    id: "notif_2",
    userId: "usr_1",
    role: "student" as const,
    title: "Upcoming Assignment Due",
    description: "Mathematics and Psychology Connection Journal is due tomorrow.",
    type: "assignment" as const,
    courseId: "course_1",
    courseCode: "PSY-101",
    courseTitle: "Introduction to Modern Psychology",
    createdAt: "2 hours ago",
    read: false
  },
  {
    id: "notif_3",
    userId: "usr_2",
    role: "teacher" as const,
    title: "New Assignment Submission",
    description: "Aashish Adhikari submitted 'Nepal_Mental_Health_Stigma_Review.docx' for Research Essay: Mental Health Stigma in Nepal.",
    type: "submission" as const,
    courseId: "course_1",
    courseCode: "PSY-101",
    courseTitle: "Introduction to Modern Psychology",
    createdAt: "1 hour ago",
    read: false
  }
];

// API ROUTING

// 1. Authentication Endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // Return non-secret user data
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "User already registered with this email address." });
  }

  const newUser = {
    id: "usr_" + (users.length + 1),
    name,
    email,
    password,
    role: role as "student" | "teacher",
  };

  users.push(newUser);

  return res.json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  });
});

// 2. Fetch all courses
app.get("/api/courses", (req, res) => {
  return res.json(courses);
});

// 3. Create a new course (Teacher action)
app.post("/api/courses", (req, res) => {
  const { title, code, description, instructorName, department, duration, level, semester } = req.body;

  if (!title || !code || !description) {
    return res.status(400).json({ error: "Title, Code, and Description are required." });
  }

  const newCourse = {
    id: "course_" + (courses.length + 1),
    title,
    code,
    description,
    instructorName: instructorName || "Unknown Professor",
    department: department || "General Studies",
    duration: duration || "12 Weeks",
    level: level || "Intermediate",
    studentCount: 0,
    enrolledStudents: [] as string[],
    materials: [] as any[],
    assignments: [] as any[],
    semester: semester || "Autumn 2026",
  };

  courses.push(newCourse);
  return res.json(newCourse);
});

// 4. Enroll student into a course
app.post("/api/courses/:id/enroll", (req, res) => {
  const { id } = req.params;
  const { studentEmail } = req.body;

  const course = courses.find((c) => c.id === id);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  const user = users.find((u) => u.email.toLowerCase() === studentEmail.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: `Student with email '${studentEmail}' not found on EduNest.` });
  }

  if (course.enrolledStudents.includes(user.id)) {
    return res.status(400).json({ error: "Student is already enrolled in this course." });
  }

  course.enrolledStudents.push(user.id);
  course.studentCount = course.enrolledStudents.length;

  return res.json({ success: true, course });
});

// 5. Upload/add study materials to a course (Teacher action)
app.post("/api/courses/:id/materials", (req, res) => {
  const { id } = req.params;
  const { title, type, url, size } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: "Title and type are required." });
  }

  const course = courses.find((c) => c.id === id);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  const newMaterial = {
    id: "mat_" + course.id.split("_")[1] + "_" + (course.materials.length + 1),
    title,
    type: type as "pdf" | "docx" | "link",
    url: url || "#",
    size: size || "1.5 MB",
    updatedDate: "Today",
  };

  course.materials.push(newMaterial);

  // Notify enrolled students of new study materials
  course.enrolledStudents.forEach((stId) => {
    notifications.unshift({
      id: "notif_" + (notifications.length + 1),
      userId: stId,
      role: "student" as const,
      title: "New Study Material Uploaded",
      description: `${course.instructorName} added '${title}' to '${course.title}'.`,
      type: "material" as const,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      createdAt: "Just now",
      read: false
    });
  });

  return res.json(newMaterial);
});

// 6. Add assignments to a course (Teacher action)
app.post("/api/courses/:id/assignments", (req, res) => {
  const { id } = req.params;
  const { title, topic, dueDate } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ error: "Title and Due Date are required." });
  }

  const course = courses.find((c) => c.id === id);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  const newAssignment = {
    id: "asg_" + course.id.split("_")[1] + "_" + (course.assignments.length + 1),
    title,
    topic: topic || "Course Assignment",
    dueDate,
    status: "pending" as const,
  };

  course.assignments.push(newAssignment);

  // Notify enrolled students of new upcoming assignments
  course.enrolledStudents.forEach((stId) => {
    notifications.unshift({
      id: "notif_" + (notifications.length + 1),
      userId: stId,
      role: "student" as const,
      title: "New Course Assignment",
      description: `'${title}' is now assigned. Due by ${dueDate}.`,
      type: "assignment" as const,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      createdAt: "Just now",
      read: false
    });
  });

  return res.json(newAssignment);
});

// 7. Dynamic course-specific activity feed representation
app.get("/api/activities", (req, res) => {
  return res.json(activityLog);
});

app.post("/api/activities", (req, res) => {
  const { studentId, text, subject } = req.body;
  if (!studentId || !text || !subject) {
    return res.status(400).json({ error: "studentId, text, and subject required" });
  }

  const newActivity = {
    id: "act_" + (activityLog.length + 1),
    studentId,
    text,
    subject,
    timeAgo: "Just now"
  };

  activityLog.unshift(newActivity);
  return res.json(newActivity);
});

// 8. Gemini AI Course Chat Assistant (Most important feature!)
app.post("/api/courses/:id/ai-chat", async (req, res) => {
  const { id } = req.params;
  const { prompt, chatHistory, studentName, agentId, attachment } = req.body;

  const course = courses.find((c) => c.id === id);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Question prompt cannot be empty." });
  }

  // Determine Agent Details
  let agentInstDetail = "";
  let agentTitleName = "EduNest Intelligent Coach";

  if (agentId === "coach-socratic") {
    agentTitleName = "Socratic Mental Mentor";
    agentInstDetail = `You are "Socratic Mental Mentor", a specialized tutor who NEVER directly gives answers to the student. 
Instead, your primary purpose is:
- Guide the student step-by-step through critical questioning.
- Ask helpful analytical prompts, use analogical examples, and help them unlock the answers through their own logic.
- Actively probe: "What do you think is the first step?", "If we look at variable X, how does that relate to component Y?", "Let's explore what happens when we modify this condition."
- Be supportive but challenging, pushing them to think deeply. Always end your message with an engaging, leading question.`;
  } else if (agentId === "coach-stress") {
    agentTitleName = "Study Buddy & Vibe Coach";
    agentInstDetail = `You are "Study Buddy & Vibe Coach", focused on student well-being, mood boosters, fatigue levels, and structured study schedules.
Your main responsibilities are:
- Provide high-yield productivity hacks (e.g., dynamic 25-minute Pomodoro study-break rhythms customized for student university life).
- Give incredibly warm study support, cheerleading, motivational check-ins, and emotional reassurance when exams or coursework feel overwhelming.
- Help them design positive routines and remind them to keep hydrated and take rest breaks. Use warm, positive psychological reinforcement.`;
  } else if (agentId === "coach-critic") {
    agentTitleName = "Homework Draft Critic";
    agentInstDetail = `You are "Homework Draft Critic", an expert academic proofreader, code auditor, and assignment evaluator.
Your objective:
- Read student outlines, draft paragraphs, study answers, or file attachments closely.
- Offer rigorous, constructive feedback based on clarity, structure, paragraph coherence, flow, and scholarly precision.
- Point out specific sentences that can be sharpened, structural weaknesses, or logical issues. Keep feedback highly constructive, positive, encouraging, but academically precise.`;
  } else if (agentId === "coach-visual") {
    agentTitleName = "Diagram & File Explainer";
    agentInstDetail = `You are "Diagram & File Explainer", a genius multimodal visual analyzer and file translator.
Your focus:
- Look closely at any files, screenshots, diagrams, flowcharts, or handwritten notes that the user submits.
- Formulate a clear, structured breakdown, explanation of key visual nodes, trace formulas, or interpret code block patterns.
- Walk them step-by-step through the concepts illustrated in the uploaded material, helping them bridge abstract curriculum theories with visual artifacts. If no image or file is attached yet, kindly ask them to upload or draft one so you can dissect it.`;
  } else {
    // default course-coach
    agentTitleName = "EduNest Course Coach";
    agentInstDetail = `You are "EduNest Course Coach", an incredibly friendly, empathetic, and highly conversational general AI curriculum guide.
Your objective is to:
- Act as a general academic mentor and advisor for the course material.
- Help summarize readings, answer questions, generate sample study lists, and coordinate prep strategies.
- Maintain a highly conversational, upbeat, and accessible persona.`;
  }

  // Notify Teacher about student query
  const studentDisplayName = studentName || "A student";
  const agentLabel = agentTitleName;
  notifications.unshift({
    id: "notif_" + (notifications.length + 1),
    userId: "usr_2", // Elena Vance
    role: "teacher" as const,
    title: `AI Assistant Chat (${agentLabel})`,
    description: `${studentDisplayName} consulted "${agentLabel}": "${prompt.length > 45 ? prompt.substring(0, 42) + "..." : prompt}"`,
    type: "forum" as const,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    createdAt: "Just now",
    read: false
  });

  // Construct rigorous learning material context
  const materialsListText = course.materials.map(m => `- ${m.title} (${m.type})`).join("\n");
  const assignmentsText = course.assignments.map(a => `- ${a.title} (Due: ${a.dueDate})`).join("\n");

  const systemInstruction = `You are ${agentTitleName}, an incredibly friendly, empathetic, and conversational AI companion.
You are chatting with a university student in Nepal in real-time about their course: "${course.title}" (${course.code}).
The course instructor is ${course.instructorName} (${course.department}).

${agentInstDetail}

General Interaction Guidelines:
1. Speak like a supportive human tutor and study companion: avoid sounding like a rigid, robotic textbook! Use warm transition phrases.
2. Connect with them personally. Keep your answers focused, direct, and conversational. Break up long, dense paragraphs into brief, easy-to-read segments.
3. Keep answers interactive: ask them a short, helpful follow-up question related to your persona.
4. Render beautiful markdown: use lists, bold highlights, spacing, tables, or code formatting, but never output giant intimidating walls of text.
5. Ground concepts in Nepalese higher education context if relevant, but stay centered deeply on assisting them with this specific course syllabus:
- Syllabus Context: ${course.description}
- Duration and Level: ${course.duration} (${course.level})

Downloadable Materials available in this classroom:
${materialsListText || "No download files registered yet."}

Syllabus Assignments context:
${assignmentsText || "No assignments published yet."}

Have a friendly, helpful, and smooth tutoring session!`;

  try {
    const ai = getGeminiClient();

    // Compile contents array from chatHistory
    let formattedContents: any = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        formattedContents.push({
          role: msg.sender === "student" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });

      // Handle attachment in the current user prompt
      if (attachment && attachment.dataUrl && (attachment.isImage || (attachment.type && attachment.type.startsWith("image/")))) {
        let base64Data = attachment.dataUrl;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop() || "";
        }
        formattedContents.push({
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: attachment.type || "image/png",
                data: base64Data
              }
            },
            { text: `${prompt}\n\n[USER ACTION: Student attached a photo image: "${attachment.name}"]` }
          ]
        });
      } else if (attachment && attachment.dataUrl) {
        let fileContentDecoded = "";
        try {
          let base64Data = attachment.dataUrl;
          if (base64Data.includes(";base64,")) {
            base64Data = base64Data.split(";base64,").pop() || "";
          }
          fileContentDecoded = Buffer.from(base64Data, "base64").toString("utf-8");
          // truncate if too long
          if (fileContentDecoded.length > 5000) {
            fileContentDecoded = fileContentDecoded.substring(0, 5000) + "\n...[File Truncated due to size]...";
          }
        } catch (e) {
          fileContentDecoded = "[Non-text attachment contents]";
        }
        formattedContents.push({
          role: "user",
          parts: [{ text: `${prompt}\n\n[USER ACTION: Student uploaded a document file "${attachment.name}" with contents]:\n\`\`\`\n${fileContentDecoded}\n\`\`\`` }]
        });
      } else {
        formattedContents.push({
          role: "user",
          parts: [{ text: prompt }]
        });
      }
    } else {
      // No history, build single contents payload
      if (attachment && attachment.dataUrl && (attachment.isImage || (attachment.type && attachment.type.startsWith("image/")))) {
        let base64Data = attachment.dataUrl;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop() || "";
        }
        formattedContents = {
          parts: [
            {
              inlineData: {
                mimeType: attachment.type || "image/png",
                data: base64Data
              }
            },
            { text: `${prompt}\n\n[USER ACTION: Student attached a photo image: "${attachment.name}"]` }
          ]
        };
      } else if (attachment && attachment.dataUrl) {
        let fileContentDecoded = "";
        try {
          let base64Data = attachment.dataUrl;
          if (base64Data.includes(";base64,")) {
            base64Data = base64Data.split(";base64,").pop() || "";
          }
          fileContentDecoded = Buffer.from(base64Data, "base64").toString("utf-8");
          if (fileContentDecoded.length > 5000) {
            fileContentDecoded = fileContentDecoded.substring(0, 5000) + "\n...[File Truncated]...";
          }
        } catch (e) {
          fileContentDecoded = "[Binary package stream]";
        }
        formattedContents = {
          parts: [{ text: `${prompt}\n\n[USER ACTION: Student uploaded material document file "${attachment.name}" with contents]:\n\`\`\`\n${fileContentDecoded}\n\`\`\`` }]
        };
      } else {
        formattedContents = prompt;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I was unable to formulate a response at this time.";
    return res.json({ response: replyText });

  } catch (error: any) {
    console.error("Gemini API Error:", error.message);

    // Dynamic high-fidelity offline fallback answers grounded in the chosen agent persona
    let attachmentNote = attachment ? `\n*(I noticed you attached a file named "${attachment.name}"! Since my live brains are running offline, I couldn't scan the bytes/pixels of the file directly, but I can estimate its relevance based on the course syllabus.)*` : "";

    let fallbackText = `**[${agentTitleName} - Local Mode]**
    
${attachmentNote}

Since the official \`GEMINI_API_KEY\` is not configured in the workspace settings, I am providing a localized, syllabus-grounded answer:

1. **Focus of your Coach (**${agentTitleName}**):** 
   - I am currently configured to assist with the target course **${course.title}** (${course.code}).
   - My analytical focus is dedicated to: ${agentId === "coach-socratic" ? "Guiding your technical logical reasoning step-by-step instead of dictating answers." : agentId === "coach-stress" ? "Balancing your mental stamina, recommending Pomodoros, and lifting study vibes." : agentId === "coach-critic" ? "Critically proofreading your outlines and code structure for elite grades." : agentId === "coach-visual" ? "Interpreting charts, layouts, diagrams, and scanned equations." : "Tackling general curriculum modules, summaries, and lecture notes."}

2. **Analyzing your query:** "${prompt}"
   - Make sure to review the downloadable files: ${course.materials.map(m => m.title).join(", ") || "syllabus manuals"}.
   - Double-check assignments due dates, specially: **${course.assignments[0]?.title || "any pending project"}**.

3. **Suggested Next Step:**
   Try breaking down your study session into 25-minute concentrated sprints, and draft your core formulas or notes. To activate full generative AI superpowers, simply drop your Gemini API key in **Settings > Secrets**.`;

    return res.json({ response: fallbackText });
  }
});


// 9. Submissions Endpoints
app.get("/api/courses/:courseId/submissions", (req, res) => {
  const { courseId } = req.params;
  const filtered = submissions.filter((s) => s.courseId === courseId);
  return res.json(filtered);
});

app.post("/api/courses/:courseId/submissions", (req, res) => {
  const { courseId } = req.params;
  const { assignmentId, studentId, studentName, studentEmail, fileName, fileType, fileSize, content } = req.body;
  
  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  // Create submission
  const submission = {
    id: "sub_" + (submissions.length + 1),
    assignmentId,
    courseId,
    studentId,
    studentName,
    studentEmail,
    fileName,
    fileType: fileType || "pdf",
    fileSize: fileSize || "1.2 MB",
    content: content || "",
    submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: "submitted" as const
  };
  submissions.push(submission);

  // Update original course assignment status to submitted for front-end fallback representation
  const task = course.assignments.find(a => a.id === assignmentId);
  if (task) {
    task.status = "submitted" as const;
  }

  // Notify Course Teacher
  const teacherNotif = {
    id: "notif_" + (notifications.length + 1),
    userId: "usr_2", // Seeded instructor
    role: "teacher" as const,
    title: "New Assignment Submission",
    description: `${studentName} submitted '${fileName}' for '${task?.title || "Assignment"}'`,
    type: "submission" as const,
    courseId,
    courseCode: course.code,
    courseTitle: course.title,
    createdAt: "Just now",
    read: false
  };
  notifications.unshift(teacherNotif);

  // Log activity
  const newActivity = {
    id: "act_" + (activityLog.length + 1),
    studentId,
    text: `Submitted assignment: ${fileName}`,
    subject: course.title,
    timeAgo: "Just now"
  };
  activityLog.unshift(newActivity);

  return res.json(submission);
});

app.post("/api/submissions/:id/grade", (req, res) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  const submission = submissions.find((s) => s.id === id);
  if (!submission) {
    return res.status(404).json({ error: "Submission not found" });
  }

  submission.status = "graded" as const;
  submission.grade = grade;
  submission.feedback = feedback || "";

  const course = courses.find((c) => c.id === submission.courseId);

  // Notify the Student
  const studNotif = {
    id: "notif_" + (notifications.length + 1),
    userId: submission.studentId,
    role: "student" as const,
    title: "Assignment Graded",
    description: `Your submission for Assignment is graded in ${course?.code || "Course"}. Grade: ${grade}.`,
    type: "assignment" as const,
    courseId: submission.courseId,
    courseCode: course ? course.code : "EDU-101",
    courseTitle: course ? course.title : "EduNest Course",
    createdAt: "Just now",
    read: false
  };
  notifications.unshift(studNotif);

  return res.json(submission);
});

// 10. Forum Endpoints
app.get("/api/courses/:courseId/forum", (req, res) => {
  const { courseId } = req.params;
  const filtered = forumPosts.filter((p) => p.courseId === courseId);
  return res.json(filtered);
});

app.post("/api/courses/:courseId/forum", (req, res) => {
  const { courseId } = req.params;
  const { authorId, authorName, authorRole, title, content } = req.body;

  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  const newPost = {
    id: "forum_" + (forumPosts.length + 1),
    courseId,
    authorId,
    authorName,
    authorRole: authorRole as "student" | "teacher",
    title,
    content,
    replies: [],
    createdAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };
  forumPosts.unshift(newPost);

  // Create notifications
  if (authorRole === "student") {
    // Notify teacher
    const teacherNotif = {
      id: "notif_" + (notifications.length + 1),
      userId: "usr_2", // Elena Vance
      role: "teacher" as const,
      title: "New Forum Question",
      description: `${authorName} asked: "${title}"`,
      type: "forum" as const,
      courseId,
      courseCode: course.code,
      courseTitle: course.title,
      createdAt: "Just now",
      read: false
    };
    notifications.unshift(teacherNotif);
  } else {
    // Notify all enrolled students
    course.enrolledStudents.forEach((stId) => {
      const studNotif = {
        id: "notif_" + (notifications.length + 1),
        userId: stId,
        role: "student" as const,
        title: "Instructor Announcement",
        description: `${authorName} posted: "${title}"`,
        type: "forum" as const,
        courseId,
        courseCode: course.code,
        courseTitle: course.title,
        createdAt: "Just now",
        read: false
      };
      notifications.unshift(studNotif);
    });
  }

  return res.json(newPost);
});

app.post("/api/forum/posts/:id/replies", (req, res) => {
  const { id } = req.params;
  const { authorId, authorName, authorRole, content } = req.body;

  const post = forumPosts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: "Forum post not found" });
  }

  const newReply = {
    id: "rep_" + (post.replies.length + 1),
    authorId,
    authorName,
    authorRole: authorRole as "student" | "teacher",
    content,
    createdAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };
  post.replies.push(newReply);

  // Notify original post author if someone else replies
  if (post.authorId !== authorId) {
    const course = courses.find((c) => c.id === post.courseId);
    const authorNotif = {
      id: "notif_" + (notifications.length + 1),
      userId: post.authorId,
      role: post.authorRole,
      title: "New Forum Reply",
      description: `${authorName} replied to your thread: "${post.title.substring(0, 30)}..."`,
      type: "forum" as const,
      courseId: post.courseId,
      courseCode: course ? course.code : "EDU-101",
      courseTitle: course ? course.title : "EduNest Course",
      createdAt: "Just now",
      read: false
    };
    notifications.unshift(authorNotif);
  }

  return res.json(post);
});

// 11. Notification Endpoints
app.get("/api/notifications", (req, res) => {
  const { userId, role } = req.query;
  let filtered = notifications;
  if (userId) {
    filtered = filtered.filter((n) => n.userId === userId || n.userId === "all");
  } else if (role) {
    filtered = filtered.filter((n) => n.userId === "all" || n.role === role);
  }
  return res.json(filtered);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    return res.json(notif);
  }
  return res.status(404).json({ error: "Notification not found" });
});

app.post("/api/notifications/mark-all-read", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  notifications.forEach((n) => {
    if (n.userId === userId || n.userId === "all") {
      n.read = true;
    }
  });
  return res.json({ success: true });
});

// Serving static build outputs or launching Vite development server middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduNest Express Server launched on http://localhost:${PORT}`);
  });
}

startServer();

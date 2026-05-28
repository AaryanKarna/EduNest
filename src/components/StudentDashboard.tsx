import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Sparkles, 
  PlayCircle, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Download,
  Info,
  History,
  LayoutGrid,
  List,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Course, User, Assignment } from "../types";
import { getCourses, getActivities, logActivity } from "../services/api";
import NotificationBell from "./NotificationBell";
import AcademicCalendar from "./AcademicCalendar";

interface StudentDashboardProps {
  user: User;
  onSelectCourse: (course: Course) => void;
  onSignOut: () => void;
  onSwitchPortal?: () => void;
}

export default function StudentDashboard({ user, onSelectCourse, onSignOut, onSwitchPortal }: StudentDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAsgId, setSubmittingAsgId] = useState<string | null>(null);
  
  // Track submitted assignments in local state to make the UI reactive
  const [submittedAsgIds, setSubmittedAsgIds] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("Autumn 2026");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "curriculum">("grid");
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const allCourses = await getCourses();
      // Filter course list to show courses the student is enrolled in
      const enrolled = allCourses.filter(c => c.enrolledStudents.includes(user.id));
      setCourses(enrolled);

      const logs = await getActivities();
      setActivities(logs.filter(log => log.studentId === user.id));
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (courseName: string, fileName: string) => {
    try {
      // Log the download activity on back-end
      await logActivity(user.id, `Downloaded "${fileName}"`, courseName);
      // Re-fetch activities to reflect
      const logs = await getActivities();
      setActivities(logs.filter(log => log.studentId === user.id));
      
      // Simulate file download
      alert(`Success: Starting download for ${fileName}. The action has been logged in recent activity folder.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsgSubmit = async (asgId: string, asgTitle: string, courseName: string) => {
    setSubmittingAsgId(asgId);
    try {
      // Simulate submission network lag
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Record activity
      await logActivity(user.id, `Submitted Assignment: "${asgTitle}"`, courseName);
      
      setSubmittedAsgIds(prev => [...prev, asgId]);
      
      // Re-fetch activities
      const logs = await getActivities();
      setActivities(logs.filter(log => log.studentId === user.id));
      
      alert(`Success: Your assignment "${asgTitle}" was submitted. Prof. Elena Vance has been notified.`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAsgId(null);
    }
  };

  // Semester courses filtering logic
  const filteredCourses = selectedSemester === "All Semesters"
    ? courses
    : courses.filter(c => c.semester === selectedSemester);

  // Compile all upcoming assignments from enrolled courses
  const allAssignments = filteredCourses.flatMap(course => 
    course.assignments.map(asg => ({
      ...asg,
      courseId: course.id,
      courseName: course.title,
    }))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar overlay */}
      <header className="bg-white border-b border-slate-200 shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button 
              type="button"
              onClick={() => {
                setSelectedSemester("Autumn 2026");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity text-left focus:outline-none"
              title="Reset Dashboard"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white">
                <GraduationCap className="w-5.5 h-5.5" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-blue-900">EduNest</span>
            </button>

            {/* Navigation links inside the header! */}
            <nav className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-6">
              <span className="text-[10px] uppercase tracking-wider bg-blue-50 text-blue-900 font-extrabold border border-blue-100 rounded-lg px-2.5 py-1">
                Student Console
              </span>
              {onSwitchPortal && (
                <button
                  type="button"
                  onClick={onSwitchPortal}
                  className="text-xs text-slate-505 hover:text-emerald-900 font-bold transition-all px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  title="Switch instantly to Faculty workspace"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Go to Teacher Portal
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch option on mobile viewports */}
            {onSwitchPortal && (
              <button
                type="button"
                onClick={onSwitchPortal}
                className="md:hidden text-[10px] uppercase font-bold text-emerald-850 px-2 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                title="Switch to Teacher console"
              >
                Teacher Portal ↩
              </button>
            )}

            <NotificationBell user={user} />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Student</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold uppercase text-xs">
              {user.name.substring(0, 2)}
            </div>
            <button
              onClick={onSignOut}
              className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors font-medium ml-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {/* Profile/Welcome Greeting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-8 border-b border-slate-200">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Namaste, {user.name}
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed font-normal">
              Welcome back to your curriculum console. Explore active course syllabus paths, review historical lecture document archives, and coordinate scheduled assignments.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            Loading your EduNest Workspace courses and assignments...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Content Area: Enrolled Courses */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Courses Grid */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
                        <BookOpen className="w-4.5 h-4.5 text-blue-900" />
                      </div>
                      <h2 className="font-display text-lg font-extrabold text-slate-900 leading-none">
                        Enrolled Syllabus Courses
                      </h2>
                    </div>
                    {/* View mode adjusters */}
                    <div className="flex items-center gap-1.5 mt-2 bg-slate-100 p-0.5 rounded-lg w-fit">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`p-1 px-2.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all focus:outline-none ${
                          viewMode === "grid" 
                            ? "bg-white text-blue-950 shadow-sm font-extrabold" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Display courses as standard Grid Cards"
                      >
                        <LayoutGrid className="w-3 h-3" />
                        Grid Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`p-1 px-2.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all focus:outline-none ${
                          viewMode === "list" 
                            ? "bg-white text-blue-950 shadow-sm font-extrabold" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Display compact linear row items"
                      >
                        <List className="w-3 h-3" />
                        Row Rows
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("curriculum")}
                        className={`p-1 px-2.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all focus:outline-none ${
                          viewMode === "curriculum" 
                            ? "bg-white text-blue-950 shadow-sm font-extrabold" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Display courses with direct files dossier"
                      >
                        <Layers className="w-3 h-3" />
                        Syllabus Dossier
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-250/50 self-start sm:self-center">
                    {["Autumn 2026", "Spring 2026", "Autumn 2025", "All Semesters"].map((sem) => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setSelectedSemester(sem)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          selectedSemester === sem
                            ? "bg-white text-slate-950 shadow-sm font-extrabold border border-slate-200/40"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {sem === "Autumn 2026" ? "Current" : sem === "All Semesters" ? "All" : sem}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedSemester !== "Autumn 2026" && selectedSemester !== "All Semesters" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: "auto" }}
                      exit={{ opacity: 0, scale: 0.98, height: 0 }}
                      className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 font-medium"
                    >
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 border-none" />
                      <div>
                        Browsing historical curriculum directories from <span className="font-bold underline">{selectedSemester}</span>. Showing archived syllabuses, grades, and back-paper records.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {filteredCourses.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm"
                  >
                    You have no courses registered for {selectedSemester}. Ask your faculty administrator to enroll you!
                  </motion.div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredCourses.map((course, idx) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, scale: 0.97, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.35, delay: idx * 0.05 }}
                          whileHover={{ y: -2 }}
                          className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft hover:shadow-premium transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] uppercase font-bold text-blue-950 bg-blue-105 border border-blue-200 px-2.5 py-1 rounded-md">
                                {course.code}
                              </span>
                              <span className="text-[10px] text-slate-400 font-extrabold font-mono flex items-center gap-1.5 uppercase">
                                {course.semester || "Autumn 2026"}
                              </span>
                            </div>
                            
                            <h3 className="font-display font-bold text-lg text-slate-950 mb-1 line-clamp-1">
                              {course.title}
                            </h3>
                            <p className="text-xs text-slate-500 mb-4 font-medium">
                              Instructor: {course.instructorName}
                            </p>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-medium">
                              {course.description}
                            </p>
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1">
                              <span>Syllabus Completion</span>
                              <span>{course.semester && course.semester !== "Autumn 2026" ? "100% Finalized" : "75% In Progress"}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-900 h-full rounded-full" style={{ width: course.semester && course.semester !== "Autumn 2026" ? "100%" : "75%" }} />
                            </div>

                            <button
                              onClick={() => onSelectCourse(course)}
                              className="w-full mt-2 bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 group cursor-pointer"
                            >
                              Enter Syllabus Workspace
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : viewMode === "list" ? (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {filteredCourses.map((course, idx) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, delay: idx * 0.03 }}
                          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <span className="text-[10px] font-bold font-mono tracking-wider text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md shrink-0 border border-blue-100">
                              {course.code}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-display font-extrabold text-sm text-slate-900 truncate leading-tight">
                                {course.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                                Instructing: {course.instructorName} • {course.semester || "Autumn 2026"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 w-full md:w-auto shrink-0 justify-between md:justify-end">
                            <div className="flex flex-col items-start md:items-end font-sans">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Completion Status</span>
                              <span className="text-[11px] text-blue-905 font-extrabold">{course.semester && course.semester !== "Autumn 2026" ? "100% Finalized" : "75% Progress"}</span>
                            </div>
                            
                            <button
                              onClick={() => onSelectCourse(course)}
                              className="bg-blue-50 hover:bg-blue-900 text-blue-900 hover:text-white font-bold text-[11px] py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 select-none"
                            >
                              Enter Syllabus
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filteredCourses.map((course, idx) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, scale: 0.99 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-soft"
                        >
                          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-blue-950 bg-blue-105 border border-blue-200 px-2 py-0.5 rounded mr-2">
                                {course.code}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-semibold">{course.semester || "Autumn 2026"}</span>
                              <h3 className="font-display font-extrabold text-base text-slate-950 mt-1 leading-snug">
                                {course.title}
                              </h3>
                              <p className="text-xs text-slate-500 font-semibold">Lead Instructor: {course.instructorName}</p>
                            </div>
                            <button
                              onClick={() => onSelectCourse(course)}
                              className="bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-[11px] py-2 px-3.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 select-none self-start sm:self-center shrink-0"
                            >
                              Enter Syllabus Workspace
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                            {/* Materials fast downloads panel */}
                            <div className="space-y-2">
                              <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                                Classroom Learning Resources
                              </h4>
                              <div className="space-y-1 max-h-[140px] overflow-y-auto">
                                {course.materials.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic py-1">No modular files or reference materials uploaded yet.</p>
                                ) : (
                                  course.materials.map(mat => (
                                    <div key={mat.title} className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs gap-2 hover:bg-slate-50">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <FileText className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                                        <span className="truncate font-semibold text-slate-700 text-[11px]" title={mat.title}>{mat.title}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDownload(course.title, mat.title)}
                                        className="text-blue-900 hover:text-blue-950 p-1 flex items-center justify-center cursor-pointer font-bold shrink-0 hover:scale-105"
                                        title={`Download ${mat.title}`}
                                      >
                                        <Download className="w-3.5 h-3.5 border-none" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Syllabus Assignments Tracker inline */}
                            <div className="space-y-2">
                              <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                                Assignments Deadlines Tracker
                              </h4>
                              <div className="space-y-1 max-h-[140px] overflow-y-auto">
                                {course.assignments.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic py-1">No classroom homework files scheduled this term.</p>
                                ) : (
                                  course.assignments.map(asg => {
                                    const isSubmitted = submittedAsgIds.includes(asg.id);
                                    return (
                                      <div key={asg.id} className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs gap-2">
                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-705 text-[11px] truncate leading-tight" title={asg.title}>{asg.title}</p>
                                          <p className="text-[9px] text-slate-400 font-medium font-mono">Limit: {asg.dueDate}</p>
                                        </div>
                                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md uppercase font-mono tracking-tight shrink-0 flex items-center gap-1 ${
                                          isSubmitted 
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                            : asg.dueDate === "Tomorrow" 
                                              ? "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse" 
                                              : "bg-blue-50 text-blue-800 border border-blue-100"
                                        }`}>
                                          {isSubmitted ? "✅ Received" : "❌ Pending"}
                                        </span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Academic Calendar Scheduler */}
              <div className="space-y-4">
                <AcademicCalendar
                  courses={courses}
                  submittedAsgIds={submittedAsgIds}
                  onSubmitAssignment={(asgId, asgTitle, courseName) => handleAsgSubmit(asgId, asgTitle, courseName)}
                  submittingAsgId={submittingAsgId}
                />
              </div>

            </div>

            {/* Right Column: Upcoming Assignments Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Upcoming Assignments Panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-4">
                <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-900" />
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Syllabus Assignments
                    </h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded font-bold">
                    {allAssignments.length} ACTIVE
                  </span>
                </div>

                <div className="space-y-3">
                  {allAssignments.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2">No active course assignments recorded.</p>
                  ) : (
                    allAssignments.map((asg) => {
                      const isSubmitted = submittedAsgIds.includes(asg.id);
                      return (
                        <div 
                          key={asg.id} 
                          className={`p-3 rounded-xl border transition-all ${
                            isSubmitted 
                              ? "border-emerald-100 bg-emerald-50/20" 
                              : "border-slate-100 bg-slate-50/30 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex justify-between items-center gap-1.5">
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                              isSubmitted ? "text-emerald-700 font-bold" : "text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded font-bold"
                            }`}>
                              {isSubmitted ? "SUBMITTED" : `DUE: ${asg.dueDate}`}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold line-clamp-1">
                              {asg.courseName.split(" ")[0]}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-xs text-slate-900 mt-1.5 leading-snug">
                            {asg.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {asg.topic}
                          </p>

                          {!isSubmitted && (
                            <button
                              onClick={() => handleAsgSubmit(asg.id, asg.title, asg.courseName)}
                              disabled={submittingAsgId !== null}
                              className="mt-2.5 text-[10px] font-bold text-blue-900 hover:text-blue-950 transition-colors block text-left underline"
                            >
                              {submittingAsgId === asg.id ? "Uploading attachment..." : "Submit Material Now"}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Study helper tip */}
              <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-900" />
                  <span className="font-display font-extrabold text-xs text-blue-950 uppercase tracking-widest leading-none">AI Tip of the Day</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  "Syllabus questions regarding 'Foundations of the Mind' are heavily weighted this semester. Open the course page below to prepare with our AI Assistant!"
                </p>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Corporate footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 EduNest Nepal Ltd. Kathmandu University Workspace. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Support: helpdesk@kusoed.edu.np</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

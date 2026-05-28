import React, { useState, useEffect } from "react";
import { 
  Plus, 
  GraduationCap, 
  Users, 
  BookOpen, 
  FilePlus, 
  PlusCircle, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Shield,
  FileText
} from "lucide-react";
import { Course, User } from "../types";
import { getCourses, createCourse, enrollStudent, addMaterial, addAssignment } from "../services/api";
import NotificationBell from "./NotificationBell";

interface TeacherDashboardProps {
  user: User;
  onSelectCourse: (course: Course) => void;
  onSignOut: () => void;
  onSwitchPortal?: () => void;
}

export default function TeacherDashboard({ user, onSelectCourse, onSignOut, onSwitchPortal }: TeacherDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modals / Forms States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDepartment, setNewDepartment] = useState("Computer Science & Engineering");
  const [newLevel, setNewLevel] = useState("Intermediate");
  const [newDuration, setNewDuration] = useState("12 Weeks");
  const [newSemester, setNewSemester] = useState("Autumn 2026");

  // Material Form
  const [matTitle, setMatTitle] = useState("");
  const [matType, setMatType] = useState<'pdf' | 'docx' | 'link'>("pdf");
  const [matSize, setMatSize] = useState("2.5 MB");

  // Assignment Form
  const [asgTitle, setAsgTitle] = useState("");
  const [asgTopic, setAsgTopic] = useState("");
  const [asgDueDate, setAsgDueDate] = useState("Oct 30, 2026");

  // Student Enrollment Form
  const [studentEmail, setStudentEmail] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  const fetchTeacherCourses = async () => {
    try {
      setLoading(true);
      const all = await getCourses();
      // Since it's a demo portal, let's show all courses but highlight the teacher's owned course
      setCourses(all);
      // Auto select the first course to make operations seamless right away if none selected
      if (all.length > 0 && !selectedCourse) {
        setSelectedCourse(all[0]);
      } else if (selectedCourse) {
        // Refresh selected course
        const current = all.find(c => c.id === selectedCourse.id);
        if (current) setSelectedCourse(current);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setActionLoading(true);

    try {
      if (!newTitle.trim() || !newCode.trim() || !newDescription.trim()) {
        throw new Error("Please fill in course title, code, and syllabus description.");
      }

      const created = await createCourse({
        title: newTitle,
        code: newCode,
        description: newDescription,
        instructorName: user.name,
        department: newDepartment,
        duration: newDuration,
        level: newLevel,
        semester: newSemester,
      });

      setFormSuccess(`Syllabus course "${newTitle}" created successfully.`);
      setShowCreateModal(false);
      
      // Reset fields
      setNewTitle("");
      setNewCode("");
      setNewDescription("");
      
      // Refresh list and make the newly created course active
      const all = await getCourses();
      setCourses(all);
      setSelectedCourse(created);

    } catch (err: any) {
      setFormError(err.message || "Failed to create course.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setFormError("");
    setFormSuccess("");
    setActionLoading(true);

    try {
      if (!studentEmail.trim()) throw new Error("Enter student email to enroll.");
      const result = await enrollStudent(selectedCourse.id, studentEmail);
      
      setFormSuccess(`Successfully enrolled student '${studentEmail}' to ${selectedCourse.title}.`);
      setStudentEmail("");
      
      // Refresh data
      await fetchTeacherCourses();
    } catch (err: any) {
      setFormError(err.message || "Enrollment failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setFormError("");
    setFormSuccess("");
    setActionLoading(true);

    try {
      if (!matTitle.trim()) throw new Error("Enter a descriptive document title.");
      
      await addMaterial(selectedCourse.id, matTitle, matType, "#", matSize);
      
      setFormSuccess(`Document "${matTitle}" registered to downloadable materials.`);
      setMatTitle("");
      
      // Refresh statistics and course structure
      await fetchTeacherCourses();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setFormError("");
    setFormSuccess("");
    setActionLoading(true);

    try {
      if (!asgTitle.trim()) throw new Error("Please enter assignment title.");
      
      await addAssignment(selectedCourse.id, asgTitle, asgTopic, asgDueDate);
      
      setFormSuccess(`Assignment "${asgTitle}" published for all active students.`);
      setAsgTitle("");
      setAsgTopic("");
      
      // Refresh course list
      await fetchTeacherCourses();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button 
              type="button"
              onClick={() => {
                setSelectedCourse(null);
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
              <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-100 rounded-lg px-2.5 py-1">
                Faculty Workspace
              </span>
              {onSwitchPortal && (
                <button
                  type="button"
                  onClick={onSwitchPortal}
                  className="text-xs text-slate-505 hover:text-blue-950 font-bold transition-all px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  title="Switch instantly to Student Portal"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Go to Student Portal
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
                className="md:hidden text-[10px] uppercase font-bold text-blue-800 px-2 py-1.5 rounded bg-blue-50 hover:bg-blue-100 cursor-pointer"
                title="Switch to Student Portal"
              >
                Student Portal ↩
              </button>
            )}

            <NotificationBell user={user} />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Teacher</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold uppercase text-xs">
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

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {/* Profile/Welcome Greeting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-8 border-b border-slate-200">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Syllabus Curriculum Manager
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed font-normal">
              Create academic courses, upload course syllabus materials, register active student emails, and coordinate university curriculum details.
            </p>
          </div>
          <button
            onClick={() => {
              setFormError("");
              setFormSuccess("");
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-soft cursor-pointer self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>

        {/* Global Notifications Panel (Form updates) */}
        {(formError || formSuccess) && (
          <div className="max-w-3xl">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-750 rounded-lg flex items-center gap-1.5 text-xs text-red-800 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-1.5 text-xs font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">
            Fetching course catalogues...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Hand: Course Selector & Statistics */}
            <div className="lg:col-span-4 space-y-6">
              <h2 className="font-display font-bold text-base text-slate-900 uppercase tracking-wider">
                Select Active Courses ({courses.length})
              </h2>

              <div className="space-y-4">
                {courses.map((course) => {
                  const isSelected = selectedCourse?.id === course.id;
                  return (
                    <div
                      key={course.id}
                      onClick={() => {
                        setSelectedCourse(course);
                        setFormError("");
                        setFormSuccess("");
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-white border-blue-900 shadow-premium" 
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-soft"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                          {course.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{course.duration}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-950 truncate">{course.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{course.department}</p>
                      
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-slate-400 text-xs">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                          <Users className="w-3.5 h-3.5" />
                          {course.studentCount} Students
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                          <BookOpen className="w-3.5 h-3.5" />
                          {course.materials.length} Files
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Hand: selectedCourse Actions Manager */}
            <div className="lg:col-span-8">
              {selectedCourse ? (
                <div className="space-y-8">
                  
                  {/* Selected Course Header */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-900 font-bold text-xs px-2.5 py-1 rounded">
                            {selectedCourse.code}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">Department: {selectedCourse.department}</span>
                        </div>
                        <h2 className="font-display text-xl font-extrabold text-slate-900">{selectedCourse.title}</h2>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">Coordination Profile: {selectedCourse.instructorName}</p>
                      </div>

                      <button
                        onClick={() => onSelectCourse(selectedCourse)}
                        className="px-3.5 py-2 border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white rounded-lg font-bold text-xs transition-colors"
                      >
                        Launch Interactive Course Workspace
                      </button>
                    </div>

                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed mt-4 pt-4 border-t border-slate-100">
                      {selectedCourse.description}
                    </p>
                  </div>

                  {/* Operational grid split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Enroll module */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-soft space-y-4">
                      <h3 className="font-display font-extrabold text-base text-blue-950 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-900" />
                        Enroll Student Emails
                      </h3>
                      <p className="text-slate-500 text-xs">Register new students using their email. They must have a profile setup on EduNest.</p>
                      
                      <form onSubmit={handleEnrollStudent} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student Academic Email</label>
                          <input
                            type="email"
                            required
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="aryankarna_btechedit2024@kusoed.edu.np"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full bg-blue-900 text-white font-bold text-xs py-2 rounded-lg hover:bg-blue-950 transition-colors disabled:opacity-50"
                        >
                          {actionLoading ? "Registering student..." : "Enroll Student"}
                        </button>
                      </form>

                      {/* Display current list representation */}
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Currently Enrolled Student Users</p>
                        <div className="bg-slate-50 rounded-lg p-2 max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                          {selectedCourse.enrolledStudents.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No students registered yet.</span>
                          ) : (
                            selectedCourse.enrolledStudents.map((studId, i) => (
                              <div key={studId} className="flex justify-between items-center text-[10px] text-slate-700 py-1 border-b border-white last:border-0 last:pb-0">
                                <span className="font-medium text-slate-700">Student ID {studId}</span>
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Active</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Upload syllabus study materials */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-soft space-y-4">
                      <h3 className="font-display font-extrabold text-base text-blue-950 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-900" />
                        Add Study Materials
                      </h3>
                      <p className="text-slate-500 text-xs">Append downloadable lecture guides, references, or reading links to this syllabus.</p>

                      <form onSubmit={handleAddMaterial} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Title</label>
                          <input
                            type="text"
                            required
                            value={matTitle}
                            onChange={(e) => setMatTitle(e.target.value)}
                            placeholder="e.g. Past Questions Paper 2025"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Doc Type</label>
                            <select
                              value={matType}
                              onChange={(e) => setMatType(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none font-sans"
                            >
                              <option value="pdf">PDF</option>
                              <option value="docx">Word DOCX</option>
                              <option value="link">External URL</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Doc Size</label>
                            <input
                              type="text"
                              required
                              value={matSize}
                              onChange={(e) => setMatSize(e.target.value)}
                              placeholder="e.g. 1.8 MB"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-blue-900 text-white font-bold text-xs py-2 rounded-lg hover:bg-blue-950 transition-colors"
                        >
                          Append Material Outline
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Create assignment module */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft space-y-4">
                    <h3 className="font-display font-extrabold text-base text-blue-950 flex items-center gap-1.5">
                      <FilePlus className="w-4.5 h-4.5 text-blue-900" />
                      Publish syllabus assignment
                    </h3>
                    <p className="text-slate-500 text-xs">Define prompts or problems. Correctly publishes target tasks instantly with a designated due date.</p>

                    <form onSubmit={handleAddAssignment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assignment Title</label>
                        <input
                          type="text"
                          required
                          value={asgTitle}
                          onChange={(e) => setAsgTitle(e.target.value)}
                          placeholder="e.g. Research Journal Reflection"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Topic details</label>
                        <input
                          type="text"
                          required
                          value={asgTopic}
                          onChange={(e) => setAsgTopic(e.target.value)}
                          placeholder="e.g. Chapter 3 Cognitive Theory"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                          <input
                            type="text"
                            required
                            value={asgDueDate}
                            onChange={(e) => setAsgDueDate(e.target.value)}
                            placeholder="e.g. Oct 30, 2026"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold text-xs hover:bg-blue-950 transition-colors h-9"
                        >
                          Publish
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                  Select an active syllabus course or create a new course to manage documents, students, and assignment plans.
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Modal - Create Course overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full border border-slate-100 shadow-premium relative">
            <h3 className="font-display font-extrabold text-xl text-blue-950 mb-1">Create Curriculum Syllabus</h3>
            <p className="text-xs text-slate-500 mb-6">Enter essential details to coordinate this Course.</p>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. COMP-101"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Introduction to IT"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Syllabus Overview / Description</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provides foundational frameworks and practical scopes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="e.g. 12 Weeks"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none font-sans"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Semester</label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none font-sans font-bold text-blue-900"
                  >
                    <option value="Autumn 2026">Autumn 2026</option>
                    <option value="Spring 2026">Spring 2026</option>
                    <option value="Autumn 2025">Autumn 2025</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-900 outline-none font-sans"
                  >
                     <option value="Computer Science & Engineering">CSE</option>
                     <option value="Social Sciences">Social Sci</option>
                     <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 font-bold text-xs text-slate-500 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-950 disabled:opacity-50"
                >
                  {actionLoading ? "Registering Course..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer info */}
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

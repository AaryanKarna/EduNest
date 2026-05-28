import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Compass, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Info,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Course, Assignment } from "../types";

interface AcademicCalendarProps {
  courses: Course[];
  submittedAsgIds: string[];
  onSubmitAssignment: (asgId: string, asgTitle: string, courseName: string) => void;
  submittingAsgId: string | null;
}

interface CalendarEvent {
  id: string;
  type: "holiday" | "due" | "overdue" | "event";
  title: string;
  description: string;
  date: Date; // Keep as standard date object for comparison
  courseId?: string;
  courseName?: string;
  assignmentId?: string;
  originalDueDate?: string;
}

export default function AcademicCalendar({ 
  courses, 
  submittedAsgIds, 
  onSubmitAssignment,
  submittingAsgId
}: AcademicCalendarProps) {
  // Current local time metadata states the active system date is 2026-05-27
  const systemDate = new Date("2026-05-27");
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(4); // May is 4 (0-indexed)

  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-05-27");
  const [filterType, setFilterType] = useState<string>("all");

  // Compile Nepalese Academic Hub Holidays and Campus Schedules:
  const academicEvents: CalendarEvent[] = [
    {
      id: "hol_1",
      type: "holiday",
      title: "Buddha Jayanti (Saga Dawa festival)",
      description: "Gazetted National Holiday celebrating Buddha's birthday. Campus administrative offices closed.",
      date: new Date("2026-05-31")
    },
    {
      id: "hol_2",
      type: "holiday",
      title: "Republic Day (Gantantra Diwas)",
      description: "National holiday in Nepal. No syllabus lectures scheduled today.",
      date: new Date("2026-05-28")
    },
    {
      id: "hol_3",
      type: "holiday",
      title: "Syllabus Break (Mid-Term Rest Period)",
      description: "Break week for self-study and preparation for upcoming mid-term examinations.",
      date: new Date("2026-06-15")
    },
    {
      id: "evt_1",
      type: "event",
      title: "Annual Faculty-Student Tech Symposium",
      description: "Academic guest lectures on AI, technology architectures and educational development in Nepal.",
      date: new Date("2026-05-26")
    },
    {
      id: "evt_2",
      type: "event",
      title: "Kathmandu Valley College Athletics Meet",
      description: "Inter-department sports championships and student activity programs.",
      date: new Date("2026-06-02")
    }
  ];

  // Compile real assignments from the enrolled syllabus courses:
  const getAssignmentEvents = (): CalendarEvent[] => {
    const list: CalendarEvent[] = [];
    courses.forEach(course => {
      course.assignments.forEach(asg => {
        const isSubmitted = submittedAsgIds.includes(asg.id);
        
        let eventDate = new Date("2026-05-27");
        if (asg.dueDate === "Tomorrow") {
          eventDate = new Date("2026-05-28");
        } else if (asg.dueDate.includes("Oct 28")) {
          eventDate = new Date("2026-10-28");
        } else if (asg.dueDate.includes("Oct 24")) {
          eventDate = new Date("2026-10-24");
        } else {
          // Fallback or parse string
          const parsed = Date.parse(asg.dueDate);
          if (!isNaN(parsed)) {
            eventDate = new Date(parsed);
          }
        }

        // Determine if overdue: due before 2026-05-27 and NOT submitted
        const isPast = eventDate.getTime() < systemDate.getTime();
        const type = (isPast && !isSubmitted) ? "overdue" : "due";

        list.push({
          id: `asg_evt_${asg.id}`,
          type: type as "due" | "overdue",
          title: `Assignment: ${asg.title}`,
          description: `Syllabus Topic: ${asg.topic}. Course: ${course.title} (${course.code}). Instructor: ${course.instructorName}.`,
          date: eventDate,
          courseId: course.id,
          courseName: course.title,
          assignmentId: asg.id,
          originalDueDate: asg.dueDate
        });
      });
    });

    // Also inject a realistic mock overdue assignment for educational syllabus visual fidelity
    list.push({
      id: "overdue_mock_1",
      type: "overdue",
      title: "Research Proposal on Neural Networks",
      description: "Late submission due. Overdue by 7 days. High penalty applicable if not uploaded in the syllabus workspace immediately.",
      date: new Date("2026-05-20"),
      courseId: "course_2",
      courseName: "Introduction to IT",
      assignmentId: "asg_mock_overdue"
    });

    return list;
  };

  const allEvents = [...academicEvents, ...getAssignmentEvents()];

  // Month navigation:
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Days in month calculator:
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Render arrays:
  const calendarDays: Array<{ dayNum: number; dateStr: string; dateObj: Date; isCurrentMonth: boolean }> = [];
  
  // Padding from previous month:
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const paddingDate = new Date(prevYear, prevMonth, day);
    const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dayNum: day,
      dateStr: dateString,
      dateObj: paddingDate,
      isCurrentMonth: false
    });
  }

  // Active Month Days:
  for (let day = 1; day <= daysInMonth; day++) {
    const activeDate = new Date(currentYear, currentMonth, day);
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dayNum: day,
      dateStr: dateString,
      dateObj: activeDate,
      isCurrentMonth: true
    });
  }

  // Formatting date standard:
  const formatIsoDate = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Selected date events filter:
  const getEventsForDate = (dateStr: string) => {
    return allEvents.filter(event => formatIsoDate(event.date) === dateStr);
  };

  // Counts of events in current month for counters view:
  const getEventsSummary = () => {
    const currentMonthEvents = allEvents.filter(e => {
      return e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear;
    });

    const holidays = currentMonthEvents.filter(e => e.type === "holiday").length;
    const assignmentsDue = currentMonthEvents.filter(e => e.type === "due").length;
    const overdue = allEvents.filter(e => e.type === "overdue").length; // Overdue is cumulative

    return { holidays, assignmentsDue, overdue };
  };

  const summary = getEventsSummary();

  const handleSelectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
  };

  // Selected date parsed label:
  const getSelectedDateFriendly = () => {
    const date = new Date(selectedDateStr);
    if (isNaN(date.getTime())) return "Selected Day";
    return date.toLocaleDateString("en-NP", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const selectedDateEvents = getEventsForDate(selectedDateStr);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
      
      {/* Header Info */}
      <div className="bg-slate-50 p-5 border-b border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 font-mono">
            <CalendarIcon className="w-3 h-3" />
            University Scheduler
          </span>
          <h3 className="font-display font-extrabold text-base text-slate-900 leading-snug mt-1">
            Academic Calendar Portal
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Interactive syllabus deadlines, overdue trackers, and official Nepalese national holidays.
          </p>
        </div>
        
        {/* Quick Summary Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            <span>{summary.overdue} Overdue</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            <span>{summary.assignmentsDue} Syllabus Due</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            <span>{summary.holidays} Holidays</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* Calendar Grid - Left Panel */}
        <div className="lg:col-span-7 p-5 border-r border-slate-100">
          
          {/* Month Selector */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              {monthNames[currentMonth]} {currentYear}
              {currentMonth === 4 && currentYear === 2026 && (
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 font-mono uppercase font-bold">
                  Current Term Month
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 px-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 px-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 font-mono py-1.5 border-b border-slate-100 mb-2">
            <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((calDay, idx) => {
              const formatted = calDay.dateStr;
              const hasEvents = getEventsForDate(formatted);
              const isSelected = selectedDateStr === formatted;
              const isSystemDay = formatted === "2026-05-27";
              
              // Determine primary event color-type highlights (prioritizing Overdue, then Due, then Holiday)
              let borderClass = "border-slate-150";
              let bgIndicatorClass = "";
              let titleAttr = "";

              if (hasEvents.length > 0) {
                const types = hasEvents.map(e => e.type);
                if (types.includes("overdue")) {
                  bgIndicatorClass = "bg-red-500";
                  borderClass = "border-red-200";
                  titleAttr = "Unsubmitted Assignment Due";
                } else if (types.includes("due")) {
                  bgIndicatorClass = "bg-blue-600";
                  borderClass = "border-blue-200";
                  titleAttr = "Syllabus Assignment Deadline";
                } else if (types.includes("holiday")) {
                  bgIndicatorClass = "bg-amber-500";
                  borderClass = "border-amber-200";
                  titleAttr = "Nepali National Holiday";
                } else if (types.includes("event")) {
                  bgIndicatorClass = "bg-emerald-500";
                  borderClass = "border-emerald-200";
                  titleAttr = "Campus Academic Conference";
                }
              }

              return (
                <button
                  type="button"
                  key={`${formatted}-${idx}`}
                  onClick={() => handleSelectDay(formatted)}
                  className={`relative aspect-square rounded-xl p-1 border transition-all flex flex-col justify-between items-center cursor-pointer ${
                    !calDay.isCurrentMonth ? "opacity-35 hover:opacity-75 focus:opacity-100" : ""
                  } ${
                    isSelected 
                      ? "bg-slate-900 border-slate-900 text-white shadow-soft" 
                      : isSystemDay 
                        ? "bg-blue-50 border-blue-400 text-blue-950 font-extrabold focus:ring-1 focus:ring-blue-900"
                        : "bg-slate-50 hover:bg-slate-100 focus:bg-slate-150 border-slate-100"
                  }`}
                  title={titleAttr || `${calDay.dayNum} ${monthNames[currentMonth]}`}
                >
                  <span className={`text-[11px] font-bold mt-1 ${isSystemDay && !isSelected ? "text-blue-950 px-1 rounded bg-blue-100" : ""}`}>
                    {calDay.dayNum}
                  </span>

                  {/* Indicator Dot represent events inside */}
                  {hasEvents.length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full mb-1 ${isSelected ? "bg-white" : bgIndicatorClass}`} />
                  )}

                  {/* Small tooltip ring only shown on hovering */}
                  {isSystemDay && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" title="Today's Session Active" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Syllabus Directives
            </span>
            <span>Date: May 27, 2026 (Active)</span>
          </div>
        </div>

        {/* Selected Date Information Panel - Right Panel */}
        <div className="lg:col-span-5 p-5 bg-slate-50/50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-150 pb-2.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider mb-0.5">
                Agenda Showcase
              </span>
              <h4 className="font-display font-extrabold text-xs text-slate-950 leading-tight">
                {getSelectedDateFriendly()}
              </h4>
            </div>

            <div className="space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200/50 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Compass className="w-6 h-6 text-slate-350 stroke-1" />
                  <span>No lecture deadlines, overdue alerts, or holidays listed on this date.</span>
                </div>
              ) : (
                selectedDateEvents.map((evt) => {
                  const isSubmitted = evt.assignmentId ? submittedAsgIds.includes(evt.assignmentId) : false;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={evt.id}
                      className={`p-3.5 rounded-xl border bg-white shadow-soft/50 space-y-2.5 ${
                        evt.type === "overdue" 
                          ? "border-red-200 border-l-4 border-l-red-500" 
                          : evt.type === "due" 
                            ? "border-blue-200 border-l-4 border-l-blue-600"
                            : evt.type === "holiday"
                              ? "border-amber-200 border-l-4 border-l-amber-500"
                              : "border-slate-200 border-l-4 border-l-slate-400"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono ${
                          evt.type === "overdue"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : evt.type === "due"
                              ? "bg-blue-50 text-blue-850 border border-blue-100"
                              : evt.type === "holiday"
                                ? "bg-amber-50 text-amber-800 border border-amber-100"
                                : "bg-slate-100 text-slate-600"
                        }`}>
                          {evt.type === "overdue" 
                            ? "Overdue Alert ⚠️" 
                            : evt.type === "due" 
                              ? "Syllabus Due" 
                              : evt.type === "holiday" 
                                ? "National Holiday" 
                                : "Campus Event"}
                        </span>

                        {evt.assignmentId && (
                          <span className="text-[9px] text-slate-400 font-mono font-bold">
                            {isSubmitted ? "✅ Submitted" : "❌ Pending Engagement"}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-xs text-slate-900 leading-snug">
                          {evt.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                          {evt.description}
                        </p>
                      </div>

                      {/* Interactive Syllabus Submission trigger right inside the calendar */}
                      {evt.assignmentId && (evt.type === "due" || evt.type === "overdue") && !isSubmitted && (
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 font-medium">
                            Actions logged to database
                          </span>
                          <button
                            type="button"
                            onClick={() => onSubmitAssignment(evt.assignmentId!, evt.title.replace("Assignment: ", ""), evt.courseName || "General Course")}
                            disabled={submittingAsgId !== null}
                            className="bg-blue-50 hover:bg-blue-900 hover:text-white text-blue-900 py-1 px-2.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                          >
                            {submittingAsgId === evt.assignmentId ? "Uploading..." : "Submit File"}
                          </button>
                        </div>
                      )}

                      {isSubmitted && (
                        <div className="pt-1 text-[10px] text-emerald-700 font-bold flex items-center gap-1 justify-end font-sans">
                          <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          Material Received
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Nepal Tourism / Campus Highlight banner */}
          <div className="mt-5 p-3.5 bg-sky-950 text-white rounded-xl flex items-center gap-3 relative overflow-hidden shadow-sm">
            <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-sky-200" />
            </div>
            <div className="space-y-0.5 z-10">
              <span className="text-[8px] uppercase tracking-wider font-bold text-sky-300 font-mono">Academic Coach Guidance</span>
              <p className="text-[10px] text-sky-100 leading-relaxed font-medium">
                Keep up with deadlines! Overdue assignments can lead to grade registration reductions. Submit files prior to term end.
              </p>
            </div>
            
            {/* Ambient background decoration */}
            <div className="absolute right-0 bottom-0 opacity-10 font-[serif] text-5xl leading-none select-none pointer-events-none translate-x-3 translate-y-3 font-semibold">
              KU
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

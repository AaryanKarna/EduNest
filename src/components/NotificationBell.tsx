import React, { useState, useEffect, useRef } from "react";
import { Bell, BookOpen, AlertCircle, FileCheck, MessageSquare, Megaphone, Inbox, Check } from "lucide-react";
import { AppNotification, User } from "../types";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/api";

interface NotificationBellProps {
  user: User;
}

export default function NotificationBell({ user }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 8 seconds for a lively, real-time feel
    const interval = setInterval(() => {
      fetchNotifications();
    }, 8000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Click outside to close wrapper
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Query notifications either for general user target or their specific role
      const list = await getNotifications(user.id, user.role);
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "material":
        return <BookOpen className="w-4 h-4 text-sky-600" />;
      case "assignment":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "submission":
        return <FileCheck className="w-4 h-4 text-emerald-500" />;
      case "forum":
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-pink-500" />;
    }
  };

  return (
    <div className="relative" ref={containerRef} id="notification-bell-container">
      {/* Icon Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-blue-900 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
        id="notification-bell-button"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-bold rounded-full flex items-center justify-center font-mono animate-pulse"
            style={{ fontSize: "9px" }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-premium z-50 overflow-hidden divide-y divide-slate-100"
          id="notification-dropdown"
        >
          {/* Header */}
          <div className="p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Notifications</h4>
              <p className="text-[10px] text-slate-400 font-medium">Updates on your university courses</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List content section */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100" id="notification-list-body">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto text-slate-350 mb-2 stroke-1" />
                <p className="text-xs font-semibold">Workspace is all caught up!</p>
                <p className="text-[10px] text-slate-400">Announcements or active updates show here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 flex gap-3 items-start transition-colors ${notif.read ? "bg-white" : "bg-blue-50/20"}`}
                >
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        {notif.courseCode || "EduNest"}
                      </span>
                      <span className="text-[9px] text-slate-400 shrink-0 font-medium font-mono">{notif.createdAt}</span>
                    </div>
                    <p className={`text-xs mt-0.5 leading-tight ${notif.read ? "text-slate-600 font-medium" : "text-slate-900 font-bold"}`}>
                      {notif.title}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1">
                      {notif.description}
                    </p>
                  </div>

                  {!notif.read && (
                    <button
                      onClick={(e) => handleMarkRead(notif.id, e)}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg shrink-0 mt-1 cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer view history fallback */}
        </div>
      )}
    </div>
  );
}

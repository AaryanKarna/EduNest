/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Course } from "./types";
import LandingPage from "./components/LandingPage";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import CoursePage from "./components/CoursePage";
import { loginUser } from "./services/api";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Sign out helper
  const handleSignOut = () => {
    setCurrentUser(null);
    setSelectedCourse(null);
  };

  // Switch between portals instantly
  const handleSwitchUser = async (role: "student" | "teacher") => {
    const demoEmail = role === "student" 
      ? "aryankarna_btechedit2024@kusoed.edu.np" 
      : "prof.vance@kusoed.edu.np";
    const demoPassword = "password123";
    try {
      const user = await loginUser(demoEmail, demoPassword);
      setCurrentUser(user);
      setSelectedCourse(null);
    } catch (err) {
      console.error("Portal switch error:", err);
    }
  };

  // Switch between screens cleanly
  if (!currentUser) {
    return <LandingPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  if (selectedCourse) {
    return (
      <CoursePage 
        course={selectedCourse} 
        user={currentUser} 
        onBackToDashboard={() => setSelectedCourse(null)} 
      />
    );
  }

  if (currentUser.role === "teacher") {
    return (
      <TeacherDashboard 
        user={currentUser} 
        onSelectCourse={(course) => setSelectedCourse(course)} 
        onSignOut={handleSignOut} 
        onSwitchPortal={() => handleSwitchUser("student")}
      />
    );
  }

  return (
    <StudentDashboard 
      user={currentUser} 
      onSelectCourse={(course) => setSelectedCourse(course)} 
      onSignOut={handleSignOut} 
      onSwitchPortal={() => handleSwitchUser("teacher")}
    />
  );
}


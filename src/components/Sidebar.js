import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdHome,
  MdDashboard,
  MdPayments,
  MdAssessment,
  MdCloudUpload,
  MdSettings,
  MdPerson,
  MdLogout,
} from "react-icons/md";
import { createClient } from "@supabase/supabase-js";
import "./Sidebar.css";

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function SidebarItem({ to, icon: Icon, label }) {
  return (
    <li>
      <Link to={to} className="sidebar-item">
        <Icon className="sidebar-icon" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local session
      localStorage.removeItem("session");

      // Force reload to reset app state
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const menuItems = [
    { path: "/", icon: MdHome, text: "Home" },
    { path: "/dashboard", icon: MdDashboard, text: "Dashboard" },
    { path: "/transactions", icon: MdPayments, text: "Transactions" },
    { path: "/reports", icon: MdAssessment, text: "Reports" },
    { path: "/data-input", icon: MdCloudUpload, text: "Data Input" },
    { path: "/settings", icon: MdSettings, text: "Settings" },
    { path: "/profile", icon: MdPerson, text: "Profile" },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-box">T</div>
        <span className="logo-text">Thera</span>
      </div>

      {/* Main Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-main">
          {menuItems.map((item, index) => (
            <SidebarItem
              key={index}
              to={item.path}
              icon={item.icon}
              label={item.text}
            />
          ))}
        </ul>

        <div className="nav-divider"></div>
      </nav>

      {/* Logout */}
      <button className="logout-button" onClick={handleLogout}>
        <MdLogout />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;

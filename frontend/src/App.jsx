import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Building, 
  LineChart, 
  AlertCircle,
  RefreshCcw,
  Sparkles,
  Menu,
  X,
  Lock,
  Unlock,
  LogOut
} from "lucide-react";

import AnalyticsDashboard from "./components/AnalyticsDashboard";
import DirectoryView from "./components/DirectoryView";
import AiAssistant from "./components/AiAssistant";
import OutreachAutomation from "./components/OutreachAutomation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 1. One-Click Login Page Component
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("admin@incubein.org");
  const [password, setPassword] = useState("••••••••••••");

  return (
    <div className="login-container-page">
      <div className="login-card">
        <h2 className="login-title">InCubein Foundation</h2>
        <p className="login-subtitle">Ecosystem Intelligence & Outreach Portal</p>
        
        <div className="login-form-group">
          <label>Username / Email</label>
          <input 
            type="text" 
            className="login-input" 
            value={username} 
            disabled 
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          />
        </div>
        
        <div className="login-form-group" style={{ marginBottom: "2rem" }}>
          <label>Access Key</label>
          <input 
            type="password" 
            className="login-input" 
            value={password} 
            disabled 
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          />
        </div>
        
        <button className="login-btn" onClick={onLogin}>
          <Unlock size={18} />
          <span>One-Click Login</span>
        </button>
      </div>
    </div>
  );
}

// 2. Main App Content Layout
function AppContent({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mouPreselectedIncubator, setMouPreselectedIncubator] = useState("");
  const [outreachRefreshTrigger, setOutreachRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleDraftMouFromFinder = (incubatorName) => {
    setMouPreselectedIncubator(incubatorName);
    navigate("/outreach");
    setIsSidebarOpen(false); // Close sidebar on redirect
  };
  
  // App state
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEcosystemData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch Analytics
      const analyticsRes = await fetch("http://127.0.0.1:8000/api/analytics");
      const analytics = await analyticsRes.json();
      setAnalyticsData(analytics);
      
      if (location.pathname === "/outreach") {
        setOutreachRefreshTrigger(prev => prev + 1);
      }
      setBackendError(false);
    } catch (e) {
      console.error("Backend offline:", e);
      setBackendError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  if (backendError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center", background: "#f8f9ff" }}>
        <div className="glass-card" style={{ padding: "3rem", maxWidth: "550px", border: "1px solid var(--accent-red)" }}>
          <AlertCircle size={48} style={{ color: "var(--accent-red)", marginBottom: "1.5rem" }} />
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Backend Server Offline</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "2rem" }}>
            The InCubein Foundation Platform frontend is running, but it cannot connect to the Python FastAPI backend on <code style={{ color: "var(--secondary)", background: "rgba(0,0,0,0.03)", padding: "0.15rem 0.35rem", borderRadius: "4px" }}>http://127.0.0.1:8000</code>.
          </p>
          
          <div style={{ background: "black", padding: "1.25rem", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.85rem", textAlign: "left", color: "#38bdf8", border: "1px solid var(--border-color)", marginBottom: "2rem" }}>
            <span style={{ color: "var(--text-dim)" }}># Launch backend in another terminal:</span><br />
            cd backend<br />
            python run.py
          </div>

          <button className="btn btn-primary" style={{ margin: "0 auto" }} onClick={fetchEcosystemData}>
            <RefreshCcw size={16} /> Reconnect to Backend
          </button>
        </div>
      </div>
    );
  }

  const activePath = location.pathname;

  return (
    <div className="app-container">
      {/* Mobile Top Navigation Bar */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <span className="logo-text">InCubein</span>
        </div>
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        {/* Mobile Sidebar Close Button */}
        <div className="sidebar-mobile-close">
          <button onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <ul className="sidebar-menu">
          <li className={`sidebar-item ${activePath === "/" || activePath === "/dashboard" ? "active" : ""}`}>
            <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)}>
              <LineChart size={18} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={`sidebar-item ${activePath === "/directory" ? "active" : ""}`}>
            <Link to="/directory" onClick={() => setIsSidebarOpen(false)}>
              <Building size={18} />
              <span>Incubators Directory</span>
            </Link>
          </li>
          <li className={`sidebar-item ${activePath === "/outreach" ? "active" : ""}`}>
            <Link to="/outreach" onClick={() => setIsSidebarOpen(false)}>
              <Sparkles size={18} style={{ color: "var(--secondary)" }} />
              <span>Outreach Automation</span>
            </Link>
          </li>
        </ul>

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          style={{
            background: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.2)",
            color: "var(--accent-red)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,38,38,0.18)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(220,38,38,0.1)"}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="header-section">
          <div className="header-title">
            <h1>
              {(activePath === "/" || activePath === "/dashboard") && "Ecosystem Insights & Analytics"}
              {activePath === "/directory" && "Indian Incubators Directory"}
              {activePath === "/outreach" && "Email Outreach & Auto-Scheduler"}
            </h1>
            <p>
              {(activePath === "/" || activePath === "/dashboard") && "Aggregated metrics, state distributions, and technology verticals."}
              {activePath === "/directory" && "Discover and search academic, government, and private TBIs."}
              {activePath === "/outreach" && "Draft collaboration MOUs, execute digital signatures, run campaign outreach, and monitor inbox replies."}
            </p>
          </div>

          <div className="header-actions">
            <button 
              className="btn btn-secondary" 
              onClick={fetchEcosystemData}
              disabled={refreshing}
              style={{ padding: "0.5rem 0.75rem" }}
              title="Refresh Data"
            >
              <RefreshCcw size={16} className={refreshing ? "spin" : ""} />
            </button>
          </div>
        </div>

        <Routes>
          <Route path="/" element={
            <>
              <AnalyticsDashboard analyticsData={analyticsData} loading={loading} />
              <AiAssistant />
            </>
          } />
          <Route path="/dashboard" element={
            <>
              <AnalyticsDashboard analyticsData={analyticsData} loading={loading} />
              <AiAssistant />
            </>
          } />
          <Route path="/directory" element={
            <DirectoryView filtersData={analyticsData ? analyticsData.filters : null} onDraftMou={handleDraftMouFromFinder} />
          } />
          <Route path="/outreach" element={
            <OutreachAutomation preselectedIncubatorName={mouPreselectedIncubator} refreshTrigger={outreachRefreshTrigger} />
          } />
        </Routes>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("authenticated") === "true"
  );

  const handleLogin = () => {
    localStorage.setItem("authenticated", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authenticated");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <AppContent onLogout={handleLogout} />
    </BrowserRouter>
  );
}

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { 
  Building, 
  LineChart, 
  AlertCircle,
  RefreshCcw,
  Sparkles,
  Menu,
  X,
  Unlock,
  LogOut
} from "lucide-react";

import AnalyticsDashboard from "./components/AnalyticsDashboard";
import DirectoryView from "./components/DirectoryView";
import AiAssistant from "./components/AiAssistant";
import OutreachAutomation from "./components/OutreachAutomation";
import RelationshipPipeline from "./components/RelationshipPipeline";

// 1. One-Click Login Page Component (Re-themed to Stitch UI Style)
function LoginPage({ onLogin }) {
  const [username] = useState("admin@incubein.org");
  const [password] = useState("••••••••••••");

  return (
    <div className="login-container-page bg-surface">
      <div className="login-card bento-card rounded-xl border border-outline-variant/60 shadow-lg p-10 max-w-[440px] w-full text-center bg-surface-container-lowest">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[32px] fill-icon">hub</span>
          </div>
          <div className="text-left">
            <h1 className="font-title-lg text-title-lg font-bold text-on-surface leading-tight">Incubator Hub</h1>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Management Portal</p>
          </div>
        </div>
        
        <h2 className="login-title font-headline-lg text-headline-lg text-on-surface mb-1">InCubein Foundation</h2>
        <p className="login-subtitle font-body-md text-on-surface-variant mb-8">Ecosystem Intelligence & Outreach Portal</p>
        
        <div className="login-form-group mb-5">
          <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">Username / Email</label>
          <input 
            type="text" 
            className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-on-surface outline-none" 
            value={username} 
            disabled 
            style={{ opacity: 0.7, cursor: "not-allowed" }}
          />
        </div>
        
        <div className="login-form-group mb-8">
          <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">Access Key</label>
          <input 
            type="password" 
            className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-on-surface outline-none" 
            value={password} 
            disabled 
            style={{ opacity: 0.7, cursor: "not-allowed" }}
          />
        </div>
        
        <button 
          className="w-full py-3.5 bg-primary hover:bg-primary-container text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md" 
          onClick={onLogin}
        >
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
      // Fetch Analytics
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
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-surface">
        <div className="bg-white p-12 rounded-2xl max-w-[550px] border border-red-200 shadow-lg">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-2xl font-bold text-on-surface mb-2">Backend Server Offline</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
            The platform frontend is running, but it cannot connect to the Python FastAPI backend on <code className="bg-surface-container-low px-2 py-1 rounded text-red-600">http://127.0.0.1:8000</code>.
          </p>
          
          <div className="bg-slate-950 p-6 rounded-lg text-sky-400 font-mono text-sm text-left border border-outline-variant/30 mb-8">
            <span className="text-slate-500"># Launch backend in another terminal:</span><br />
            cd backend<br />
            python run.py
          </div>

          <button className="login-btn max-w-xs mx-auto flex items-center justify-center gap-2" onClick={fetchEcosystemData}>
            <RefreshCcw size={16} /> Reconnect to Backend
          </button>
        </div>
      </div>
    );
  }

  const activePath = location.pathname;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant z-40 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          </div>
          <span className="font-bold text-on-surface">Incubator Hub</span>
        </div>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar Navigation (Stitch UI Theme) */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen flex flex-col w-[260px] bg-on-secondary-fixed text-white border-r border-outline-variant/10 z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Mobile Sidebar Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button onClick={() => setIsSidebarOpen(false)} className="text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
            <div>
              <h1 className="font-title-lg text-title-lg font-bold text-white leading-tight">Incubator Hub</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Management Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link 
              to="/dashboard" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-body-md text-body-md ${activePath === "/" || activePath === "/dashboard" ? "bg-white/10 border-l-4 border-primary-fixed text-white" : "text-white/60 hover:text-white/80 hover:bg-white/5"}`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
            
            <Link 
              to="/directory" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-body-md text-body-md ${activePath === "/directory" ? "bg-white/10 border-l-4 border-primary-fixed text-white" : "text-white/60 hover:text-white/80 hover:bg-white/5"}`}
            >
              <span className="material-symbols-outlined text-[20px]">business_center</span>
              <span>Incubator Directory</span>
            </Link>

            <Link 
              to="/outreach" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-body-md text-body-md ${activePath === "/outreach" ? "bg-white/10 border-l-4 border-primary-fixed text-white" : "text-white/60 hover:text-white/80 hover:bg-white/5"}`}
            >
              <span className="material-symbols-outlined text-[20px]">handshake</span>
              <span>MOU & Outreach</span>
            </Link>

            <Link 
              to="/pipeline-status" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-body-md text-body-md ${activePath === "/pipeline-status" ? "bg-white/10 border-l-4 border-primary-fixed text-white" : "text-white/60 hover:text-white/80 hover:bg-white/5"}`}
            >
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
              <span>Pipeline / Status</span>
            </Link>
          </nav>

          <div className="mt-8">
            <button 
              onClick={() => {
                navigate("/outreach");
                setIsSidebarOpen(false);
              }}
              className="w-full py-3 px-4 bg-primary-container hover:bg-primary text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span className="text-sm">Create New MOU</span>
            </button>
          </div>
        </div>

        {/* Profile / Logout Section (Stitch UI Theme) */}
        <div className="mt-auto px-6 py-6 border-t border-white/5 space-y-1">
          <Link 
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors font-body-md text-body-md"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span className="truncate">Dr. Rajesh Khanna</span>
          </Link>
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-body-md text-body-md w-full text-left cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col pt-16 lg:pt-0 overflow-hidden">
        {/* Top App Bar (Stitch UI Header Style) */}
        <header className="flex justify-between items-center w-full px-8 py-4 h-16 bg-surface-container-lowest border-b border-outline-variant z-30 shadow-sm">
          <div className="flex items-center gap-6 w-full max-w-xl">
            <div className="relative w-full group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                placeholder="Search incubators, partners, or states..." 
                type="text"
                onChange={(e) => {
                  if (activePath !== "/directory") {
                    navigate("/directory");
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all relative cursor-pointer"
              onClick={fetchEcosystemData}
              disabled={refreshing}
              title="Sync Data"
            >
              <RefreshCcw size={18} className={refreshing ? "spin" : ""} />
            </button>
            
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest"></span>
            </button>
            
            <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-[14px] text-on-surface leading-none mb-1">Dr. Rajesh Khanna</p>
                <p className="text-[11px] text-outline font-medium uppercase tracking-tight">Executive Director</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden shadow-sm">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Dr. Rajesh Khanna" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWLekNYNPSAGA-GdzIQV5F44ed9-4GhpsFx7mkWxewWvBTfCckjvaKQ93Lh14By7-ZUM6zbPoSyaAoKw8Xu7k_GUP34QnA7EdBjIIfSs4y3rNT3SgJUXWRUFxmNniTjrbTztvR1viZ9H-bQDJ46ZrXzWZAowy2ih3Q6InbY4k10wAFC-Z6xhrXkQQvkprVVNarpFOEv_MHwEMKeN_GojTKItMkYufmXgX0dNFMmi86JFZ9vOTfljTc"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 p-8 overflow-y-auto bg-surface">
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={
                <AnalyticsDashboard analyticsData={analyticsData} loading={loading} />
              } />
              <Route path="/dashboard" element={
                <AnalyticsDashboard analyticsData={analyticsData} loading={loading} />
              } />
              <Route path="/directory" element={
                <DirectoryView filtersData={analyticsData ? analyticsData.filters : null} onDraftMou={handleDraftMouFromFinder} />
              } />
              <Route path="/outreach" element={
                <OutreachAutomation preselectedIncubatorName={mouPreselectedIncubator} refreshTrigger={outreachRefreshTrigger} />
              } />
              <Route path="/pipeline-status" element={
                <RelationshipPipeline />
              } />
            </Routes>
          </div>
        </main>
      </div>

      {/* Floating AI Chat Assistant Widget */}
      <AiAssistant />
      
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

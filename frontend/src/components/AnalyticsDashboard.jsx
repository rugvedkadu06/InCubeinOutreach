import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const STATE_COORDINATES = {
  "maharashtra": { top: "60%", left: "45%" },
  "karnataka": { top: "72%", left: "52%" },
  "delhi": { top: "30%", left: "65%" },
  "assam": { top: "38%", left: "82%" },
  "gujarat": { top: "50%", left: "38%" },
  "tamil nadu": { top: "82%", left: "58%" },
  "telangana": { top: "65%", left: "58%" },
  "uttar pradesh": { top: "35%", left: "70%" },
  "west bengal": { top: "48%", left: "78%" }
};

export default function AnalyticsDashboard({ analyticsData, loading }) {
  const [meetings, setMeetings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [showAllStates, setShowAllStates] = useState(false);

  // Fetch upcoming meetings, activities, & leads
  useEffect(() => {
    const fetchAuxiliaryData = async () => {
      try {
        // Fetch Meetings
        const meetingsRes = await fetch("http://127.0.0.1:8000/api/outreach/meetings");
        if (meetingsRes.ok) {
          const data = await meetingsRes.json();
          setMeetings(data.slice(0, 5)); // show up to 5
        }

        // Fetch Pipeline Logs as Activities
        const logsRes = await fetch("http://127.0.0.1:8000/api/pipeline/logs");
        if (logsRes.ok) {
          const data = await logsRes.json();
          setActivities(data.slice(0, 5)); // show latest 5
        }

        // Fetch Leads
        const leadsRes = await fetch("http://127.0.0.1:8000/api/outreach/leads");
        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(data);
        }
      } catch (e) {
        console.error("Error fetching dashboard aux data:", e);
      } finally {
        setLoadingMeetings(false);
      }
    };
    fetchAuxiliaryData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined spin text-4xl text-primary">sync</span>
      </div>
    );
  }

  // Real backend data
  const totals = analyticsData?.totals || {
    incubators: 0,
    states: 0,
    cities: 0,
    sectors: 0
  };

  const stateDistribution = analyticsData?.state_distribution || [];
  const sectorDistribution = analyticsData?.sector_distribution || [];

  // Calculate dynamic metrics from leads
  const mousSentCount = leads.filter(l => {
    const s = (l.status || "").toLowerCase();
    return s !== "draft" && s !== "";
  }).length;

  const responsesCount = leads.filter(l => {
    const s = (l.status || "").toLowerCase();
    return ["replied", "interested", "meeting scheduled", "partnership completed"].includes(s);
  }).length;

  const meetingsCount = leads.filter(l => {
    const s = (l.status || "").toLowerCase();
    return s === "meeting scheduled";
  }).length;

  const partnershipsCount = leads.filter(l => {
    const s = (l.status || "").toLowerCase();
    return s === "partnership completed";
  }).length;

  const maxStateVal = stateDistribution.length > 0 ? Math.max(...stateDistribution.map(s => s.count)) : 100;

  // Activity icon picker
  const getActivityIcon = (stage) => {
    switch (stage?.toUpperCase()) {
      case "SCRAPER":
        return "download";
      case "CLEANER":
        return "cleaning_services";
      case "RESOLUTION":
        return "join_inner";
      case "ENRICHER":
        return "auto_awesome";
      default:
        return "send";
    }
  };

  // Calculate sector percentages dynamically based on sum of counts
  const totalSectorCount = sectorDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Greeting */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Executive Dashboard</h2>
          <p className="text-on-surface-variant font-body-md">Monitoring performance across {totals.incubators} nationwide incubators.</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-medium text-outline cursor-not-allowed flex items-center gap-2"
            disabled
            title="Date filtering not supported by backend"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 30 Days (Disabled)
          </button>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-container flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
            onClick={() => {
              window.open("http://127.0.0.1:8000/api/export/json", "_blank");
            }}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Top KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-primary/10 text-primary rounded-lg material-symbols-outlined">corporate_fare</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Total Incubators</p>
          <h3 className="text-2xl font-bold text-on-surface">{totals.incubators}</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-secondary/10 text-secondary rounded-lg material-symbols-outlined">description</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">MOUs Sent</p>
          <h3 className="text-2xl font-bold text-on-surface">{mousSentCount}</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-tertiary/10 text-tertiary rounded-lg material-symbols-outlined">group_work</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Responses Received</p>
          <h3 className="text-2xl font-bold text-on-surface">{responsesCount}</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-primary/10 text-primary rounded-lg material-symbols-outlined">event_available</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Meetings Scheduled</p>
          <h3 className="text-2xl font-bold text-on-surface">{meetingsCount}</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-green-50 text-green-600 rounded-lg material-symbols-outlined">verified</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Successful Partnerships</p>
          <h3 className="text-2xl font-bold text-on-surface">{partnershipsCount}</h3>
        </div>
      </div>

      {/* Dashboard Main Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Section: Attention & Pipeline (8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Recent Activity */}
          <div className="bento-card overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">history</span>
                <h4 className="font-title-lg text-title-lg">Recent Activity</h4>
              </div>
              <button 
                onClick={() => toast.info("Activity console logs can be viewed in the Console tab.")} 
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-outline-variant/30">
              {activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">{getActivityIcon(activity.stage)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">
                        <span className="uppercase text-xs font-bold text-primary mr-2">[{activity.stage}]</span>
                        {activity.message}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Status: <span className={`font-semibold ${activity.status === "ERROR" ? "text-error" : "text-green-600"}`}>{activity.status}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-outline font-medium">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-outline italic text-xs">
                  No recent ingestion logs found.
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Lifecycle Pipeline */}
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-title-lg text-title-lg">MOU Lifecycle Pipeline</h4>
              <a className="text-primary text-xs font-bold flex items-center gap-1 hover:underline" href="/outreach">
                Full Report 
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
            <div className="flex items-stretch gap-1 h-16">
              {/* Draft */}
              <div className="flex-1 bg-slate-100 p-3 relative pipeline-step rounded-l-lg">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Draft</p>
                <p className="text-xl font-bold">{leads.filter(l => (l.status || "Draft").toLowerCase() === "draft").length}</p>
              </div>
              {/* Sent */}
              <div className="flex-1 bg-primary/10 p-3 relative pipeline-step text-primary">
                <p className="text-[10px] text-primary font-bold uppercase">Sent</p>
                <p className="text-xl font-bold font-semibold">{leads.filter(l => ["sent", "mou sent"].includes((l.status || "").toLowerCase())).length}</p>
              </div>
              {/* Interested */}
              <div className="flex-1 bg-primary/20 p-3 relative pipeline-step text-primary">
                <p className="text-[10px] text-primary font-bold uppercase">Interested</p>
                <p className="text-xl font-bold font-semibold">{leads.filter(l => ["replied", "interested"].includes((l.status || "").toLowerCase())).length}</p>
              </div>
              {/* Meeting */}
              <div className="flex-1 bg-primary/30 p-3 relative pipeline-step text-primary">
                <p className="text-[10px] text-primary font-bold uppercase">Meeting</p>
                <p className="text-xl font-bold font-semibold">{leads.filter(l => (l.status || "").toLowerCase() === "meeting scheduled").length}</p>
              </div>
              {/* Completed */}
              <div className="flex-1 bg-primary p-3 text-white rounded-r-lg">
                <p className="text-[10px] text-white/80 font-bold uppercase">Completed</p>
                <p className="text-xl font-bold">{leads.filter(l => (l.status || "").toLowerCase() === "partnership completed").length}</p>
              </div>
            </div>
          </div>

          {/* Secondary Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Sector Distribution */}
            <div className="bento-card p-6 rounded-xl shadow-sm">
              <h4 className="font-title-lg text-title-lg mb-6">Sector Distribution</h4>
              <div className="space-y-5">
                {sectorDistribution.slice(0, 4).map((sector, idx) => {
                  const colors = ["bg-primary", "bg-secondary", "bg-tertiary-container", "bg-outline-variant"];
                  const countVal = typeof sector.count === 'number' ? sector.count : parseInt(sector.count) || 0;
                  const pct = ((countVal / totalSectorCount) * 100).toFixed(1);
                  return (
                    <div key={sector.sector || idx} className="space-y-2">
                      <div className="flex justify-between text-label-md">
                        <span className="text-on-surface font-semibold">{sector.sector}</span>
                        <span className="text-outline">{pct}% ({countVal})</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[idx % colors.length]} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {sectorDistribution.length === 0 && (
                  <p className="text-xs text-outline italic text-center py-4">No sector data available.</p>
                )}
              </div>
            </div>

            {/* Regional Performance (State distribution) */}
            <div className="bento-card p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-title-lg text-title-lg">Regional Performance</h4>
                {stateDistribution.length > 5 && (
                  <button 
                    onClick={() => setShowAllStates(!showAllStates)} 
                    className="text-primary text-[12px] font-semibold hover:underline cursor-pointer"
                  >
                    {showAllStates ? "Show Less" : "View All"}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {(showAllStates ? stateDistribution : stateDistribution.slice(0, 5)).map((state, idx) => {
                  const colors = ["bg-primary", "bg-secondary", "bg-primary"];
                  const initials = (state.state || "IN").substring(0, 2).toUpperCase();
                  return (
                    <div key={state.state || idx} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-on-surface-variant text-xs">{initials}</div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1 text-xs">
                          <p className="font-semibold">{state.state}</p>
                          <p className="text-outline">{state.count}</p>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[idx % colors.length]} rounded-full`}
                            style={{ width: `${(state.count / maxStateVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {stateDistribution.length === 0 && (
                  <p className="text-xs text-outline italic text-center py-4">No state data available.</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Section: Map & Meetings (4 columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8 flex flex-col">
          
          {/* Network Map Card (h-48 approved Stitch layout) */}
          <div className="bento-card overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/20">
              <h4 className="font-title-lg text-title-lg">Network Map</h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-surface-container-high px-2 py-0.5 rounded">Interactive</span>
            </div>

            <div className="relative h-48 bg-surface-container-low group">
              {/* Map Image Background */}
              <div 
                className="absolute inset-0 grayscale-[0.4] opacity-50 bg-cover bg-center w-full h-full" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFbURIMMKeDd4O2JgFFZHvl0dcwiGBOY3keE80AZgRQ6AKBIP12Jlb7kyUeuSoAQ_6XeAUYgm_amnoUptP5u9SrMgTnifckpkQ-9zzy1CNdOtqi-2psedWdtxc5HrVjG3_qLWpk4hh42IHfftBO65F3C7-8W8vSULgTYCOBYA4ZKgum7UR37BIgE4UdQEwnvJ4pCwgHFaR4Fp0sdKkFYFRNB6Ngfo_Ye6n-uAlk4DOttB9YHx2Lttm')" }}
              />

              {/* Dynamic State Markers Positioned on the Indian Map */}
              {stateDistribution
                .filter(s => s.state && STATE_COORDINATES[s.state.toLowerCase()] && s.count > 0)
                .map((s) => {
                  const coords = STATE_COORDINATES[s.state.toLowerCase()];
                  return (
                    <div 
                      key={s.state} 
                      className="absolute cursor-pointer hover:scale-110 transition-transform" 
                      style={{ top: coords.top, left: coords.left }}
                      title={`${s.state}: ${s.count} Incubators`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-5 h-5 bg-primary/20 rounded-full animate-ping"></div>
                        <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-lg border border-white">
                          {s.count}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
            
            <div className="p-2.5 text-center border-t border-outline-variant/60 bg-surface-container-low/20">
              <button 
                onClick={() => toast.info("Opening full interactive map panel...")}
                className="text-primary text-xs font-bold hover:underline cursor-pointer"
              >
                Open Full Map
              </button>
            </div>
            
            <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant/20">
              <p className="text-[9px] text-outline italic">
                Note: Map markers position dynamically grouped counts using frontend state-coordinate lookups.
              </p>
            </div>
          </div>

          {/* Upcoming Meetings Widget */}
          <div className="bento-card rounded-xl overflow-hidden flex-1 flex flex-col">
            <div className="p-5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <h4 className="font-title-lg text-title-lg">Upcoming Meetings</h4>
              <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {meetings.length} TOTAL
              </span>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto custom-scrollbar flex-1 max-h-[300px]">
              {meetings.length > 0 ? (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="p-3 hover:bg-surface-container-low rounded-lg transition-all border border-transparent hover:border-outline-variant flex items-start gap-4">
                    <div className="flex-shrink-0 text-center border-r border-outline-variant pr-3 min-w-[50px]">
                      <p className="text-[10px] font-bold text-primary uppercase">{meeting.time || "10:30"}</p>
                      <p className="text-[9px] font-medium text-outline uppercase">{meeting.date || "Today"}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[14px] font-bold text-on-surface leading-tight mb-1 truncate">{meeting.title || "Incubator Synch"}</h5>
                      <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">videocam</span> {meeting.meeting_link ? "Google Meet" : "Offline"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-outline italic text-xs">
                  No upcoming meetings scheduled.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Area */}
      <footer className="mt-12 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center text-outline text-label-md font-medium">
        <p className="">© 2026 Incubator Hub Management Portal. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Documentation</a>
          <a className="hover:text-primary transition-colors" href="#">Support Center</a>
        </div>
      </footer>
    </div>
  );
}

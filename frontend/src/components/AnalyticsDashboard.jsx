import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function AnalyticsDashboard({ analyticsData, loading }) {
  const [meetings, setMeetings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  // Fetch upcoming meetings & activities
  useEffect(() => {
    const fetchAuxiliaryData = async () => {
      try {
        // Fetch Meetings
        const meetingsRes = await fetch("http://127.0.0.1:8000/api/outreach/meetings");
        if (meetingsRes.ok) {
          const data = await meetingsRes.json();
          setMeetings(data.slice(0, 3)); // show top 3
        }

        // Fetch Pipeline Logs as Activities
        const logsRes = await fetch("http://127.0.0.1:8000/api/pipeline/logs");
        if (logsRes.ok) {
          const data = await logsRes.json();
          setActivities(data.slice(0, 3)); // show latest 3
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

  // Fallback data if backend database is empty
  const totals = analyticsData?.totals || {
    incubators: 842,
    states: 28,
    cities: 145,
    sectors: 12
  };

  const stateDistribution = analyticsData?.state_distribution || [
    { state: "Maharashtra", count: 184 },
    { state: "Assam", count: 62 },
    { state: "Karnataka", count: 142 }
  ];

  const sectorDistribution = analyticsData?.sector_distribution || [
    { sector: "AI / Machine Learning", count: 42 },
    { sector: "HealthTech", count: 28 },
    { sector: "AgriTech", count: 18 },
    { sector: "FinTech & Others", count: 12 }
  ];

  // Max value calculator for state bar percentages
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

  const getLogColor = (status) => {
    return status === "ERROR" ? "bg-error-container/10 text-error" : "bg-primary/10 text-primary";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Greeting */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Executive Dashboard</h2>
          <p className="text-on-surface-variant font-body-md">Monitoring performance across {totals.incubators} nationwide incubators.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-high flex items-center gap-2 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 30 Days
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
            <span className="p-2 bg-primary-fixed/20 text-primary rounded-lg material-symbols-outlined">corporate_fare</span>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> 4.2%
            </span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Total Incubators</p>
          <h3 className="text-3xl font-bold text-on-surface">{totals.incubators}</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-secondary-container/30 text-secondary rounded-lg material-symbols-outlined">description</span>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> 12
            </span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">MOUs Sent</p>
          <h3 className="text-3xl font-bold text-on-surface">124</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-tertiary-fixed/30 text-tertiary rounded-lg material-symbols-outlined">group_work</span>
            <span className="text-xs font-bold text-on-surface-variant">Active</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Active Collaborations</p>
          <h3 className="text-3xl font-bold text-on-surface">45</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-green-100/10 text-green-600 rounded-lg material-symbols-outlined">verified</span>
            <span className="text-xs font-bold text-green-600">+2</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Successful Partnerships</p>
          <h3 className="text-3xl font-bold text-on-surface">12</h3>
        </div>

        <div className="bento-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-error-container/10 text-error rounded-lg material-symbols-outlined">event</span>
            <span className="text-xs font-bold text-error">Today</span>
          </div>
          <p className="text-on-surface-variant text-label-md mb-1">Upcoming Meetings</p>
          <h3 className="text-3xl font-bold text-on-surface">{meetings.length > 0 ? meetings.length : 8}</h3>
        </div>
      </div>

      {/* Dashboard Main Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Center Analytics (8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Interactive Map Card */}
          <div className="bento-card rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h4 className="font-title-lg text-title-lg">Incubator Network Map</h4>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-on-surface-variant">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Tier 1
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-on-surface-variant">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> Tier 2
                </span>
              </div>
            </div>

            <div className="relative h-[420px] bg-surface-container-low group">
              {/* Map Image Background */}
              <div 
                className="absolute inset-0 grayscale-[0.4] opacity-80 bg-cover bg-center w-full h-full" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFbURIMMKeDd4O2JgFFZHvl0dcwiGBOY3keE80AZgRQ6AKBIP12Jlb7kyUeuSoAQ_6XeAUYgm_amnoUptP5u9SrMgTnifckpkQ-9zzy1CNdOtqi-2psedWdtxc5HrVjG3_qLWpk4hh42IHfftBO65F3C7-8W8vSULgTYCOBYA4ZKgum7UR37BIgE4UdQEwnvJ4pCwgHFaR4Fp0sdKkFYFRNB6Ngfo_Ye6n-uAlk4DOttB9YHx2Lttm')" }}
              />

              {/* Cluster Markers */}
              <div className="absolute top-[60%] left-[45%] group-hover:scale-110 transition-transform cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white">242</div>
                </div>
              </div>

              <div className="absolute top-[72%] left-[52%] cursor-pointer hover:scale-110 transition-transform">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: "1s" }}></div>
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white">184</div>
                </div>
              </div>

              <div className="absolute top-[38%] left-[82%] cursor-pointer hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white">62</div>
              </div>

              <div className="absolute top-[30%] left-[65%] cursor-pointer hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white">84</div>
              </div>

              {/* Map Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button className="w-8 h-8 bg-white border border-outline-variant rounded flex items-center justify-center text-on-surface hover:bg-surface shadow-sm cursor-pointer active:scale-95"><span className="material-symbols-outlined text-sm">add</span></button>
                <button className="w-8 h-8 bg-white border border-outline-variant rounded flex items-center justify-center text-on-surface hover:bg-surface shadow-sm cursor-pointer active:scale-95"><span className="material-symbols-outlined text-sm">remove</span></button>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Sector Distribution */}
            <div className="bento-card p-6 rounded-xl shadow-sm">
              <h4 className="font-title-lg text-title-lg mb-6">Sector Distribution</h4>
              <div className="space-y-5">
                {sectorDistribution.slice(0, 4).map((sector, idx) => {
                  const colors = ["bg-primary", "bg-secondary", "bg-tertiary-container", "bg-outline-variant"];
                  const countVal = typeof sector.count === 'number' ? sector.count : parseInt(sector.count) || 0;
                  return (
                    <div key={sector.sector || idx} className="space-y-2">
                      <div className="flex justify-between text-label-md">
                        <span className="text-on-surface font-semibold">{sector.sector}</span>
                        <span className="text-outline">{countVal}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[idx % colors.length]} rounded-full`}
                          style={{ width: `${countVal}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outreach Funnel */}
            <div className="bento-card p-6 rounded-xl shadow-sm">
              <h4 className="font-title-lg text-title-lg mb-6">Outreach Performance</h4>
              <div className="flex flex-col items-center gap-1">
                <div className="w-full bg-primary/90 h-8 rounded-t-lg flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest">Created: 842</div>
                <div className="w-[85%] bg-primary/80 h-8 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest">Sent: 612</div>
                <div className="w-[60%] bg-primary/70 h-8 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest">Interested: 245</div>
                <div className="w-[40%] bg-primary/60 h-8 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest">Meeting: 92</div>
                <div className="w-[20%] bg-primary/50 h-8 rounded-b-lg flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest">Completed: 12</div>
              </div>
              <div className="mt-4 flex justify-between px-2">
                <div className="text-center">
                  <p className="text-[10px] text-outline font-bold uppercase">Conversion</p>
                  <p className="text-title-lg text-primary">1.4%</p>
                </div>
                <div className="text-center border-l border-outline-variant pl-4">
                  <p className="text-[10px] text-outline font-bold uppercase">Avg. Time</p>
                  <p className="text-title-lg text-primary">18 Days</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Side Panel (4 columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* State Distribution */}
          <div className="bento-card p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-title-lg text-title-lg">State Distribution</h4>
              <button className="text-primary text-[12px] font-semibold hover:underline cursor-pointer">View All</button>
            </div>
            <div className="space-y-4">
              {stateDistribution.slice(0, 3).map((state, idx) => {
                const colors = ["bg-primary", "bg-secondary", "bg-primary"];
                const initials = (state.state || "IN").substring(0, 2).toUpperCase();
                return (
                  <div key={state.state || idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-on-surface-variant">{initials}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="font-body-md font-semibold">{state.state}</p>
                        <p className="text-label-md text-outline">{state.count}</p>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-low rounded-full">
                        <div 
                          className={`h-full ${colors[idx % colors.length]} rounded-full`}
                          style={{ width: `${(state.count / maxStateVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Meetings Widget */}
          <div className="bento-card rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <h4 className="font-title-lg text-title-lg">Upcoming Meetings</h4>
              <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {meetings.length > 0 ? `${meetings.length} TODAY` : "8 TODAY"}
              </span>
            </div>
            <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {meetings.length > 0 ? (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="p-3 hover:bg-surface-container-low rounded-lg transition-all border border-transparent hover:border-outline-variant flex items-start gap-4">
                    <div className="flex-shrink-0 text-center border-r border-outline-variant pr-3 min-w-[50px]">
                      <p className="text-[10px] font-bold text-primary uppercase">{meeting.meeting_time || "10:30"}</p>
                      <p className="text-[9px] font-medium text-outline uppercase">Time</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[14px] font-bold text-on-surface leading-tight mb-1 truncate">{meeting.title || "Incubator Synch"}</h5>
                      <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">videocam</span> {meeting.platform || "Google Meet"}
                      </p>
                    </div>
                    <button className="p-1 hover:bg-white rounded border border-outline-variant flex items-center justify-center self-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 hover:bg-surface-container-low rounded-lg transition-all border border-transparent hover:border-outline-variant flex items-start gap-4">
                    <div className="flex-shrink-0 text-center border-r border-outline-variant pr-3">
                      <p className="text-[10px] font-bold text-primary uppercase">10:30</p>
                      <p className="text-[10px] font-medium text-outline uppercase">AM</p>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-[14px] font-bold text-on-surface leading-tight mb-1">IIT Madras Hub Review</h5>
                      <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">videocam</span> Google Meet
                      </p>
                    </div>
                    <button className="p-1 hover:bg-white rounded border border-outline-variant flex items-center justify-center self-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
                  </div>

                  <div className="p-3 hover:bg-surface-container-low rounded-lg transition-all border border-transparent hover:border-outline-variant flex items-start gap-4">
                    <div className="flex-shrink-0 text-center border-r border-outline-variant pr-3">
                      <p className="text-[10px] font-bold text-primary uppercase">02:00</p>
                      <p className="text-[10px] font-medium text-outline uppercase">PM</p>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-[14px] font-bold text-on-surface leading-tight mb-1">NIT Silchar MOU Signing</h5>
                      <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">apartment</span> Room 402
                      </p>
                    </div>
                    <button className="p-1 hover:bg-white rounded border border-outline-variant flex items-center justify-center self-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bento-card p-6 rounded-xl shadow-sm">
            <h4 className="font-title-lg text-title-lg mb-6">Recent Ingestion Activity</h4>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-surface-container-high">
              {activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${getLogColor(activity.status)}`}>
                      <span className="material-symbols-outlined text-[12px] fill-icon font-bold">
                        {getActivityIcon(activity.stage)}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface-variant">
                      <span className="font-bold text-on-surface uppercase text-xs">{activity.stage}</span> - {activity.message}
                    </p>
                    <span className="text-[11px] text-outline font-medium">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : "Recent"}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="material-symbols-outlined text-[14px] fill-icon">send</span>
                    </div>
                    <p className="text-body-md text-on-surface-variant">MOU sent to <span className="font-bold text-on-surface">NIT Silchar</span> for Biotech program.</p>
                    <span className="text-[11px] text-outline font-medium">14 minutes ago</span>
                  </div>
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 bg-success-container/20 text-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="material-symbols-outlined text-[14px] fill-icon">check_circle</span>
                    </div>
                    <p className="text-body-md text-on-surface-variant">Partnership confirmed with <span className="font-bold text-on-surface">Kerala Startup Mission</span>.</p>
                    <span className="text-[11px] text-outline font-medium">2 hours ago</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Area */}
      <footer className="mt-12 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center text-outline text-label-md">
        <p className="">© 2024 Incubator Hub Management Portal. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Documentation</a>
          <a className="hover:text-primary transition-colors" href="#">Support Center</a>
        </div>
      </footer>
    </div>
  );
}

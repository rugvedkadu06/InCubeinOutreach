import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  MapPin,
  Building2,
  Layers,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Globe,
  Star,
  Send,
  PieChart as PieIcon,
  BarChart2,
  Target,
} from "lucide-react";

/* ── Skeleton Loaders ────────────────────────────────────────── */
function SkeletonMetrics() {
  return (
    <div className="metrics-grid">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="skeleton skeleton-text" style={{ width: "60%", height: 13 }} />
            <div className="skeleton" style={{ width: 36, height: 36 }} />
          </div>
          <div className="skeleton" style={{ height: 38, width: "50%", marginBottom: 10, borderRadius: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: "70%", height: 12 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="glass-card chart-card">
      <div className="skeleton skeleton-title" style={{ width: "45%", marginBottom: 20 }} />
      {[90, 70, 55, 40, 30, 22, 15].map((w, i) => (
        <div key={i} className="bar-wrapper">
          <div className="skeleton skeleton-text" style={{ width: 90, height: 12 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 8, width: `${w}%`, borderRadius: 99 }} />
          </div>
          <div className="skeleton skeleton-text" style={{ width: 28, height: 12 }} />
        </div>
      ))}
    </div>
  );
}

/* ── Animated KPI Card ───────────────────────────────────────── */
function MetricCard({ title, value, Icon, iconColor = "var(--primary)", trend, trendLabel, footer }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === undefined || value === null) return;
    const num = parseFloat(value);
    if (isNaN(num)) { setDisplayed(value); return; }
    const duration = 900;
    const steps = 30;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setDisplayed(num % 1 === 0 ? num : num.toFixed(1));
        clearInterval(timer);
      } else {
        setDisplayed(num % 1 === 0 ? Math.floor(current) : current.toFixed(1));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="metric-card animate-in">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <div className="metric-icon" style={{ background: `${iconColor}1A`, color: iconColor }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="metric-value">{displayed}</div>
      <div className="metric-footer">
        <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>{footer}</span>
        {trend && (
          <span className="metric-trend up" style={{ marginLeft: "auto", background: "var(--primary-light)", color: "var(--primary)" }}>
            <ArrowUpRight size={11} /> {trend}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Horizontal Bar Chart ────────────────────────────────────── */
function BarChart({ data, valueKey = "count", labelKey, maxVal, fillStyle }) {
  if (!data || data.length === 0) return (
    <div className="empty-state" style={{ padding: "32px 0" }}>
      <p>No data available</p>
    </div>
  );

  return (
    <div className="bar-chart-container">
      {data.map((row, idx) => {
        const pct = ((row[valueKey] / maxVal) * 100).toFixed(1);
        return (
          <div key={row[labelKey] || idx} className="bar-wrapper" style={{ animationDelay: `${idx * 0.06}s` }}>
            <div className="bar-label" title={row[labelKey]}>{row[labelKey]}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${pct}%`,
                  ...fillStyle,
                  transitionDelay: `${idx * 0.04}s`,
                }}
              />
            </div>
            <div className="bar-value">{row[valueKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── SVG Donut Chart ─────────────────────────────────────────── */
function DonutChart({ data }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let accumulatedPercent = 0;
  
  const colors = ["#00B59C", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "1rem", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: "130px", height: "130px", margin: "0 auto" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          {data.map((item, idx) => {
            const pct = (item.count / total) * 100;
            const strokeDash = `${pct} ${100 - pct}`;
            const strokeOffset = 100 - accumulatedPercent + 25; // 25 to start at top
            accumulatedPercent += pct;
            return (
              <circle
                key={idx}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth="4.2"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            );
          })}
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none"
        }}>
          <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>{total}</span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>Total</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "150px" }}>
        {data.slice(0, 6).map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[idx % colors.length], flexShrink: 0 }} />
              <span style={{ color: "var(--text-body)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.region}</span>
            </div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", marginLeft: "auto", paddingLeft: 8 }}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SVG Line Chart ──────────────────────────────────────────── */
function LineChart({ leads = [] }) {
  const { days, sentData, repliesData } = React.useMemo(() => {
    const daysLabel = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const sent = [0, 0, 0, 0, 0, 0, 0];
    const replies = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d.toDateString());
    }

    leads.forEach(lead => {
      if (lead.sent_at) {
        const sentDate = new Date(lead.sent_at);
        const idx = weekDates.indexOf(sentDate.toDateString());
        if (idx !== -1) {
          sent[idx]++;
        }
      }
      if (lead.reply_detected_at || ["Replied", "Meeting Scheduled"].includes(lead.status)) {
        const replyTime = lead.reply_detected_at || lead.sent_at;
        if (replyTime) {
          const replyDate = new Date(replyTime);
          const idx = weekDates.indexOf(replyDate.toDateString());
          if (idx !== -1) {
            replies[idx]++;
          }
        }
      }
    });

    return { days: daysLabel, sentData: sent, repliesData: replies };
  }, [leads]);

  const width = 450;
  const height = 180;
  const padding = 25;

  const maxVal = Math.max(...sentData, ...repliesData) || 10;

  const getPoints = (data) => {
    return data.map((val, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - (val * (height - 2 * padding)) / maxVal;
      return `${x},${y}`;
    }).join(" ");
  };

  const sentPoints = getPoints(sentData);
  const repliesPoints = getPoints(repliesData);

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = padding + r * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--border-color)"
              strokeDasharray="2 4"
            />
          );
        })}

        {days.map((day, idx) => {
          const x = padding + (idx * (width - 2 * padding)) / (days.length - 1);
          return (
            <text
              key={idx}
              x={x}
              y={height - 5}
              fill="var(--text-dim)"
              fontSize="9"
              textAnchor="middle"
              fontWeight="600"
            >
              {day}
            </text>
          );
        })}

        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={sentPoints}
        />

        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={repliesPoints}
        />

        {sentData.map((val, idx) => {
          const x = padding + (idx * (width - 2 * padding)) / (sentData.length - 1);
          const y = height - padding - (val * (height - 2 * padding)) / maxVal;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4.5"
              fill="white"
              stroke="var(--primary)"
              strokeWidth="3"
            />
          );
        })}

        {repliesData.map((val, idx) => {
          const x = padding + (idx * (width - 2 * padding)) / (repliesData.length - 1);
          const y = height - padding - (val * (height - 2 * padding)) / maxVal;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4.5"
              fill="white"
              stroke="var(--accent)"
              strokeWidth="3"
            />
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--primary)" }} />
          <span style={{ color: "var(--text-body)", fontWeight: 600 }}>Emails Dispatched</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--accent)" }} />
          <span style={{ color: "var(--text-body)", fontWeight: 600 }}>Responses Detected</span>
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Conversion Funnel Widget ────────────────────────── */
function FunnelWidget({ leads }) {
  const total = leads.length;
  const sent = leads.filter(l => l.status !== "Draft").length;
  const replied = leads.filter(l => ["Replied", "Meeting Scheduled", "Not Interested", "In Loop", "Interviewed", "Incubated"].includes(l.status)).length;
  const meetings = leads.filter(l => ["Meeting Scheduled", "Interviewed"].includes(l.status)).length;

  const getPct = (val) => {
    if (!sent) return 0;
    return Math.round((val / sent) * 100);
  };

  const stages = [
    { label: "Targeted Leads", val: total, color: "#3B82F6", width: "100%" },
    { label: "Emails Sent", val: sent, color: "var(--primary)", width: `${total ? Math.round((sent/total)*100) : 0}%` },
    { label: "Replies Received", val: replied, color: "#F59E0B", width: `${sent ? Math.round((replied/sent)*100) : 0}%` },
    { label: "Meetings Booked", val: meetings, color: "#10B981", width: `${replied ? Math.round((meetings/replied)*100) : 0}%` }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1rem" }}>
      {stages.map((stage, idx) => (
        <div key={idx} style={{ animation: `fadeSlideUp 0.35s var(--ease-out) ${idx * 0.05}s both` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-body)", marginBottom: "4px" }}>
            <span>{stage.label}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              {stage.val} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 500 }}>({idx === 0 ? "100%" : `${getPct(stage.val)}%`})</span>
            </span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "var(--bg-surface)", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: stage.width, height: "100%", background: stage.color, borderRadius: "99px", transition: "width 1s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Top Incubators Widget ───────────────────────────────────── */
function TopIncubatorsWidget({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="glass-card chart-card">
      <h3>
        <Star size={16} color="var(--warning)" style={{ marginRight: 4 }} />
        Top Ranked Incubators Leaderboard
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.slice(0, 6).map((inc, idx) => (
          <div
            key={inc.name || idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              animation: `fadeSlideUp 0.4s var(--ease-out) ${idx * 0.05}s both`,
            }}
          >
            <div style={{
              width: 28, height: 28,
              borderRadius: "50%",
              background: idx === 0 ? "linear-gradient(135deg, #F59E0B, #FCD34D)" : idx === 1 ? "linear-gradient(135deg, #94A3B8, #CBD5E1)" : idx === 2 ? "linear-gradient(135deg, #D97706, #F59E0B)" : "var(--primary-light)",
              color: idx < 3 ? "white" : "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "0.75rem", flexShrink: 0,
            }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inc.name}
              </div>
              {inc.city && (
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={10} /> {inc.city}{inc.state ? `, ${inc.state}` : ""}
                </div>
              )}
            </div>
            {inc.startups_count !== undefined && (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--primary)" }}>{inc.startups_count}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Startups</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Startup Stage Distribution Card ────────────────────────── */
function StartupStagesWidget({ data }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1"];

  return (
    <div className="glass-card chart-card">
      <h3>
        <BarChart2 size={16} style={{ color: "#10B981", marginRight: 4 }} />
        Startup Funding Stage Breakdown
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
        {data.map((item, idx) => {
          const pct = total ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={idx} style={{ animation: `fadeSlideUp 0.35s var(--ease-out) ${idx * 0.05}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-body)", marginBottom: "4px" }}>
                <span>{item.funding_stage || "Unspecified"}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                  {item.count} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 500 }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--bg-surface)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: colors[idx % colors.length], borderRadius: "99px", transition: "width 1s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Dashboard Component ────────────────────────────────── */
export default function AnalyticsDashboard({ analyticsData, loading }) {
  const [leads, setLeads] = useState([]);
  const [fetchingLeads, setFetchingLeads] = useState(true);
  const [viewMode, setViewMode] = useState("overview"); // "overview" | "incubators" | "startups"

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/outreach/leads");
        if (res.ok) {
          const data = await res.json();
          setLeads(data || []);
        }
      } catch (e) {
        console.error("Error fetching leads for dashboard analytics:", e);
      } finally {
        setFetchingLeads(false);
      }
    };
    fetchLeads();
  }, []);

  if (loading || fetchingLeads) {
    return (
      <div>
        <SkeletonMetrics />
        <div className="dashboard-grid">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (!analyticsData || !analyticsData.totals) {
    return (
      <div className="empty-state">
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--bg-surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          border: "1px solid var(--border-color)",
        }}>
          <Activity size={28} color="var(--text-dim)" />
        </div>
        <h3>No Data Found</h3>
        <p>Run the scraping pipeline to collect and analyze startup ecosystem data.</p>
      </div>
    );
  }

  const {
    totals,
    state_distribution,
    region_distribution,
    org_type_distribution,
    top_hubs,
    sector_distribution,
    top_incubators,
    startup_analytics
  } = analyticsData;

  const maxStateVal  = state_distribution?.length  > 0 ? state_distribution[0].count  : 1;
  const maxRegionVal = region_distribution?.length > 0 ? region_distribution[0].count : 1;
  const maxSectorVal = sector_distribution?.length > 0 ? sector_distribution[0].count : 1;

  // Startup analytics metrics
  const startupSectors = startup_analytics?.sector_distribution || [];
  const maxStartupSectorVal = startupSectors.length > 0 ? startupSectors[0].count : 1;

  const startupCities = startup_analytics?.city_distribution || [];
  const maxStartupCityVal = startupCities.length > 0 ? startupCities[0].count : 1;

  const startupStages = startup_analytics?.stage_distribution || [];
  const totalStartupsCount = totals.startups || (startup_analytics?.total_startups || 0);

  // Compute live campaign conversion ratio metrics
  const sentLeadsCount = leads.filter(l => l.status !== "Draft").length;
  const repliedLeadsCount = leads.filter(l => ["Replied", "Meeting Scheduled", "Not Interested", "In Loop", "Interviewed", "Incubated"].includes(l.status)).length;
  const conversionRatioVal = sentLeadsCount > 0 ? ((repliedLeadsCount / sentLeadsCount) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* View Mode Navigation Tabs */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "white",
        padding: "10px 14px",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-color)",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`btn ${viewMode === "overview" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("overview")}
            style={{ fontSize: "0.82rem", padding: "6px 14px" }}
          >
            🌟 Ecosystem Overview
          </button>
          <button
            className={`btn ${viewMode === "incubators" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("incubators")}
            style={{ fontSize: "0.82rem", padding: "6px 14px" }}
          >
            🏢 Incubators Analysis
          </button>
          <button
            className={`btn ${viewMode === "startups" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("startups")}
            style={{ fontSize: "0.82rem", padding: "6px 14px" }}
          >
            🚀 Startups Analysis
          </button>
        </div>

        <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontWeight: 600 }}>
          {viewMode === "overview" && "Combined Insights & Outreach Funnel"}
          {viewMode === "incubators" && `Deep-Dive into ${totals.incubators} Incubators`}
          {viewMode === "startups" && `Deep-Dive into ${totalStartupsCount} Startups`}
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <MetricCard
          title="Total Incubators"
          value={totals.incubators}
          Icon={ShieldCheck}
          iconColor="var(--primary)"
          footer="Active innovation hubs"
        />
        <MetricCard
          title="Total Startups"
          value={totalStartupsCount}
          Icon={Target}
          iconColor="#10B981"
          footer="Tracked & cohort startups"
        />
        <MetricCard
          title="States Covered"
          value={totals.states}
          Icon={MapPin}
          iconColor="var(--info)"
          footer="Unique Indian states"
        />
        <MetricCard
          title="Cities Covered"
          value={totals.cities}
          Icon={Building2}
          iconColor="var(--warning)"
          footer="Active urban hubs"
        />
        <MetricCard
          title="Sectors Supported"
          value={totals.sectors}
          Icon={Layers}
          iconColor="var(--accent)"
          footer="Technology verticals"
        />
        <MetricCard
          title="Campaign Conv. Ratio"
          value={`${conversionRatioVal}%`}
          Icon={Send}
          iconColor="#8B5CF6"
          footer="Outreach response rate"
        />
      </div>

      {/* ─── ECOSYSTEM OVERVIEW VIEW ───────────────────────────── */}
      {(viewMode === "overview" || viewMode === "incubators") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          
          {/* SVG Donut Chart */}
          <div className="glass-card chart-card">
            <h3>
              <PieIcon size={16} style={{ color: "var(--primary)", marginRight: 4 }} />
              Incubator Region Share (Pie/Donut)
            </h3>
            <DonutChart data={region_distribution} />
          </div>

          {/* SVG Line Graph */}
          <div className="glass-card chart-card">
            <h3>
              <TrendingUp size={16} style={{ color: "var(--accent)", marginRight: 4 }} />
              Outreach Activity & Response Trends
            </h3>
            <LineChart leads={leads} />
          </div>

          {/* Conversion Funnel */}
          <div className="glass-card chart-card">
            <h3>
              <BarChart2 size={16} style={{ color: "#F59E0B", marginRight: 4 }} />
              Campaign Conversion Funnel & Ratios
            </h3>
            <FunnelWidget leads={leads} />
          </div>

        </div>
      )}

      {/* ─── INCUBATORS DEEP DIVE VIEW ─────────────────────────── */}
      {(viewMode === "overview" || viewMode === "incubators") && (
        <div className="dashboard-grid">
          {/* Sector Distribution */}
          <div className="glass-card chart-card">
            <h3>
              <TrendingUp size={16} style={{ color: "var(--info)" }} />
              Top Incubator Sectors
            </h3>
            <BarChart
              data={sector_distribution?.slice(0, 8)}
              labelKey="sector"
              maxVal={maxSectorVal}
              fillStyle={{ background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }}
            />
          </div>

          {/* Organization Type Distribution */}
          <div className="glass-card chart-card">
            <h3>
              <Building2 size={16} style={{ color: "var(--primary)" }} />
              Incubator Organization Types
            </h3>
            <BarChart
              data={org_type_distribution}
              labelKey="organization_type"
              valueKey="count"
              maxVal={org_type_distribution?.length > 0 ? org_type_distribution[0].count : 1}
              fillStyle={{ background: "linear-gradient(90deg, #10B981, #34D399)" }}
            />
          </div>

          {/* Regional Distribution */}
          <div className="glass-card chart-card">
            <h3>
              <Globe size={16} style={{ color: "var(--accent)" }} />
              Regional Distribution
            </h3>
            <BarChart
              data={region_distribution}
              labelKey="region"
              maxVal={maxRegionVal}
              fillStyle={{ background: "linear-gradient(90deg, var(--primary), #34D399)" }}
            />
          </div>

          {/* State Distribution */}
          <div className="glass-card chart-card">
            <h3>
              <MapPin size={16} style={{ color: "var(--warning)" }} />
              Incubator Density by State
            </h3>
            <BarChart
              data={state_distribution?.slice(0, 8)}
              labelKey="state"
              maxVal={maxStateVal}
              fillStyle={{ background: "linear-gradient(90deg, #F59E0B, #FCD34D)" }}
            />
          </div>

          {/* Top Incubators Leaderboard */}
          {top_incubators && top_incubators.length > 0 && (
            <TopIncubatorsWidget data={top_incubators} />
          )}
        </div>
      )}

      {/* ─── STARTUPS DEEP DIVE VIEW ───────────────────────────── */}
      {(viewMode === "overview" || viewMode === "startups") && (
        <div style={{ marginTop: viewMode === "startups" ? "0" : "10px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              🚀 Detailed Startup Analysis
            </h3>
            <span style={{ fontSize: "0.75rem", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>
              {totalStartupsCount} Startups
            </span>
          </div>

          <div className="dashboard-grid">
            
            {/* Startup Sector Breakdown */}
            <div className="glass-card chart-card">
              <h3>
                <Layers size={16} style={{ color: "#3B82F6" }} />
                Startup Verticals & Sectors
              </h3>
              <BarChart
                data={startupSectors.slice(0, 8)}
                labelKey="sector"
                maxVal={maxStartupSectorVal || 1}
                fillStyle={{ background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }}
              />
            </div>

            {/* Startup Funding Stages */}
            <StartupStagesWidget data={startupStages} />

            {/* Startup HQ Cities */}
            <div className="glass-card chart-card">
              <h3>
                <Building2 size={16} style={{ color: "#F59E0B" }} />
                Top Startup Cities / Hubs
              </h3>
              <BarChart
                data={startupCities}
                labelKey="hq_city"
                maxVal={maxStartupCityVal || 1}
                fillStyle={{ background: "linear-gradient(90deg, #F59E0B, #FCD34D)" }}
              />
            </div>

            {/* Evaluation & Cohort Score Breakdown */}
            <div className="glass-card chart-card">
              <h3>
                <Target size={16} style={{ color: "#8B5CF6" }} />
                Startup Evaluation & Readiness
              </h3>
              <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                  <div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg Evaluation Readiness</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--primary)" }}>{totals.avg_confidence_score || 0} / 100</div>
                  </div>
                  <Star size={32} color="var(--primary)" />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                  <div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Incubator Associated</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#3B82F6" }}>{totals.incubated_startups || 0} Startups</div>
                  </div>
                  <ShieldCheck size={32} color="#3B82F6" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

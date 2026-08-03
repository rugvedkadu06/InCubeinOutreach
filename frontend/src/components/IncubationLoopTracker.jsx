import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  PlusCircle,
  Video,
  FileText,
  UserCheck,
  RefreshCw,
  X,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { toast } from "react-toastify";

export default function IncubationLoopTracker() {
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Modal states for adding milestones
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDay, setMilestoneDay] = useState(30);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/abc-defg-hij");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLoops = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lifecycle/nurture-loop/list");
      if (res.ok) {
        const data = await res.json();
        setLoops(data);
      } else {
        toast.error("Failed to load incubation nurture loop data.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error connecting to nurture loop API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoops();
  }, []);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (!milestoneTitle.trim() || !meetingDate) {
      toast.warning("Please provide a milestone title and meeting date.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/lifecycle/nurture-loop/add-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLead.lead_id,
          milestone_title: milestoneTitle,
          milestone_day: Number(milestoneDay),
          meeting_date: meetingDate,
          meeting_link: meetingLink,
          notes: notes
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success(data.message);
        setShowMilestoneModal(false);
        setMilestoneTitle("");
        setMeetingDate("");
        fetchLoops();
      } else {
        toast.error(data.detail || "Failed to add milestone.");
      }
    } catch (err) {
      toast.error("Network error scheduling milestone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
            🔄 90-Day Incubation & Partnership Nurture Loop
          </h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Maintain active engagement across the 3-month incubation cycle with automated check-ins and multi-meeting milestones.
          </p>
        </div>
        <button onClick={fetchLoops} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Loop
        </button>
      </div>

      {/* Incubation Loop Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div className="card" style={{ padding: "16px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Active Loop Entities</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>{loops.length}</div>
        </div>

        <div className="card" style={{ padding: "16px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Incubation Standard Cycle</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10B981", marginTop: "4px" }}>90 Days</div>
        </div>

        <div className="card" style={{ padding: "16px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Scheduled Milestones</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#8B5CF6", marginTop: "4px" }}>
            {loops.reduce((acc, l) => acc + (l.milestones ? l.milestones.length : 0), 0)}
          </div>
        </div>

        <div className="card" style={{ padding: "16px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg. Loop Progress</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F59E0B", marginTop: "4px" }}>
            {loops.length > 0 ? Math.round(loops.reduce((acc, l) => acc + l.loop_progress_pct, 0) / loops.length) : 0}%
          </div>
        </div>
      </div>

      {/* Main Entities Loop Table */}
      <div className="card" style={{ padding: "20px", background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
          📋 Ecosystem Entities Active in Nurture Loop ({loops.length})
        </h3>

        {loading ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Loading nurture loop entities...</p>
        ) : loops.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>No active entities found in the nurture loop.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left", background: "var(--bg-surface)" }}>
                  <th style={{ padding: "10px" }}>Entity Name</th>
                  <th style={{ padding: "10px" }}>Stage</th>
                  <th style={{ padding: "10px" }}>3-Month Loop Progress</th>
                  <th style={{ padding: "10px" }}>Days Remaining</th>
                  <th style={{ padding: "10px" }}>Milestones & Meetings</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loops.map((item) => (
                  <tr key={item.lead_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: 700 }}>
                      <div>{item.name}</div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{item.email}</span>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px", borderRadius: "10px", background: "#FEF3C7", color: "#92400E" }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", minWidth: "160px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: "4px", fontWeight: 600 }}>
                        <span>Day {item.days_elapsed} of 90</span>
                        <span>{item.loop_progress_pct}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.loop_progress_pct}%`, background: "linear-gradient(90deg, #10B981, #0284C7)", borderRadius: "3px" }} />
                      </div>
                    </td>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: item.days_remaining < 15 ? "#EF4444" : "var(--text-primary)" }}>
                      {item.days_remaining} days
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      {item.milestones && item.milestones.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {item.milestones.map((m, i) => (
                            <span key={i} style={{ fontSize: "0.72rem", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", color: "var(--text-body)" }}>
                              📅 {m.title} ({m.date})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>No milestone scheduled</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setSelectedLead(item);
                          setShowMilestoneModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: "0.75rem", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <PlusCircle size={12} /> Add Milestone
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Milestone Modal */}
      {showMilestoneModal && selectedLead && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: "white", width: "100%", maxWidth: "520px",
            borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                  📅 Schedule Incubation Milestone Meeting
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {selectedLead.name} ({selectedLead.email})
                </span>
              </div>
              <button onClick={() => setShowMilestoneModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Milestone Day Cadence:
                </label>
                <select
                  value={milestoneDay}
                  onChange={(e) => setMilestoneDay(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}
                >
                  <option value={7}>Day 7: Initial Alignment & Needs Assessment</option>
                  <option value={30}>Day 30: Progress Check-in & Resource Review</option>
                  <option value={60}>Day 60: Mid-Term Incubation Review</option>
                  <option value={90}>Day 90: Final MoU & Graduation Review</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Milestone Title:
                </label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. Mid-term Progress Review Meeting"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Meeting Date:
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Google Meet / Video Link:
                </label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                  {saving ? "Scheduling..." : "Schedule Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

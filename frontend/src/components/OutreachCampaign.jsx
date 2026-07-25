import React, { useState, useEffect } from "react";
import { Send, Users, Mail, CheckCircle2, AlertCircle, RefreshCw, Terminal, Layers } from "lucide-react";

export default function OutreachCampaign() {
  const [batchSize, setBatchSize] = useState(100);
  const [campaignName, setCampaignName] = useState("Incubation Guidance Outreach");
  const [subject, setSubject] = useState("Invitation for Mentorship & Incubation Program - {{startup_name}}");
  const [templateBody, setTemplateBody] = useState(
    `Dear {{startup_name}} Team,\n\nWe came across your innovation in {{sector}} based out of {{city}}. Our ecosystem platform is connecting high-potential startups with guidance, incubator support, and growth capital.\n\nWe would love to schedule a brief interaction to explore how we can support your startup's journey.\n\nPlease let us know your availability for a quick introductory call.\n\nBest regards,\nInCubeIn Outreach Team`
  );
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [activeLogs, setActiveLogs] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/outreach/campaigns");
      const data = await res.json();
      if (data.status === "success") {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    }
  };

  const fetchLogs = async (cId) => {
    if (!cId) return;
    try {
      const res = await fetch(`/api/outreach/campaigns/${cId}/logs`);
      const data = await res.json();
      if (data.status === "success") {
        setActiveLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(() => {
      fetchCampaigns();
      if (selectedCampaignId) {
        fetchLogs(selectedCampaignId);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedCampaignId]);

  const handleLaunchCampaign = async () => {
    if (!campaignName.trim() || !subject.trim() || !templateBody.trim()) {
      setStatusMsg("Please complete all campaign fields before launching.");
      return;
    }

    setLoading(true);
    setStatusMsg(`Launching automated outreach for ${batchSize} startups...`);
    try {
      const res = await fetch("/api/outreach/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          batch_size: parseInt(batchSize),
          subject: subject,
          template_body: templateBody
        })
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setStatusMsg(`Campaign launched successfully! ID: ${data.campaign_id}`);
        setSelectedCampaignId(data.campaign_id);
        fetchCampaigns();
        fetchLogs(data.campaign_id);
      } else {
        setStatusMsg(`Failed to launch campaign: ${data.detail || "Server error"}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Error connecting to server backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px", borderRadius: "12px", borderLeft: "4px solid #00f2fe" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <Send style={{ color: "#00f2fe" }} size={28} />
              Startup Outreach Campaign Engine
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: "8px 0 0 0", fontSize: "14px" }}>
              Automated batch mailing engine to connect with startups for guidance, incubation, and ecosystem support.
            </p>
          </div>
          <button 
            onClick={fetchCampaigns} 
            className="action-btn icon-btn" 
            title="Refresh Status"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column: Campaign Configuration Form */}
        <div className="glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            <Mail size={20} style={{ color: "#4facfe" }} /> Campaign Setup
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Campaign Name */}
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Incubation Guidance Outreach"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: "#fff"
                }}
              />
            </div>

            {/* Batch Size Selector */}
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Batch Outreach Target Size
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setBatchSize(100)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: batchSize === 100 ? "2px solid #00f2fe" : "1px solid rgba(255,255,255,0.1)",
                    background: batchSize === 100 ? "rgba(0, 242, 254, 0.1)" : "rgba(0,0,0,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "15px" }}>100 Startups</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Initial Batch Target (Connect with ~10)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchSize(800)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: batchSize === 800 ? "2px solid #4facfe" : "1px solid rgba(255,255,255,0.1)",
                    background: batchSize === 800 ? "rgba(79, 172, 254, 0.1)" : "rgba(0,0,0,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "15px" }}>800+ Startups</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Scalable Dataset (Connect with ~100-120)
                  </div>
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: "#fff"
                }}
              />
            </div>

            {/* Template Body */}
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email Template Body (Supports <code style={{ color: "#00f2fe" }}>{"{{startup_name}}"}</code>, <code style={{ color: "#00f2fe" }}>{"{{city}}"}</code>, <code style={{ color: "#00f2fe" }}>{"{{sector}}"}</code>)
              </label>
              <textarea
                rows={8}
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "13px"
                }}
              />
            </div>

            {/* Launch Button */}
            <button
              onClick={handleLaunchCampaign}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                color: "#000",
                fontWeight: "bold",
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 4px 15px rgba(0, 242, 254, 0.3)"
              }}
            >
              {loading ? <RefreshCw className="spin" size={18} /> : <Send size={18} />}
              Launch {batchSize} Startups Outreach Campaign
            </button>

            {statusMsg && (
              <div style={{
                padding: "10px 14px",
                borderRadius: "6px",
                background: "rgba(0, 242, 254, 0.08)",
                border: "1px solid rgba(0, 242, 254, 0.2)",
                color: "#00f2fe",
                fontSize: "13px"
              }}>
                {statusMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Campaigns List & Progress Tracking */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Active / Previous Campaigns */}
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "12px" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={20} style={{ color: "#00f2fe" }} /> Launched Campaigns History
            </h3>

            {campaigns.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No outreach campaigns launched yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
                {campaigns.map((c) => {
                  const progressPct = c.batch_size > 0 ? Math.min(100, Math.round(((c.sent_count || 0) / c.batch_size) * 100)) : 0;
                  const isSelected = selectedCampaignId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCampaignId(c.id);
                        fetchLogs(c.id);
                      }}
                      style={{
                        padding: "14px",
                        borderRadius: "8px",
                        border: isSelected ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.08)",
                        background: isSelected ? "rgba(0,242,254,0.05)" : "rgba(0,0,0,0.2)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>{c.name}</span>
                        <span style={{
                          fontSize: "12px",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: c.status === "Completed" ? "rgba(46, 213, 115, 0.15)" : "rgba(255, 171, 0, 0.15)",
                          color: c.status === "Completed" ? "#2ed573" : "#ffab00",
                          border: `1px solid ${c.status === "Completed" ? "#2ed573" : "#ffab00"}`
                        }}>
                          {c.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>
                        <span>Target: {c.batch_size} Startups</span>
                        <span>Dispatched: {c.sent_count || 0} / {c.batch_size} ({progressPct}%)</span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #00f2fe, #4facfe)", transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-time Dispatch Logs */}
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "12px", flex: 1 }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <Terminal size={20} style={{ color: "#2ed573" }} /> Dispatch Logs
            </h3>

            {activeLogs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                Select a campaign above to view live email dispatch logs.
              </p>
            ) : (
              <div style={{
                background: "rgba(0,0,0,0.5)",
                borderRadius: "8px",
                padding: "12px",
                fontFamily: "monospace",
                fontSize: "12px",
                maxHeight: "280px",
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.08)"
              }}>
                {activeLogs.map((log, index) => (
                  <div key={index} style={{ marginBottom: "6px", color: log.status === "Sent" ? "#2ed573" : "#ff4757" }}>
                    [{log.timestamp ? log.timestamp.substring(11, 19) : "LOG"}] Dispatched to <strong>{log.startup_name}</strong> ({log.email}) - {log.status}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

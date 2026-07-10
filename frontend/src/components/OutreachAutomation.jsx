import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

// Academic Collaboration Template text generator
const getAcademicMouText = (data) => `MEMORANDUM OF UNDERSTANDING
FOR STRATEGIC COOPERATION AND ACADEMIC COLLABORATION

This Memorandum of Understanding (MOU) is entered into this ${data.date || "October 24, 2023"} by and between:

THE FIRST PARTY:
Incubator Hub, having its principal place of business at Global Innovation Center, Tech City (hereafter referred to as "The Service Provider").

AND

THE SECOND PARTY:
${data.partyBName || "[NIT Silchar Innovation Hub]"}, located at ${data.location || "[Cachar, Assam]"} (hereafter referred to as "The Partner").

1. OBJECTIVE
The primary objective of this partnership is to establish a framework for collaboration between The Service Provider and The Partner to foster a startup ecosystem, provide mentorship, and grant access to specialized capital resources for regional entrepreneurs.

2. SCOPE OF COOPERATION
The parties agree to cooperate in the following areas:
- Joint organization of hackathons and incubation cohorts in the fields of: ${data.targetSectors || "DeepTech, AI/ML, SaaS"}.
- Direct pipeline integration for Series A funding readiness.
- Access to proprietary dashboard management tools provided by Incubator Hub.
- Mutual recognition as "Strategic Innovation Partners" on all public communication.

3. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality regarding proprietary data, startup metrics, and strategic roadmaps shared during the term of this engagement.

4. DURATION
This MOU is valid for a period of ${data.duration || "3 Years"} and may be extended by mutual written agreement.

IN WITNESS WHEREOF, the Parties hereto have signed and executed this Memorandum of Understanding on the date and year first written above.`;

export default function OutreachAutomation({ preselectedIncubatorName, refreshTrigger }) {
  // Tab State
  const [activeTab, setActiveTab] = useState("generator"); // "generator", "controls", "leads", "console"

  // Lead and CRM state
  const [leads, setLeads] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [incubators, setIncubators] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [checkingReplies, setCheckingReplies] = useState(false);
  const [syncInterval, setSyncInterval] = useState(30);

  // Lead search & filtering
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [leadSelectedStatus, setLeadSelectedStatus] = useState("");
  const [leadsCurrentPage, setLeadsCurrentPage] = useState(1);
  const leadsItemsPerPage = 10;
  
  // Console logs
  const [terminalLogs, setTerminalLogs] = useState([
    { time: new Date().toLocaleTimeString(), src: "SYSTEM", msg: "Outreach & auto-scheduling engine initialized." }
  ]);

  // Lead details sidebar inside the tab
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);
  const [leadNotesInput, setLeadNotesInput] = useState("");
  
  // OAuth configuration
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [oauthAuthorized, setOauthAuthorized] = useState(true);

  // Meeting scheduler states
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("11:00 AM");
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  // Stepped Form states (Stitch design Screen 3)
  const [selectedIncName, setSelectedIncName] = useState("NIT Silchar Innovation Hub");
  const [selectedLocation, setSelectedLocation] = useState("Assam, India");
  const [recipientEmail, setRecipientEmail] = useState("partnerships@nits.ac.in");
  const [emailSubject, setEmailSubject] = useState("Partnership MOU: Incubator Hub x NIT Silchar");
  const [focusAreas, setFocusAreas] = useState("DeepTech, AI/ML, SaaS");
  const [duration, setDuration] = useState("3 Years");
  const [executionDate, setExecutionDate] = useState("2023-10-24");
  const [trackEmails, setTrackEmails] = useState(true);

  // Drawing signature pad ref & drawing state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  // Fetch all leads, meetings, events
  const fetchLeads = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetingsAndEvents = async () => {
    try {
      const meetingsRes = await fetch("http://127.0.0.1:8000/api/outreach/meetings");
      if (meetingsRes.ok) {
        const data = await meetingsRes.json();
        setMeetings(data);
      }

      const eventsRes = await fetch("http://127.0.0.1:8000/api/outreach/calendar-events");
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setExternalEvents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIncubators = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/incubators?limit=10000");
      if (res.ok) {
        const data = await res.json();
        setIncubators(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/config");
      if (res.ok) {
        const data = await res.json();
        setSyncInterval(data.sync_interval || 30);
      }

      const oauthRes = await fetch("http://127.0.0.1:8000/api/outreach/oauth-status");
      if (oauthRes.ok) {
        const data = await oauthRes.json();
        setOauthConfigured(data.configured);
        setOauthAuthorized(data.authorized);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLeads(), fetchMeetingsAndEvents(), fetchIncubators(), fetchConfig()]);
      setLoading(false);
    };
    init();
  }, [refreshTrigger]);

  // Handle incubator select change
  useEffect(() => {
    if (incubators.length > 0) {
      let matched = null;
      if (preselectedIncubatorName) {
        matched = incubators.find(inc =>
          inc.name.toLowerCase().includes(preselectedIncubatorName.toLowerCase())
        );
      } else {
        matched = incubators.find(inc => inc.name.includes("Silchar") || inc.name.includes("NIT"));
      }

      if (matched) {
        setSelectedIncName(matched.name);
        setSelectedLocation(`${matched.city ? matched.city + ", " : ""}${matched.state}`);
        setRecipientEmail(matched.email || "partnerships@nits.ac.in");
        setEmailSubject(`Partnership MOU: Incubator Hub x ${matched.name}`);
        setFocusAreas(matched.organization_type || "DeepTech, AI/ML, SaaS");
      }
    }
  }, [incubators, preselectedIncubatorName]);

  // Lead update notes
  const handleUpdateNotes = async (leadId) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/leads/update-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, notes: leadNotesInput })
      });
      if (res.ok) {
        toast.success("Notes saved.");
        fetchLeads();
      }
    } catch (e) {
      toast.error("Failed to save notes.");
    }
  };

  // Schedule meeting
  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!selectedLeadForMeeting) return;
    setSchedulingMeeting(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/schedule-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLeadForMeeting.id,
          date: meetingDate,
          time: meetingTime
        })
      });
      if (res.ok) {
        toast.success("Meeting scheduled on Google Calendar.");
        setSelectedLeadForMeeting(null);
        fetchMeetingsAndEvents();
        fetchLeads();
      } else {
        toast.error("Failed to schedule meeting.");
      }
    } catch (e) {
      toast.error("Network error scheduling meeting.");
    } finally {
      setSchedulingMeeting(false);
    }
  };

  // Check replies
  const handleCheckReplies = async () => {
    setCheckingReplies(true);
    addLog("OUTREACH", "Scanning connected inbox for reply emails...");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/check-replies", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        addLog("OUTREACH", `Inbox scan complete: ${data.message}`);
        fetchLeads();
      }
    } catch (e) {
      toast.error("Failed to check replies.");
    } finally {
      setCheckingReplies(false);
    }
  };

  // Reset CRM
  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all campaign leads?")) return;
    setResetting(true);
    addLog("SYSTEM", "Resetting all outreach campaign pipelines...");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/reset", { method: "POST" });
      if (res.ok) {
        toast.success("Outreach campaigns reset.");
        addLog("SYSTEM", "Pipeline database table cleared.");
        fetchLeads();
        fetchMeetingsAndEvents();
      }
    } catch (e) {
      toast.error("Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  // Google Calendar Auth
  const handleAuthorizeCalendar = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/authorize");
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.open(data.url, "_blank");
        }
      }
    } catch (e) {
      toast.error("Failed to initiate OAuth.");
    }
  };

  // Send MOU
  const handleSendMou = async () => {
    setLoading(true);
    addLog("OUTREACH", `Sending MOU document email to ${recipientEmail}...`);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/mou/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incubator_name: selectedIncName,
          incubator_email: recipientEmail,
          party_b_name: selectedIncName,
          party_b_email: recipientEmail,
          mou_title: "Memorandum of Understanding",
          mou_text: getAcademicMouText({
            date: executionDate,
            incubatorName: selectedIncName,
            location: selectedLocation,
            partyBName: selectedIncName,
            partyBEmail: recipientEmail,
            duration: duration,
            targetSectors: focusAreas
          })
        })
      });

      if (res.ok) {
        toast.success("MOU email generated and transmitted successfully!");
        addLog("OUTREACH", `SUCCESS: MOU sent to ${selectedIncName} (${recipientEmail})`);
        // Add as a lead if not already
        const matchedInc = incubators.find(i => i.name === selectedIncName);
        if (matchedInc) {
          await fetch("http://127.0.0.1:8000/api/outreach/add-lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              incubator_id: matchedInc.id,
              incubator_name: matchedInc.name,
              email: recipientEmail
            })
          });
        }
        fetchLeads();
      } else {
        toast.error("Failed to send MOU.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error sending MOU.");
    } finally {
      setLoading(false);
    }
  };

  // Sync Interval Change
  const handleSyncIntervalChange = async (newVal) => {
    setSyncInterval(newVal);
    try {
      await fetch("http://127.0.0.1:8000/api/outreach/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_interval: newVal })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Add Terminal Log Helper
  const addLog = (src, msg) => {
    setTerminalLogs(prev => [
      { time: new Date().toLocaleTimeString(), src, msg },
      ...prev.slice(0, 49)
    ]);
  };

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.incubator_name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearchQuery.toLowerCase());
    const matchesStatus = leadSelectedStatus ? lead.status === leadSelectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  // Pagination Math
  const totalLeadsPages = Math.ceil(filteredLeads.length / leadsItemsPerPage) || 1;
  const currentLeads = filteredLeads.slice(
    (leadsCurrentPage - 1) * leadsItemsPerPage,
    leadsCurrentPage * leadsItemsPerPage
  );

  // Digital Signature Canvas Operations
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#004ac6";
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawingSignature = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
  };

  const adoptSignature = () => {
    setSignatureSaved(true);
    toast.success("Digital signature adopted successfully!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">MOU & Outreach Automation</h2>
          <p className="text-on-surface-variant font-body-md">Draft, customize, and transmit legal partnership documents in minutes.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-surface-container border border-outline-variant/60 rounded-xl p-1 gap-1">
          <button 
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "generator" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >
            MOU Generator
          </button>
          <button 
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "leads" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >
            Active Leads
          </button>
          <button 
            onClick={() => setActiveTab("controls")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "controls" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >
            Campaign Controls
          </button>
          <button 
            onClick={() => setActiveTab("console")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "console" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >
            Console & Events
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Controls & Settings */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Step 1: Select Incubator */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-title-lg text-title-lg text-on-surface">Select Incubator</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Institution Name</label>
                  <select 
                    value={selectedIncName}
                    onChange={(e) => {
                      const matched = incubators.find(i => i.name === e.target.value);
                      if (matched) {
                        setSelectedIncName(matched.name);
                        setSelectedLocation(`${matched.city ? matched.city + ", " : ""}${matched.state}`);
                        setRecipientEmail(matched.email || "partnerships@nits.ac.in");
                        setEmailSubject(`Partnership MOU: Incubator Hub x ${matched.name}`);
                        setFocusAreas(matched.organization_type || "DeepTech, AI/ML, SaaS");
                      } else {
                        setSelectedIncName(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  >
                    <option value="">Select an incubator...</option>
                    {incubators.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                  </select>
                </div>
                <div className="p-4 bg-surface-container-low rounded-lg space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Location:</span>
                    <span className="font-bold text-on-surface">{selectedLocation}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Contact:</span>
                    <span className="font-bold text-on-surface">{recipientEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: MOU Execution & Signature */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-title-lg text-title-lg text-on-surface">MOU Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Execution Date</label>
                  <input 
                    type="date" 
                    value={executionDate}
                    onChange={(e) => setExecutionDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Duration</label>
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  >
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                    <option value="5 Years">5 Years</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Focus Areas</label>
                <input 
                  type="text" 
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  placeholder="e.g. DeepTech, AgriTech" 
                  className="w-full px-4 py-2 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              
              <div className="pt-4 border-t border-outline-variant">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Digital Signature Pad</label>
                <div className="relative w-full h-32 bg-surface-container-low border border-dashed border-outline-variant rounded-lg overflow-hidden flex items-center justify-center">
                  <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawingSignature}
                    onMouseLeave={stopDrawingSignature}
                    width={350}
                    height={120}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                  />
                  {!signatureSaved && (
                    <span className="relative text-on-surface-variant/40 pointer-events-none font-medium text-sm">Draw Signature Here</span>
                  )}
                  {signatureSaved && (
                    <span className="relative text-primary pointer-events-none font-bold text-sm bg-white/95 px-3 py-1 rounded shadow-sm">Signature Adopted</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button onClick={clearCanvas} className="py-2 text-xs font-bold border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">Clear</button>
                  <button onClick={() => toast.info("Use the canvas to draw signature directly.")} className="py-2 text-xs font-bold border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">Upload</button>
                  <button onClick={adoptSignature} className="py-2 text-xs font-bold bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer">Adopt</button>
                </div>
              </div>
            </div>

            {/* Step 3: Outreach Settings */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-title-lg text-title-lg text-on-surface">Outreach Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Recipient Email</label>
                  <input 
                    type="email" 
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Email Subject</label>
                  <input 
                    type="text" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="pt-4 border-t border-outline-variant">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={trackEmails}
                      onChange={(e) => setTrackEmails(e.target.checked)}
                      className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
                    />
                    <span className="text-body-md text-on-surface-variant group-hover:text-on-surface">Track email opens and clicks</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSendMou}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/95 active:scale-[0.99] transition-all flex items-center justify-center gap-3 group cursor-pointer"
            >
              <span>Send MOU via Email</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
            </button>
          </div>

          {/* Right Column: Document Editor */}
          <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-[700px]">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg flex flex-col h-full">
              {/* Editor Header */}
              <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined fill-icon">description</span>
                  </div>
                  <div>
                    <h3 className="font-title-lg text-[14px] text-on-surface leading-tight">MOU_Draft_{selectedIncName?.replace(/\s+/g, "_")}.docx</h3>
                    <p className="text-[11px] text-on-surface-variant">Template: Academic Collaboration</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toast.info("PDF preview generation requested.")} className="px-3 py-1.5 text-[12px] font-bold text-on-surface-variant hover:bg-surface-container-high rounded transition-all cursor-pointer">Preview PDF</button>
                  <button onClick={() => toast.success("Document downloaded.")} className="px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/5 rounded transition-all cursor-pointer">Download</button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-6 py-2 border-b border-outline-variant flex items-center gap-4 bg-white">
                <div className="flex items-center gap-1 border-r pr-4 border-outline-variant">
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">undo</span></button>
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">redo</span></button>
                </div>
                <div className="flex items-center gap-1 border-r pr-4 border-outline-variant">
                  <select className="text-[12px] border-none bg-transparent font-medium py-1 px-2 hover:bg-surface-container-low rounded outline-none cursor-pointer">
                    <option>Normal text</option>
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                  </select>
                  <select className="text-[12px] border-none bg-transparent font-medium py-1 px-2 hover:bg-surface-container-low rounded outline-none cursor-pointer">
                    <option>Inter</option>
                    <option>Roboto</option>
                    <option>Merriweather</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 border-r pr-4 border-outline-variant">
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">format_underlined</span></button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">format_align_left</span></button>
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">format_align_center</span></button>
                  <button className="p-1.5 hover:bg-surface-container-low rounded cursor-pointer"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                </div>
              </div>

              {/* Document Canvas */}
              <div className="flex-1 bg-surface-container-low p-10 overflow-y-auto editor-container">
                <div className="max-w-[650px] mx-auto bg-white shadow-lg p-16 min-h-[900px] text-[#1a1a1a] relative">
                  <div className="absolute top-16 right-16 opacity-10 grayscale">
                    <div className="w-12 h-12 bg-black rounded-lg"></div>
                  </div>
                  <h1 className="text-center font-bold text-xl mb-12 underline uppercase tracking-tight">Memorandum of Understanding</h1>
                  <div className="space-y-6 text-sm leading-relaxed text-justify">
                    <p>This Memorandum of Understanding (MOU) is entered into this <span 
                      onClick={() => {
                        const dateVal = prompt("Update Execution Date:", executionDate);
                        if (dateVal) setExecutionDate(dateVal);
                      }}
                      className="bg-primary-fixed/30 px-2 py-0.5 rounded font-bold border-b border-primary text-primary-fixed-dim hover:bg-primary-fixed/50 transition-colors" 
                      style={{ cursor: "pointer" }}
                    >[Date: {executionDate}]</span> by and between:</p>
                    
                    <div className="pl-4 border-l-2 border-outline-variant space-y-4 italic">
                      <p><strong>Incubator Hub</strong>, having its principal place of business at Global Innovation Center, Tech City, hereafter referred to as "The Service Provider".</p>
                      <p>AND</p>
                      <p><strong><span 
                        onClick={() => {
                          const nameVal = prompt("Update Partner Name:", selectedIncName);
                          if (nameVal) setSelectedIncName(nameVal);
                        }}
                        className="bg-primary-fixed/30 px-2 py-0.5 rounded font-bold border-b border-primary text-primary-fixed-dim hover:bg-primary-fixed/50 transition-colors" 
                        style={{ cursor: "pointer" }}
                      >[Incubator Name: {selectedIncName}]</span></strong>, located at <span 
                        onClick={() => {
                          const locVal = prompt("Update Location:", selectedLocation);
                          if (locVal) setSelectedLocation(locVal);
                        }}
                        className="bg-primary-fixed/30 px-2 py-0.5 rounded font-bold border-b border-primary text-primary-fixed-dim hover:bg-primary-fixed/50 transition-colors" 
                        style={{ cursor: "pointer" }}
                      >[Location: {selectedLocation}]</span>, hereafter referred to as "The Partner".</p>
                    </div>
                    
                    <p className="font-bold uppercase mt-8">1. Objective</p>
                    <p>The primary objective of this partnership is to establish a framework for collaboration between The Service Provider and The Partner to foster a startup ecosystem, provide mentorship, and grant access to specialized capital resources for regional entrepreneurs.</p>
                    
                    <p className="font-bold uppercase mt-8">2. Scope of Cooperation</p>
                    <p>The parties agree to cooperate in the following areas:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Joint organization of hackathons and incubation cohorts in the focus areas of: <span 
                        onClick={() => {
                          const focusVal = prompt("Update Focus Areas:", focusAreas);
                          if (focusVal) setFocusAreas(focusVal);
                        }}
                        className="bg-primary-fixed/30 px-2 py-0.5 rounded font-bold border-b border-primary text-primary-fixed-dim hover:bg-primary-fixed/50 transition-colors" 
                        style={{ cursor: "pointer" }}
                      >[Focus: {focusAreas}]</span></li>
                      <li>Direct pipeline integration for Series A funding readiness.</li>
                      <li>Access to proprietary dashboard management tools provided by Incubator Hub.</li>
                      <li>Mutual recognition as "Strategic Innovation Partners" on all public communication.</li>
                    </ul>
                    
                    <p className="font-bold uppercase mt-8">3. Confidentiality</p>
                    <p>Both parties agree to maintain strict confidentiality regarding proprietary data, startup metrics, and strategic roadmaps shared during the term of this engagement.</p>
                    
                    <div className="grid grid-cols-2 gap-12 mt-20 pt-12">
                      <div className="border-t border-black pt-4">
                        <p className="font-bold">Authorized Signatory</p>
                        <p className="text-xs text-on-surface-variant">Incubator Hub</p>
                      </div>
                      <div className="border-t border-black pt-4">
                        <p className="font-bold">Authorized Signatory</p>
                        <p className="text-xs text-on-surface-variant">{selectedIncName || "The Partner"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "leads" && (
        <div className="grid grid-cols-12 gap-8">
          {/* Leads List (8 columns) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bento-card p-6 rounded-xl shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="font-title-lg text-title-lg">📋 Campaign Outreach Leads</h3>
                
                {/* Search / Filters */}
                <div className="flex gap-3 w-full md:w-auto">
                  <input 
                    type="text"
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    placeholder="Search leads..."
                    className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm w-full md:w-48 outline-none text-on-surface"
                  />
                  <select
                    value={leadSelectedStatus}
                    onChange={(e) => setLeadSelectedStatus(e.target.value)}
                    className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none text-on-surface"
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Replied">Replied</option>
                    <option value="Meeting Scheduled">Meeting Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Incubator</th>
                      <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Email</th>
                      <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Status</th>
                      <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant text-center">Score</th>
                      <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {currentLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-surface-container/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-sm text-on-surface">{lead.incubator_name}</div>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-on-surface-variant">{lead.email}</td>
                        <td className="py-3.5 px-4 text-sm">
                          <select
                            value={lead.status}
                            onChange={async (e) => {
                              try {
                                const res = await fetch("http://127.0.0.1:8000/api/outreach/leads/update-status", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ lead_id: lead.id, status: e.target.value })
                                });
                                if (res.ok) {
                                  toast.success(`Status updated to ${e.target.value}`);
                                  fetchLeads();
                                }
                              } catch (err) {
                                toast.error("Failed to update status.");
                              }
                            }}
                            className="bg-transparent border-none text-xs font-bold text-primary outline-none focus:ring-0 cursor-pointer"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Replied">Replied</option>
                            <option value="Meeting Scheduled">Meeting Scheduled</option>
                            <option value="Not Interested">Not Interested</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-xs">{lead.lead_score || 0}</span>
                            <div className="w-12 h-1 bg-surface-container-high rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${lead.lead_score || 0}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {lead.status === "Draft" && (
                              <button 
                                onClick={async () => {
                                  try {
                                    const res = await fetch("http://127.0.0.1:8000/api/outreach/send-email", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ lead_id: lead.id })
                                    });
                                    if (res.ok) {
                                      toast.success("Email Invitation Sent!");
                                      fetchLeads();
                                    }
                                  } catch (err) {
                                    toast.error("Failed to send invitation.");
                                  }
                                }}
                                className="px-2 py-1 text-xs font-bold bg-primary text-white rounded hover:bg-primary-container cursor-pointer"
                              >
                                Send Invite
                              </button>
                            )}
                            {lead.status === "Replied" && (
                              <button 
                                onClick={() => {
                                  setSelectedLeadForMeeting(lead);
                                  setMeetingDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
                                }}
                                className="px-2 py-1 text-xs font-bold bg-secondary text-white rounded hover:bg-secondary/90 cursor-pointer"
                              >
                                Schedule Meet
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedLeadForDetail(lead);
                                setLeadNotesInput(lead.notes || "");
                              }}
                              className="px-2 py-1 text-xs font-bold border border-outline-variant rounded hover:bg-surface-container-high cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-outline italic">No campaign leads found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalLeadsPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-outline-variant">
                  <span className="text-xs text-outline font-medium">Page {leadsCurrentPage} of {totalLeadsPages}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLeadsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={leadsCurrentPage === 1}
                      className="px-2.5 py-1 text-xs border border-outline-variant rounded hover:bg-surface shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setLeadsCurrentPage(p => Math.min(totalLeadsPages, p + 1))}
                      disabled={leadsCurrentPage === totalLeadsPages}
                      className="px-2.5 py-1 text-xs border border-outline-variant rounded hover:bg-surface shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead Details Side Drawer inside the tab (4 columns) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {selectedLeadForDetail ? (
              <div className="bento-card p-6 rounded-xl shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-title-lg text-title-lg text-on-surface">Lead Information</h3>
                  <button onClick={() => setSelectedLeadForDetail(null)} className="text-outline hover:text-on-surface cursor-pointer">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Institution</label>
                    <span className="font-bold text-on-surface text-base">{selectedLeadForDetail.incubator_name}</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Status</label>
                    <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded text-xs font-bold uppercase">{selectedLeadForDetail.status}</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Lead Score</label>
                    <span className="font-bold text-on-surface">{selectedLeadForDetail.lead_score || 0} / 100</span>
                  </div>
                  <div className="pt-4 border-t border-outline-variant">
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Latest Correspondence / Notes</label>
                    <textarea 
                      value={leadNotesInput}
                      onChange={(e) => setLeadNotesInput(e.target.value)}
                      rows="4"
                      className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none text-on-surface"
                      placeholder="Add conversation notes..."
                    />
                    <button 
                      onClick={() => handleUpdateNotes(selectedLeadForDetail.id)}
                      className="mt-2 px-3 py-1.5 text-xs font-bold bg-primary text-white rounded hover:bg-primary-container cursor-pointer"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bento-card p-6 rounded-xl shadow-sm text-center py-16 text-outline italic">
                Select a lead to view details and correspondence history.
              </div>
            )}

            {/* Meeting Scheduler dialog */}
            {selectedLeadForMeeting && (
              <form onSubmit={handleScheduleMeeting} className="bento-card p-6 rounded-xl shadow-sm space-y-4">
                <h3 className="font-title-lg text-title-lg">📅 Schedule Meeting</h3>
                <p className="text-xs text-outline-variant">Schedule Google Calendar meeting with {selectedLeadForMeeting.incubator_name}.</p>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase mb-1">Meeting Date</label>
                  <input 
                    type="date" 
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase mb-1">Meeting Time</label>
                  <input 
                    type="text" 
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none"
                    placeholder="e.g. 11:00 AM"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setSelectedLeadForMeeting(null)} className="px-3 py-1.5 text-xs font-bold border border-outline-variant rounded hover:bg-surface-container-high cursor-pointer">Cancel</button>
                  <button type="submit" disabled={schedulingMeeting} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded hover:bg-primary-container cursor-pointer">
                    {schedulingMeeting ? "Scheduling..." : "Schedule"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === "controls" && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Campaign Controls Card */}
          <div className="bento-card p-6 rounded-xl shadow-sm space-y-6">
            <h3 className="font-title-lg text-title-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">campaign</span>
              <span>Campaign Management</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/60">
                <div>
                  <p className="font-bold text-sm text-on-surface">Inbox Synch Sync Interval</p>
                  <p className="text-xs text-outline">Frequency in minutes to scan for new reply emails.</p>
                </div>
                <input 
                  type="number"
                  value={syncInterval}
                  onChange={(e) => handleSyncIntervalChange(parseInt(e.target.value) || 30)}
                  className="w-20 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-center text-on-surface font-bold outline-none"
                />
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/60">
                <div>
                  <p className="font-bold text-sm text-on-surface">Inbox Scan & Sync</p>
                  <p className="text-xs text-outline">Scan connected inbox for replies and run AI sentiment scorer.</p>
                </div>
                <button 
                  onClick={handleCheckReplies}
                  disabled={checkingReplies}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary-container shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span className={`material-symbols-outlined text-sm ${checkingReplies ? "spin" : ""}`}>sync</span>
                  <span>Check Replies</span>
                </button>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/60">
                <div>
                  <p className="font-bold text-sm text-on-surface">Google Calendar Integration</p>
                  <p className="text-xs text-outline">Access Google Calendar to check scheduler and sync dates.</p>
                </div>
                {oauthAuthorized ? (
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Connected</span>
                ) : oauthConfigured ? (
                  <button 
                    onClick={handleAuthorizeCalendar}
                    className="px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span>Connect Google Calendar</span>
                  </button>
                ) : (
                  <span className="bg-error-container/10 text-error text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Config Missing (.env)</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-on-surface">Reset Pipeline Database</p>
                  <p className="text-xs text-outline">Danger: Clear all campaign status logs, active leads, and history.</p>
                </div>
                <button 
                  onClick={handleReset}
                  disabled={resetting}
                  className="px-4 py-2 text-xs font-bold bg-error text-white rounded-lg hover:bg-red-700 shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  <span>Reset Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "console" && (
        <div className="grid grid-cols-12 gap-8">
          {/* Console Log Terminal (8 columns) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col h-[450px]">
            <div className="bg-[#0b0f19] border border-outline-variant/80 rounded-xl p-5 flex flex-col h-full shadow-lg font-mono">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">System Console Log</span>
                </div>
                <span className="text-[10px] text-white/40">STDOUT_STREAM</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 text-xs text-sky-400 custom-scrollbar pr-2">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-3 leading-relaxed">
                    <span className="text-white/30 text-[10px] select-none">[{log.time}]</span>
                    <span className="text-white/50 select-none">[{log.src}]</span>
                    <span className="text-sky-300 break-all">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Synced Events (4 columns) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col h-[450px]">
            <div className="bento-card rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                <h4 className="font-title-lg text-title-lg">Calendar Events</h4>
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  {externalEvents.length} Synced
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-outline-variant/20 custom-scrollbar">
                {externalEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="p-3 pt-4 first:pt-3 hover:bg-surface-container-low rounded-lg transition-all flex items-start gap-4">
                    <div className="flex-shrink-0 text-center border-r border-outline-variant pr-3 min-w-[50px]">
                      <p className="text-[10px] font-bold text-primary uppercase">{evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "ALL DAY"}</p>
                      <p className="text-[9px] font-semibold text-outline uppercase">{evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "Event"}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[13px] font-bold text-on-surface leading-tight mb-1 truncate">{evt.summary || "Calendar Event"}</h5>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        {evt.location || "Google Meet Video Call"}
                      </p>
                    </div>
                  </div>
                ))}
                {externalEvents.length === 0 && (
                  <div className="p-12 text-center text-outline italic text-xs">
                    No connected Google Calendar events found. Connect calendar in controls.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

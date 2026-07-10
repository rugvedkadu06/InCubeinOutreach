import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function OutreachAutomation({ preselectedIncubatorName, refreshTrigger }) {
  // Tab State: "generator", "leads", "controls", "console"
  const [activeTab, setActiveTab] = useState("generator");

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

  // TWO WORKFLOW STATES
  const [isManualFlow, setIsManualFlow] = useState(false);
  
  // Form fields (Pre-filled or manually typed)
  const [selectedIncName, setSelectedIncName] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientWebsite, setRecipientWebsite] = useState("");
  
  // MOU details
  const [executionDate, setExecutionDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("3 Years");
  const [focusAreas, setFocusAreas] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [trackEmails, setTrackEmails] = useState(true);

  // Template Upload States
  const [templateFile, setTemplateFile] = useState(null);
  const [templateText, setTemplateText] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Drawing signature pad ref & drawing state
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");

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
        setExternalEvents(data.events || []);
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
        setOauthConfigured(data.is_configured);
        setOauthAuthorized(data.is_authorized);
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

  // Handle incubator auto-fill change (in Automated Flow)
  useEffect(() => {
    if (!isManualFlow && incubators.length > 0) {
      let matched = null;
      if (preselectedIncubatorName) {
        matched = incubators.find(inc =>
          inc.name.toLowerCase().includes(preselectedIncubatorName.toLowerCase())
        );
      } else {
        matched = incubators[0]; // fallback to first
      }

      if (matched) {
        autoFillIncubator(matched);
      }
    }
  }, [incubators, preselectedIncubatorName, isManualFlow]);

  const autoFillIncubator = (inc) => {
    setSelectedIncName(inc.name);
    setSelectedCity(inc.city || "");
    setSelectedState(inc.state || "");
    setSelectedSector(inc.organization_type || "Technology");
    setRecipientEmail(inc.email || "");
    setRecipientWebsite(inc.website || "");
    setFocusAreas(inc.organization_type || "");
    setEmailSubject(`Partnership MOU: Incubator Hub x ${inc.name}`);
  };

  const clearForm = () => {
    setSelectedIncName("");
    setSelectedCity("");
    setSelectedState("");
    setSelectedSector("");
    setRecipientEmail("");
    setRecipientWebsite("");
    setFocusAreas("");
    setEmailSubject("");
  };

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
        if (data.authorization_url) {
          window.open(data.authorization_url, "_blank");
        }
      }
    } catch (e) {
      toast.error("Failed to initiate OAuth.");
    }
  };

  // Send MOU
  const handleSendMou = async () => {
    if (!generatedText) {
      toast.error("Please generate the MOU first.");
      return;
    }
    if (!signatureSaved) {
      toast.error("Please sign and adopt the signature first.");
      return;
    }

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
          mou_text: generatedText,
          signature_data: signatureDataUrl,
          recipient_email: recipientEmail
        })
      });

      if (res.ok) {
        toast.success("MOU email generated and transmitted successfully!");
        addLog("OUTREACH", `SUCCESS: MOU sent to ${selectedIncName} (${recipientEmail})`);
        
        // Refresh leads list
        fetchLeads();
      } else {
        const data = await res.json();
        toast.error(`Failed to send MOU: ${data.detail || "Server error"}`);
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
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureSaved(false);
    setSignatureDataUrl("");
  };

  const adoptSignature = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
    setSignatureSaved(true);
    toast.success("Digital signature adopted successfully!");
  };

  // File Upload Handlers for Template
  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTemplateFile(file);

    // Read the file as text
    const reader = new FileReader();
    reader.onload = (event) => {
      setTemplateText(event.target.result);
      toast.success(`Template "${file.name}" uploaded successfully!`);
    };
    reader.onerror = () => {
      toast.error("Failed to read template file.");
    };
    reader.readAsText(file);
  };

  const removeTemplate = () => {
    setTemplateFile(null);
    setTemplateText("");
    setGeneratedText("");
    setIsPreviewMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Template removed.");
  };

  const generateMouFromTemplate = () => {
    if (!templateText) {
      toast.error("Please upload an MOU template first.");
      return;
    }

    if (!selectedIncName) {
      toast.error("Please specify the partner incubator first.");
      return;
    }

    // Replace placeholders
    let text = templateText;
    const replacements = {
      "{{incubator_name}}": selectedIncName,
      "{{partner_name}}": selectedIncName,
      "{{location}}": `${selectedCity ? selectedCity + ", " : ""}${selectedState}`,
      "{{city}}": selectedCity,
      "{{state}}": selectedState,
      "{{sector}}": selectedSector,
      "{{email}}": recipientEmail,
      "{{website}}": recipientWebsite,
      "{{date}}": executionDate,
      "{{execution_date}}": executionDate,
      "{{duration}}": duration,
      "{{focus_areas}}": focusAreas
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      // Use case-insensitive global replacement
      const escapedPlaceholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      text = text.replace(new RegExp(escapedPlaceholder, 'gi'), value || "");
    });

    setGeneratedText(text);
    setIsPreviewMode(true);
    toast.success("MOU Document generated from template!");
  };

  const downloadMouText = () => {
    if (!generatedText) return;
    const element = document.createElement("a");
    const file = new Blob([generatedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `MOU_${selectedIncName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("MOU Text file downloaded.");
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureDataUrl(event.target.result);
      setSignatureSaved(true);
      toast.success("Signature image uploaded and adopted!");
    };
    reader.readAsText(file); // Actually read as DataURL
    
    // Read as DataURL helper
    const dataReader = new FileReader();
    dataReader.onload = (event) => {
      setSignatureDataUrl(event.target.result);
      setSignatureSaved(true);
    };
    dataReader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">MOU & Outreach Automation</h2>
          <p className="text-on-surface-variant font-body-md">Draft, customize, and transmit legal partnership agreements.</p>
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
          <div className="col-span-12 lg:col-span-5 space-y-6">
            
            {/* Step 1: Select Incubator or Manual Entry */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">1</div>
                  <h3 className="font-title-lg text-title-lg text-on-surface">Partner Institution</h3>
                </div>
                
                <button 
                  onClick={() => {
                    const nextMode = !isManualFlow;
                    setIsManualFlow(nextMode);
                    clearForm();
                    if (!nextMode && incubators.length > 0) {
                      autoFillIncubator(incubators[0]);
                    }
                  }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {isManualFlow ? "Select from Directory" : "Enter Details Manually"}
                </button>
              </div>

              {!isManualFlow ? (
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5 font-bold uppercase">Select Incubator</label>
                  <select 
                    value={selectedIncName}
                    onChange={(e) => {
                      const matched = incubators.find(i => i.name === e.target.value);
                      if (matched) {
                        autoFillIncubator(matched);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  >
                    <option value="">Choose an incubator...</option>
                    {incubators.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant animate-fade-in">
                  <h4 className="text-xs font-bold text-primary uppercase">Manual Intake Form</h4>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Incubator Name</label>
                    <input 
                      type="text" 
                      value={selectedIncName} 
                      onChange={(e) => setSelectedIncName(e.target.value)} 
                      className="w-full px-3 py-1.5 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                      placeholder="e.g. Nagpur Innovation Lab"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">City</label>
                      <input 
                        type="text" 
                        value={selectedCity} 
                        onChange={(e) => setSelectedCity(e.target.value)} 
                        className="w-full px-3 py-1.5 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">State</label>
                      <input 
                        type="text" 
                        value={selectedState} 
                        onChange={(e) => setSelectedState(e.target.value)} 
                        className="w-full px-3 py-1.5 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Email</label>
                    <input 
                      type="email" 
                      value={recipientEmail} 
                      onChange={(e) => {
                        setRecipientEmail(e.target.value);
                        setEmailSubject(`Partnership MOU: Incubator Hub x ${selectedIncName}`);
                      }} 
                      className="w-full px-3 py-1.5 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Website</label>
                      <input 
                        type="text" 
                        value={recipientWebsite} 
                        onChange={(e) => setRecipientWebsite(e.target.value)} 
                        className="w-full px-3 py-1.5 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Sector Focus</label>
                      <input 
                        type="text" 
                        value={selectedSector} 
                        onChange={(e) => setSelectedSector(e.target.value)} 
                        className="w-full px-3 py-1.5 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isManualFlow && selectedIncName && (
                <div className="p-4 bg-surface-container-low rounded-lg space-y-2 text-xs border border-outline-variant">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-medium">Location:</span>
                    <span className="font-bold text-on-surface">{selectedCity ? `${selectedCity}, ` : ""}{selectedState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-medium">Contact:</span>
                    <span className="font-bold text-on-surface">{recipientEmail || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-medium">Website:</span>
                    <span className="font-bold text-primary hover:underline"><a href={recipientWebsite} target="_blank" rel="noreferrer">{recipientWebsite || "N/A"}</a></span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: MOU Specifications */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-title-lg text-title-lg text-on-surface">MOU Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5 font-bold uppercase">Execution Date</label>
                  <input 
                    type="date" 
                    value={executionDate}
                    onChange={(e) => setExecutionDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5 font-bold uppercase">Duration</label>
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                  >
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                    <option value="5 Years">5 Years</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5 font-bold uppercase">Focus Areas</label>
                <input 
                  type="text" 
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  placeholder="e.g. DeepTech, AI/ML, SaaS" 
                  className="w-full px-4 py-2 bg-white border border-outline-variant rounded-lg font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Step 3: Template Handling */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-title-lg text-title-lg text-on-surface">MOU Template File</h3>
              </div>
              
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container-low transition-colors relative">
                <input 
                  type="file" 
                  accept=".txt,.md" 
                  onChange={handleTemplateUpload} 
                  ref={fileInputRef}
                  className="hidden" 
                  id="template-upload-input"
                />
                
                {!templateFile ? (
                  <label htmlFor="template-upload-input" className="cursor-pointer block space-y-2">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">upload_file</span>
                    <p className="text-sm font-bold text-on-surface">Upload Template File</p>
                    <p className="text-xs text-outline">Supported format: .txt, .md</p>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span className="truncate max-w-[200px]">{templateFile.name}</span>
                    </div>
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="px-3 py-1 bg-surface-container-lowest border border-outline-variant text-xs font-semibold rounded hover:bg-surface-container-high cursor-pointer"
                      >
                        Replace
                      </button>
                      <button 
                        onClick={removeTemplate} 
                        className="px-3 py-1 bg-red-500/10 text-red-600 text-xs font-semibold rounded hover:bg-red-500/20 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={generateMouFromTemplate}
                disabled={!templateText || !selectedIncName}
                className="w-full py-3 bg-secondary text-white font-bold rounded-lg shadow-md hover:bg-secondary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">auto_stories</span>
                <span>Generate MOU Document</span>
              </button>
            </div>

            {/* Step 4: Signature Pad */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">4</div>
                <h3 className="font-title-lg text-title-lg text-on-surface">Digital Signature</h3>
              </div>
              
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

              <div className="flex justify-between items-center gap-3">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button onClick={clearCanvas} className="py-2 text-xs font-bold border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">Clear</button>
                  <button onClick={adoptSignature} className="py-2 text-xs font-bold bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer">Adopt</button>
                </div>
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={e => {}} 
                    onChange={handleSignatureUpload} 
                    id="sig-upload-input" 
                    className="hidden" 
                  />
                  <label 
                    htmlFor="sig-upload-input" 
                    className="px-3 py-2 text-xs font-bold border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer inline-block"
                  >
                    Upload Image
                  </label>
                </div>
              </div>
            </div>

            {/* Email dispatch info */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">5</div>
                <h3 className="font-title-lg text-title-lg text-on-surface">Email Delivery</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Recipient Address</label>
                  <input 
                    type="email" 
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant bg-white text-sm text-on-surface rounded-lg outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input 
                    type="checkbox" 
                    checked={trackEmails}
                    onChange={(e) => setTrackEmails(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
                  />
                  <span className="text-xs text-on-surface-variant">Track email opens and receipt logs</span>
                </label>
              </div>

              <button 
                onClick={handleSendMou}
                disabled={!generatedText || !signatureSaved || !recipientEmail}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              >
                <span className="material-symbols-outlined">send</span>
                <span>Send MOU via Email</span>
              </button>
            </div>

          </div>

          {/* Right Column: Document Editor */}
          <div className="col-span-12 lg:col-span-7 flex flex-col h-full min-h-[600px]">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg flex flex-col h-full">
              
              {/* Editor Header */}
              <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined fill-icon">description</span>
                  </div>
                  <div>
                    <h3 className="font-title-lg text-[14px] text-on-surface leading-tight">
                      {templateFile ? `MOU_Draft_${selectedIncName?.replace(/\s+/g, "_")}.txt` : "MOU Document Draft"}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      {templateFile ? `Template: ${templateFile.name}` : "Upload a template file on the left to begin"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (!generatedText) return;
                      setIsPreviewMode(!isPreviewMode);
                    }}
                    disabled={!generatedText}
                    className="px-3 py-1.5 text-[12px] font-bold text-on-surface-variant hover:bg-surface-container-high rounded transition-all cursor-pointer disabled:opacity-40"
                  >
                    {isPreviewMode ? "Edit View" : "Preview PDF"}
                  </button>
                  <button 
                    onClick={downloadMouText}
                    disabled={!generatedText}
                    className="px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/5 rounded transition-all cursor-pointer disabled:opacity-40"
                  >
                    Download
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-6 py-2 border-b border-outline-variant flex items-center gap-4 bg-white text-outline">
                <div className="flex items-center gap-1 border-r pr-4 border-outline-variant">
                  <span className="material-symbols-outlined text-[18px]">undo</span>
                  <span className="material-symbols-outlined text-[18px]">redo</span>
                </div>
                <div className="flex items-center gap-1 border-r pr-4 border-outline-variant text-[12px]">
                  <span>Normal text</span>
                  <span className="ml-2 font-mono">Inter</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">format_bold</span>
                  <span className="material-symbols-outlined text-[18px]">format_italic</span>
                  <span className="material-symbols-outlined text-[18px]">format_underlined</span>
                </div>
              </div>

              {/* Document Canvas */}
              <div className="flex-1 bg-surface-container-low p-8 overflow-y-auto editor-container flex justify-center">
                {!generatedText ? (
                  <div className="w-full max-w-[650px] bg-white shadow-lg p-16 flex flex-col items-center justify-center text-center text-outline italic border border-outline-variant/60 rounded-lg">
                    <span className="material-symbols-outlined text-5xl mb-4 text-outline-variant/80">article</span>
                    <p className="text-sm">Please upload an official MOU template and select an incubator on the left, then click "Generate MOU Document" to edit the agreement here.</p>
                  </div>
                ) : !isPreviewMode ? (
                  <textarea 
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    className="w-full max-w-[650px] bg-white shadow-lg p-12 text-[#1a1a1a] font-mono text-sm leading-relaxed border border-outline-variant outline-none resize-none min-h-[700px] rounded-lg"
                  />
                ) : (
                  <div className="w-full max-w-[650px] bg-white shadow-lg p-16 text-[#1a1a1a] font-serif text-sm leading-relaxed border border-outline-variant rounded-lg relative min-h-[700px] overflow-hidden">
                    <div className="absolute top-8 right-8 opacity-10 uppercase tracking-widest text-[8px] border border-black p-1">Draft copy</div>
                    <pre className="whitespace-pre-wrap font-serif text-sm text-justify leading-relaxed">{generatedText}</pre>
                    
                    {signatureSaved && signatureDataUrl && (
                      <div className="mt-12 pt-8 border-t border-dashed border-outline-variant flex justify-end">
                        <div className="text-center">
                          <img src={signatureDataUrl} alt="Adopted Signature" className="max-h-12 max-w-[150px] object-contain mx-auto" />
                          <p className="text-[10px] uppercase font-bold text-outline mt-1">{selectedIncName} Signatory</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                    <option value="Partnership Completed">Partnership Completed</option>
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
                            <option value="Partnership Completed">Partnership Completed</option>
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
              <div className="bento-card p-6 rounded-xl shadow-sm space-y-6 animate-fade-in">
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
              <form onSubmit={handleScheduleMeeting} className="bento-card p-6 rounded-xl shadow-sm space-y-4 animate-fade-in">
                <h3 className="font-title-lg text-title-lg">📅 Schedule Meeting</h3>
                <p className="text-xs text-outline">Schedule Google Calendar meeting with {selectedLeadForMeeting.incubator_name}.</p>
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

              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/60">
                <div>
                  <p className="font-bold text-sm text-on-surface">Export Campaign Leads</p>
                  <p className="text-xs text-outline">Export lead records as a CSV spreadsheet.</p>
                </div>
                <button 
                  onClick={() => {
                    window.open("http://127.0.0.1:8000/api/export/csv", "_blank");
                    toast.success("CSV export dispatched.");
                  }}
                  className="px-4 py-2 text-xs font-bold bg-secondary text-white rounded-lg hover:bg-secondary/90 shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Export Leads (CSV)</span>
                </button>
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
                      <p className="text-[10px] font-bold text-primary uppercase">{evt.date || "Event"}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[13px] font-bold text-on-surface leading-tight mb-1 truncate">{evt.summary || "Calendar Event"}</h5>
                    </div>
                  </div>
                ))}
                {externalEvents.length === 0 && (
                  <div className="p-12 text-center text-outline italic text-xs">
                    No connected Google Calendar events found.
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

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const STAGES = [
  { id: "Draft", label: "Draft" },
  { id: "MOU Sent", label: "MOU Sent" },
  { id: "Awaiting Reply", label: "Awaiting Reply" },
  { id: "Interested", label: "Interested" },
  { id: "Meeting Scheduled", label: "Meeting Scheduled" },
  { id: "Partnership Completed", label: "Partnership Completed" }
];

export default function RelationshipPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Fetch leads
  const fetchLeads = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error("Error fetching leads:", e);
      toast.error("Failed to connect to backend leads database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Update lead status
  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/outreach/leads/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lead_id: leadId,
          status: newStatus
        })
      });
      if (res.ok) {
        toast.success(`Moved to ${newStatus}`);
        fetchLeads();
      } else {
        const errData = await res.json();
        toast.error(`Update failed: ${errData.detail || "Server error"}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error updating status.");
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      handleUpdateStatus(leadId, targetStatus);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Interested":
        return "bg-green-100 text-green-800";
      case "Awaiting Reply":
        return "bg-error-container/20 text-error";
      case "Meeting Scheduled":
        return "bg-tertiary-fixed text-on-tertiary-fixed";
      case "MOU Sent":
        return "bg-secondary-container text-on-secondary-container";
      case "Partnership Completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-surface-container-high text-on-surface-variant";
    }
  };

  const getCardTag = (lead) => {
    const sectors = ["Agri-Tech", "Ed-Tech", "Deep-Tech", "Bio-Tech", "Fin-Tech"];
    const idNum = typeof lead.id === "number" ? lead.id : parseInt(lead.id) || 0;
    return sectors[idNum % sectors.length];
  };

  const selectLeadForDetail = (lead) => {
    setSelectedLead(lead);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative h-[calc(100vh-8rem)]">
      {/* Notification Banner */}
      {showBanner && (
        <div className="mb-8 p-4 bg-primary-fixed-dim text-on-primary-fixed-variant rounded-xl flex items-center justify-between shadow-sm border border-primary/10 animate-pulse" id="notification-banner">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            <p className="font-title-lg text-title-lg">New Partnership Interest: <span className="font-bold">IIT Madras Bio-Incubator</span> just requested a draft MOU.</p>
          </div>
          <div className="flex gap-4">
            <button 
              className="font-label-md text-label-md bg-white px-4 py-1.5 rounded-lg shadow-sm hover:bg-surface transition-colors cursor-pointer"
              onClick={() => {
                const matchedIIT = leads.find(l => l.incubator_name.includes("Madras") || l.incubator_name.includes("IIT"));
                if (matchedIIT) {
                  selectLeadForDetail(matchedIIT);
                } else {
                  toast.info("Opening review pane for IIT Madras");
                }
              }}
            >
              Review Interest
            </button>
            <button className="material-symbols-outlined text-on-primary-fixed-variant/60 hover:text-on-primary-fixed-variant cursor-pointer" onClick={() => setShowBanner(false)}>close</button>
          </div>
        </div>
      )}

      {/* Kanban Board Header */}
      <div className="flex justify-between items-end mb-6 flex-shrink-0">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Partnership Pipeline</h2>
          <p className="text-on-surface-variant font-body-md text-body-md">Drag and drop leads to manage and track relationship stages.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => toast.info("Filter applied.")} className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-label-md hover:bg-surface cursor-pointer transition-all">
            <span className="material-symbols-outlined text-sm">filter_list</span> Filter
          </button>
          <button onClick={() => toast.info("Sorting changed.")} className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-label-md hover:bg-surface cursor-pointer transition-all">
            <span className="material-symbols-outlined text-sm">sort</span> Sort
          </button>
        </div>
      </div>

      {/* Kanban Scroller */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined spin text-4xl text-primary">sync</span>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto hide-scrollbar pb-4 -mx-2 flex gap-6">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => (l.status || "Draft").toLowerCase() === stage.id.toLowerCase());
            
            return (
              <div 
                key={stage.id} 
                className="kanban-column flex flex-col h-full bg-surface-container-low/50 rounded-xl p-3 border border-outline-variant/30"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-title-lg text-title-lg uppercase tracking-wider text-on-secondary-fixed-variant/70 text-[11px]">
                    {stage.label} ({stageLeads.length})
                  </h3>
                  <button onClick={() => toast.info(`Draft MOU to initiate campaign.`)} className="material-symbols-outlined text-outline hover:text-on-surface text-sm cursor-pointer">add</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar min-h-[150px]">
                  {stageLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-white p-4 rounded-lg card-shadow group cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99]"
                      onClick={() => selectLeadForDetail(lead)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-label-md text-[10px] uppercase px-2 py-0.5 rounded font-bold ${getStatusBadgeClass(lead.status)}`}>
                          {getCardTag(lead)}
                        </span>
                        <span className="material-symbols-outlined text-outline opacity-0 group-hover:opacity-100 cursor-grab text-[18px]">drag_indicator</span>
                      </div>
                      <h4 className="font-title-lg text-title-lg text-on-surface mb-1 truncate">{lead.incubator_name}</h4>
                      <p className="text-label-md text-on-surface-variant/70 mb-3 truncate">{lead.email}</p>
                      
                      <div className="flex items-center justify-between text-[11px] text-outline font-medium">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">history</span>
                          Score: {lead.lead_score || 0}
                        </span>
                        
                        {lead.status === "MOU Sent" && (
                          <span className="flex items-center gap-1 text-primary">
                            <span className="material-symbols-outlined text-xs">send</span> Sent
                          </span>
                        )}
                        {lead.status === "Awaiting Reply" && (
                          <span className="flex items-center gap-1 text-error">
                            <span className="material-symbols-outlined text-xs">timer</span> Overdue
                          </span>
                        )}
                        {lead.status === "Interested" && (
                          <span className="flex items-center gap-1 text-green-600 font-bold">
                            <span className="material-symbols-outlined text-xs">chat</span> New Reply
                          </span>
                        )}
                        {lead.status === "Meeting Scheduled" && (
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <span className="material-symbols-outlined text-xs">calendar_today</span> Meet Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-full flex items-center justify-center border border-dashed border-outline-variant/40 rounded-lg p-6 text-center text-xs text-outline italic">
                      Drag cards here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Profile Drawer Overlay */}
      {showDrawer && selectedLead && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface shadow-2xl z-[60] flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Incubator Profile</h3>
                <p className="text-body-md text-on-surface-variant">Detailed campaign and lead pipeline overview</p>
              </div>
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all cursor-pointer" onClick={closeDrawer}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Cover Image/Logo Section */}
              <div className="w-full h-40 rounded-xl overflow-hidden mb-6 relative">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Incubator Hub building"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZTSINXegyyZm_yTmIANJ5JvoomfaR5Xr87-ZuSno4UzdtE4dVx2EQK_giJja3OmHgr_7iGirWtyVZkjaY_kCREuqLskIQnVwFK67xjZa5hpOkREKrgZmqER83-yDnOJNARvsv4e021lzPhng0Nc_mVNEDe7XvtBSiZ_P1_SEdjr7ookV-vfq6HnzDuO5d9BSHIQpDfBywdPi8uJRdlH2oOf9ZW9Fv4H_xrg9dwfs-ynMctkic_mFZ"
                />
                <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-lg border border-outline-variant">
                  <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded">
                    <span className="material-symbols-outlined text-primary text-[32px]">apartment</span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight mb-2">{selectedLead.incubator_name}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadgeClass(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase">
                      Score: {selectedLead.lead_score || 0}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-label-md text-label-md text-outline mb-2">LATEST CORRESPONDENCE</h4>
                    <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 text-sm">
                      <p className="text-body-md italic text-on-surface-variant">
                        {selectedLead.notes || `"We've reviewed the preliminary MOU draft. The section on IP sharing requires a quick call with our legal head, but overall we are excited to move forward next month."`}
                      </p>
                      <p className="text-[11px] mt-3 text-primary font-bold">Updated Recently</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        toast.info("Opening Scheduler in Outreach Automation...");
                        closeDrawer();
                      }}
                      className="flex flex-col items-center gap-2 p-4 border border-outline-variant rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer active:scale-95 text-on-surface hover:text-white"
                    >
                      <span className="material-symbols-outlined">calendar_month</span>
                      <span className="text-label-md font-bold">Schedule Call</span>
                    </button>
                    <button 
                      onClick={() => {
                        toast.info("Opening MOU generator...");
                        closeDrawer();
                      }}
                      className="flex flex-col items-center gap-2 p-4 border border-outline-variant rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer active:scale-95 text-on-surface hover:text-white"
                    >
                      <span className="material-symbols-outlined">edit_document</span>
                      <span className="text-label-md font-bold">Edit MOU</span>
                    </button>
                  </div>

                  <div className="pt-6 border-t border-outline-variant">
                    <h4 className="font-label-md text-label-md text-outline mb-4">ACTIVITY LOG</h4>
                    <ul className="space-y-4 text-sm">
                      <li className="flex gap-3">
                        <span className="material-symbols-outlined text-sm text-primary mt-0.5">check_circle</span>
                        <div>
                          <p className="text-body-md text-on-surface">Lead state initialized in Pipeline</p>
                          <p className="text-xs text-outline">Status set to {selectedLead.status}</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="material-symbols-outlined text-sm text-outline mt-0.5">mail</span>
                        <div>
                          <p className="text-body-md text-on-surface">Contact details mapped</p>
                          <p className="text-xs text-outline">{selectedLead.email}</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-lowest grid grid-cols-2 gap-4">
              <button 
                onClick={() => toast.success("Correspondence logged.")}
                className="w-full py-3 border border-outline text-on-surface font-medium rounded-lg hover:bg-surface-container transition-all cursor-pointer"
              >
                Log Call Details
              </button>
              <button 
                onClick={() => {
                  handleUpdateStatus(selectedLead.id, "Partnership Completed");
                  closeDrawer();
                }}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-container shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Complete Partnership</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

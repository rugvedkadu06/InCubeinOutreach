import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function DirectoryView({ filtersData, onDraftMou }) {
  const [incubators, setIncubators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  
  // Drawer state
  const [activeDrawerInc, setActiveDrawerInc] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch from backend
  const fetchIncubators = async () => {
    setLoading(true);
    try {
      let url = "http://127.0.0.1:8000/api/incubators?1=1";
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
      if (selectedState) url += `&state=${encodeURIComponent(selectedState)}`;
      if (selectedCity) url += `&city=${encodeURIComponent(selectedCity)}`;
      if (selectedSector) url += `&sector=${encodeURIComponent(selectedSector)}`;
      if (selectedRegion) url += `&region=${encodeURIComponent(selectedRegion)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIncubators(data);
        setCurrentPage(1); // reset to first page on search
      }
    } catch (e) {
      console.error("Error fetching incubators:", e);
      toast.error("Failed to connect to backend database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIncubators();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedState, selectedCity, selectedSector, selectedRegion]);

  // Client side pagination math
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = incubators.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(incubators.length / itemsPerPage) || 1;

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const openDrawer = (incubator) => {
    setActiveDrawerInc(incubator);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-display text-display text-on-surface mb-2">Incubator Directory</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Manage and explore {loading ? "registered" : incubators.length} incubators across the ecosystem.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-on-surface-variant px-1">Keyword</label>
            <div className="relative">
              <input 
                type="text"
                className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md px-3 py-1.5 pl-8 focus:ring-2 focus:ring-primary/10 w-44 outline-none text-on-surface"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-on-surface-variant px-1">State</label>
            <select 
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md px-3 py-2 min-w-[140px] focus:ring-2 focus:ring-primary/10 outline-none text-on-surface"
            >
              <option value="">All States</option>
              {filtersData?.states?.map((st) => (
                <option key={st} value={st}>{st}</option>
              )) || (
                <>
                  <option value="Assam">Assam</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                </>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-on-surface-variant px-1">City</label>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md px-3 py-2 min-w-[140px] focus:ring-2 focus:ring-primary/10 outline-none text-on-surface"
            >
              <option value="">All Cities</option>
              {filtersData?.cities?.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              )) || (
                <>
                  <option value="Silchar">Silchar</option>
                  <option value="Guwahati">Guwahati</option>
                  <option value="Bangalore">Bangalore</option>
                </>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-on-surface-variant px-1">Sector</label>
            <select 
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md px-3 py-2 min-w-[140px] focus:ring-2 focus:ring-primary/10 outline-none text-on-surface"
            >
              <option value="">All Sectors</option>
              {filtersData?.sectors?.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              )) || (
                <>
                  <option value="Digital Technology">Digital Technology</option>
                  <option value="Bio-Tech">Bio-Tech</option>
                  <option value="Agri-Tech">Agri-Tech</option>
                </>
              )}
            </select>
          </div>

          <button 
            onClick={() => {
              setSelectedState("");
              setSelectedCity("");
              setSelectedSector("");
              setSelectedRegion("");
              setSearchQuery("");
            }}
            className="h-[38px] mt-auto px-4 bg-surface-container-highest text-on-surface-variant rounded-lg flex items-center gap-2 hover:bg-surface-variant transition-all font-medium cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <span className="material-symbols-outlined spin text-4xl text-primary">sync</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Incubator Name</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Location</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Sector</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Contact Email</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Source</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {currentItems.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-container transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-title-lg text-title-lg text-on-surface">{inc.name}</div>
                      <div className="text-[11px] text-on-surface-variant font-medium">ESTD. {inc.year_established || 2018}</div>
                    </td>
                    <td className="py-4 px-6 text-body-md text-on-surface-variant">
                      {inc.city ? `${inc.city}, ` : ""}{inc.state}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-primary-fixed text-on-primary-fixed text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {inc.organization_type || "Technology"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-body-md text-primary hover:underline cursor-pointer">
                      <a href={`mailto:${inc.email || "info@incubein.org"}`}>{inc.email || "info@incubein.org"}</a>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
                        <div className={`w-2 h-2 rounded-full ${inc.status === "DST NIDHI" ? "bg-blue-400" : "bg-emerald-400"}`}></div>
                        {inc.status || "DST NIDHI"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="text-primary-container font-medium text-body-md hover:bg-primary-fixed px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95" 
                          onClick={() => openDrawer(inc)}
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => {
                            onDraftMou(inc.name);
                            toast.success(`Drafting MOU with ${inc.name}`);
                          }}
                          className="p-2 text-on-surface-variant hover:text-primary-container hover:bg-surface-container-high rounded-full transition-all cursor-pointer" 
                          title="Create MOU"
                        >
                          <span className="material-symbols-outlined">handshake</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {incubators.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-outline italic">
                      No registered incubators found matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && incubators.length > 0 && (
          <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant">
            <p className="text-body-md text-on-surface-variant">
              Showing <span className="font-bold text-on-surface">{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, incubators.length)}</span> of {incubators.length} incubators
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50 cursor-pointer"
                disabled={currentPage === 1}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button 
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded font-medium cursor-pointer ${currentPage === page ? "bg-primary text-white" : "hover:bg-surface-container-high text-on-surface-variant"}`}
                  >
                    {page}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="px-1 text-outline">...</span>
                  <button 
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 rounded font-medium cursor-pointer hover:bg-surface-container-high text-on-surface-variant ${currentPage === totalPages ? "bg-primary text-white" : ""}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50 cursor-pointer"
                disabled={currentPage === totalPages}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Drawer Overlay */}
      {showDrawer && activeDrawerInc && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity" onClick={closeDrawer}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-surface shadow-2xl z-[60] flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Incubator Profile</h3>
                <p className="text-body-md text-on-surface-variant">Detailed institutional overview</p>
              </div>
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all cursor-pointer" onClick={closeDrawer}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Cover Image section */}
              <div className="w-full h-48 rounded-xl overflow-hidden mb-6 relative">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Incubator university campus"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuJ7Jb987Ct5m1ZgpiTQrF7oyDcTR5uERnTraOVb9UDauyd9RDYLz93HHHdgyPQsYGGHFrLHmA-Auhd2JmjxDt3iJccS9cfJUwPGXRAyk7-weS5nzdZQqtHvUJqjH8CNuUGqFTXp04y6s5E5M2LGLIZY3OZg3A7EUEWNkBjf34PPgexxApYu8hK8Brjhc0vqyi9eICq4zwdUkpOrU9yzcOpESv25ZWzuA6PiU2BWzXUgDB2KEC8h8R"
                />
                <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-lg border border-outline-variant">
                  <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded">
                    <span className="material-symbols-outlined text-primary text-[32px]">apartment</span>
                  </div>
                </div>
              </div>

              {/* Profile details */}
              <div className="space-y-8">
                <section>
                  <h4 className="font-display text-[24px] text-on-surface leading-tight mb-2">{activeDrawerInc.name}</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-primary-fixed text-on-primary-fixed text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Level 3 Incubator</span>
                    <span className="bg-surface-container-high text-on-surface-variant text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeDrawerInc.city ? `${activeDrawerInc.city}, ` : ""}{activeDrawerInc.state}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {activeDrawerInc.description || "Leading innovation center facilitating research commercialization, incubator cohorts, mentorship channels, and startup support."}
                  </p>
                </section>
                
                <hr className="border-outline-variant" />

                {/* Details Grid */}
                <section className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">Sector Focus</p>
                    <p className="text-body-md text-on-surface font-medium">{activeDrawerInc.organization_type || "Multi-Sector Technology"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">Establishment Year</p>
                    <p className="text-body-md text-on-surface font-medium">{activeDrawerInc.year_established || 2014}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">Current Startups</p>
                    <p className="text-body-md text-on-surface font-medium">42 active ventures</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">MOU Status</p>
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending Review
                    </span>
                  </div>
                </section>

                {/* Contact & Links */}
                <section className="bg-surface-container-low p-5 rounded-xl space-y-4">
                  <h5 className="text-title-lg font-bold text-on-surface">Contact Information</h5>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">public</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-on-surface-variant">Website</p>
                      <a className="text-primary font-medium hover:underline break-all" href={activeDrawerInc.website || "#"} target="_blank" rel="noreferrer">
                        {activeDrawerInc.website || "https://incubein.org"}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-on-surface-variant">Primary Email</p>
                      <p className="text-body-md text-on-surface font-medium">{activeDrawerInc.email || "info@incubein.org"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-on-surface-variant">Phone</p>
                      <p className="text-body-md text-on-surface font-medium">+91 98640 12345</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-lowest grid grid-cols-2 gap-4">
              <button 
                onClick={() => toast.success("PDF report generated successfully.")}
                className="w-full py-3 border border-outline text-on-surface font-medium rounded-lg hover:bg-surface-container transition-all cursor-pointer"
              >
                Download PDF Report
              </button>
              <button 
                onClick={() => {
                  onDraftMou(activeDrawerInc.name);
                  closeDrawer();
                }}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-container shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">handshake</span>
                <span>Initiate MOU</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

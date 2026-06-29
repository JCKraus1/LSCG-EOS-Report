import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download,
  Code,
  Mail,
  Save
} from 'lucide-react';
import { ShiftReportData, ActivityRow, MotRow, CONSTRUCTION_MATERIAL_TYPES, FIBER_MATERIAL_TYPES } from '../types';
import { generateDocxBlob } from '../utils/docxGenerator';
import { getLogoBase64 } from '../utils/logo';
import { saveDraftToStorage, loadDraftFromStorage, clearDraftFromStorage } from '../utils/indexedDb';
import { EmailModal } from './EmailModal';

interface ShiftFormProps {
  onOpenHtmlModal: () => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({ onOpenHtmlModal }) => {
  const [logoSrc, setLogoSrc] = useState<string>('');
  const [liveDate, setLiveDate] = useState<string>('');
  const [toast, setToast] = useState<{ show: boolean; msg: string; error?: boolean }>({
    show: false,
    msg: ''
  });
  const [generating, setGenerating] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});
  const [lastAutoSaved, setLastAutoSaved] = useState<string>('');

  // Form State
  const [date, setDate] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [contractor, setContractor] = useState<string>('');
  const [submittedBy, setSubmittedBy] = useState<string>('');
  const [totalFootage, setTotalFootage] = useState<string>('');
  const [startAddress, setStartAddress] = useState<string>('');
  const [endAddress, setEndAddress] = useState<string>('');
  const [activityType, setActivityType] = useState<'construction' | 'fiber'>('construction');
  const [revisions, setRevisions] = useState<string>('');
  const [issues, setIssues] = useState<string>('');
  const [nextDay, setNextDay] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [supervisor, setSupervisor] = useState<string>('');

  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [motItems, setMotItems] = useState<MotRow[]>([]);

  const showToast = (msg: string, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500);
  };

  const initDefaultRows = () => {
    const defaultMats = [
      '1.5" Conduit Bore',
      '24 Way HEX Bore',
      '12 Way HEX Bore',
      '2 Way HEX Bore',
      'Toby Boxes',
      'DAP PITs',
      'Micro Splices'
    ];
    const initialActivities: ActivityRow[] = defaultMats.map((mat, i) => ({
      id: `act-${Date.now()}-${i}`,
      description: '',
      material: mat,
      quantity: ''
    }));

    const initialMot: MotRow[] = [1, 2, 3].map((_, i) => ({
      id: `mot-${Date.now()}-${i}`,
      activity: '',
      code: '',
      hours: ''
    }));

    setActivities(initialActivities);
    setMotItems(initialMot);
  };

  useEffect(() => {
    getLogoBase64().then((src) => setLogoSrc(src));
    const now = new Date();
    setLiveDate(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    );

    // Offline Draft Recovery
    loadDraftFromStorage().then((draft) => {
      if (
        draft &&
        (draft.project ||
          draft.contractor ||
          draft.submittedBy ||
          draft.totalFootage ||
          draft.activities?.some((a: any) => a.description || a.quantity) ||
          draft.motItems?.some((m: any) => m.activity || m.hours))
      ) {
        setDate(draft.date || now.toISOString().split('T')[0]);
        setProject(draft.project || '');
        setContractor(draft.contractor || '');
        setSubmittedBy(draft.submittedBy || '');
        setTotalFootage(draft.totalFootage || '');
        setStartAddress(draft.startAddress || '');
        setEndAddress(draft.endAddress || '');
        setActivityType(draft.activityType || 'construction');
        setRevisions(draft.revisions || '');
        setIssues(draft.issues || '');
        setNextDay(draft.nextDay || '');
        setSignature(draft.signature || '');
        setSupervisor(draft.supervisor || '');
        if (draft.activities && draft.activities.length > 0) setActivities(draft.activities);
        if (draft.motItems && draft.motItems.length > 0) setMotItems(draft.motItems);
        setLastAutoSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        showToast('⚡ Restored offline report draft!');
      } else {
        setDate(now.toISOString().split('T')[0]);
        initDefaultRows();
      }
    });
  }, []);

  // Auto-Save Effect on keystroke / form state change
  useEffect(() => {
    if (!date) return;
    const timer = setTimeout(() => {
      saveDraftToStorage({
        date,
        project,
        contractor,
        submittedBy,
        totalFootage,
        startAddress,
        endAddress,
        activityType,
        revisions,
        issues,
        nextDay,
        signature,
        supervisor,
        activities,
        motItems
      }).then(() => {
        setLastAutoSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [date, project, contractor, submittedBy, totalFootage, startAddress, endAddress, activityType, revisions, issues, nextDay, signature, supervisor, activities, motItems]);

  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      {
        id: `act-${Date.now()}`,
        description: '',
        material: '',
        quantity: ''
      }
    ]);
  };

  const handleRemoveActivity = (id: string) => {
    setActivities((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateActivity = (id: string, field: keyof ActivityRow, value: string) => {
    setActivities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddMot = () => {
    setMotItems((prev) => [
      ...prev,
      {
        id: `mot-${Date.now()}`,
        activity: '',
        code: '',
        hours: ''
      }
    ]);
  };

  const handleRemoveMot = (id: string) => {
    setMotItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMot = (id: string, field: keyof MotRow, value: string) => {
    setMotItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'code' ? value.toUpperCase() : value }
          : item
      )
    );
  };

  const handleClearForm = () => {
    clearDraftFromStorage();
    setLastAutoSaved('');
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setProject('');
    setContractor('');
    setSubmittedBy('');
    setTotalFootage('');
    setStartAddress('');
    setEndAddress('');
    setActivityType('construction');
    setRevisions('');
    setIssues('');
    setNextDay('');
    setSignature('');
    setSupervisor('');
    setValidationErrors({});
    initDefaultRows();
    showToast('Form & offline draft cleared.');
  };

  const currentReportData: ShiftReportData = {
    date,
    project,
    contractor,
    submittedBy,
    vendor: 'LSCG / Full Circle Fiber',
    totalFootage,
    startAddress,
    endAddress,
    activityType,
    activities,
    motItems,
    revisions,
    issues,
    nextDay,
    signature,
    supervisor
  };

  const validateForm = () => {
    const errs: { [key: string]: boolean } = {};
    if (!date || !date.trim()) errs.date = true;
    if (!project || !project.trim()) errs.project = true;
    if (!contractor || !contractor.trim()) errs.contractor = true;
    if (!submittedBy || !submittedBy.trim()) errs.submittedBy = true;

    setValidationErrors(errs);
    const missing: string[] = [];
    if (errs.date) missing.push('Date');
    if (errs.project) missing.push('Project #');
    if (errs.contractor) missing.push('Contractor Name');
    if (errs.submittedBy) missing.push('Submitted By');

    if (missing.length > 0) {
      showToast(`⚠️ Missing required fields: ${missing.join(', ')}`, true);
      window.scrollTo({ top: 60, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  const handleGenerateReport = async () => {
    if (!validateForm()) return;
    setGenerating(true);
    try {
      const { blob, filename } = await generateDocxBlob(currentReportData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded: ${filename}`);
    } catch (e: any) {
      showToast(`Error: ${e.message || 'Failed to generate document'}`, true);
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] py-4 sm:py-8 px-3 sm:px-6 text-[#212529] font-sans pb-36 print:bg-white print:p-0">
      {/* Top Banner Controls (Not in Print) */}
      <div className="max-w-[860px] mx-auto mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1a6b8a] font-medium bg-cyan-50 border border-cyan-200 py-2.5 px-3 rounded-xl sm:rounded-lg shadow-sm">
          <FileText className="w-4 h-4 text-[#29a9e1] flex-shrink-0" />
          <span>Interactive Live Form & Client-Side .docx Export</span>
        </div>
        <button
          onClick={onOpenHtmlModal}
          className="flex items-center justify-center gap-2 bg-[#1e3a5f] text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl sm:rounded-lg hover:bg-[#1a6b8a] active:scale-[0.99] transition shadow-md"
        >
          <Code className="w-4 h-4 text-[#29a9e1]" />
          View / Export Standalone Single-File (.html)
        </button>
      </div>

      {/* Page Header Card */}
      <div className="max-w-[860px] mx-auto mb-4 sm:mb-5 bg-white rounded-2xl sm:rounded-xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-100 print:shadow-none print:border print:border-gray-300 print:mb-3">
        {logoSrc ? (
          <img src={logoSrc} className="h-12 sm:h-14 w-auto block object-contain" alt="LSCG Logo" />
        ) : (
          <div className="h-12 sm:h-14 w-44 sm:w-48 bg-gray-100 animate-pulse rounded flex items-center justify-center font-bold text-[#1e3a5f]">
            LSCG LOGO
          </div>
        )}
        <div className="w-full sm:w-auto text-left sm:text-right flex-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <div className="flex items-center justify-start sm:justify-end gap-1.5 mb-2 print:hidden">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ⚡ Auto-Save {lastAutoSaved ? `(Saved ${lastAutoSaved})` : 'Active'}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#666e75]">End of Day Shift Report</h1>
          <p className="text-xs text-[#6c757d] mt-0.5">Tillman Fiber</p>
          <p className="text-xs font-semibold text-[#1a6b8a] mt-1">{liveDate}</p>
        </div>
      </div>

      {/* 1. General Information */}
      <div className="max-w-[860px] mx-auto mb-4 bg-white rounded-2xl sm:rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border print:border-gray-300 print:mb-3">
        <div className="bg-[#1e7aaa] px-4 sm:px-5 py-3 flex items-center gap-2.5 text-white">
          <FileText className="w-4 h-4 flex-shrink-0" />
          <div>
            <strong className="text-[13px] font-semibold block leading-tight">General information</strong>
            <span className="text-[11px] opacity-80 block">Report header details (* Required fields)</span>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-3 mb-3.5 sm:mb-3">
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider ${validationErrors.date ? 'text-red-600' : 'text-[#6c757d]'}`}>
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (validationErrors.date) setValidationErrors((prev) => ({ ...prev, date: false }));
                }}
                className={`w-full px-3 sm:px-2.5 py-2.5 sm:py-2 border rounded-xl sm:rounded-lg text-sm sm:text-[13px] transition ${
                  validationErrors.date
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 text-red-900'
                    : 'border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider ${validationErrors.project ? 'text-red-600' : 'text-[#6c757d]'}`}>
                Project # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. TF-2026-01"
                value={project}
                onChange={(e) => {
                  setProject(e.target.value);
                  if (validationErrors.project) setValidationErrors((prev) => ({ ...prev, project: false }));
                }}
                className={`w-full px-3 sm:px-2.5 py-2.5 sm:py-2 border rounded-xl sm:rounded-lg text-sm sm:text-[13px] transition ${
                  validationErrors.project
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 text-red-900 placeholder-red-400 font-medium'
                    : 'border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider ${validationErrors.contractor ? 'text-red-600' : 'text-[#6c757d]'}`}>
                Contractor name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rocky Meek"
                value={contractor}
                onChange={(e) => {
                  setContractor(e.target.value);
                  if (validationErrors.contractor) setValidationErrors((prev) => ({ ...prev, contractor: false }));
                }}
                className={`w-full px-3 sm:px-2.5 py-2.5 sm:py-2 border rounded-xl sm:rounded-lg text-sm sm:text-[13px] transition ${
                  validationErrors.contractor
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 text-red-900 placeholder-red-400 font-medium'
                    : 'border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20'
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider text-[#6c757d]">Vendor</label>
              <div className="px-3.5 sm:px-3 py-2.5 sm:py-2 bg-[#e8f6fb] border border-[#b3dff0] rounded-xl sm:rounded-lg text-sm sm:text-[13px] font-semibold text-[#1a6b8a]">
                LSCG / Full Circle Fiber
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider ${validationErrors.submittedBy ? 'text-red-600' : 'text-[#6c757d]'}`}>
                Submitted by <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Supervisor or foreman name"
                value={submittedBy}
                onChange={(e) => {
                  setSubmittedBy(e.target.value);
                  if (validationErrors.submittedBy) setValidationErrors((prev) => ({ ...prev, submittedBy: false }));
                }}
                className={`w-full px-3 sm:px-2.5 py-2.5 sm:py-2 border rounded-xl sm:rounded-lg text-sm sm:text-[13px] transition ${
                  validationErrors.submittedBy
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 text-red-900 placeholder-red-400 font-medium'
                    : 'border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Construction Activity */}
      <div className="max-w-[860px] mx-auto mb-4 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border print:border-gray-300 print:mb-3">
        <div className="bg-[#1e7aaa] px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong className="text-[13px] font-semibold block leading-tight">
                {activityType === 'fiber' ? 'Fiber EOS' : 'Construction EOS'}
              </strong>
              <span className="text-[11px] opacity-80 block">Work completed this shift</span>
            </div>
          </div>
          <div className="flex bg-black/15 p-0.5 rounded-lg self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActivityType('construction')}
              className={`px-3 py-1 text-[11px] font-bold rounded transition ${
                activityType === 'construction'
                  ? 'bg-white text-[#1e7aaa] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Construction EOS
            </button>
            <button
              type="button"
              onClick={() => setActivityType('fiber')}
              className={`px-3 py-1 text-[11px] font-bold rounded transition ${
                activityType === 'fiber'
                  ? 'bg-white text-[#1e7aaa] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Fiber EOS
            </button>
          </div>
        </div>
        <div className="p-5">
          {/* Total Drill Footage Highlight Bar & Global Addresses */}
          <div className="flex flex-col gap-3 mb-4 bg-gray-50/50 border border-gray-200 rounded-xl p-4">
            {activityType !== 'fiber' && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-[#e8f6fb] border border-[#b3dff0] rounded-lg">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1a6b8a]">
                  Total drill footage (manual entry):
                </label>
                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={totalFootage}
                    onChange={(e) => setTotalFootage(e.target.value)}
                    className="w-24 px-2 py-1.5 border border-[#b3dff0] rounded-lg text-sm font-bold text-[#1a6b8a] bg-white text-center focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 shadow-inner"
                  />
                  <span className="text-sm font-bold text-[#1a6b8a]">FT</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
                  Start Address
                </label>
                <input
                  type="text"
                  placeholder="Enter start address"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#dee2e6] rounded-lg text-xs sm:text-[13px] focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
                  End Address
                </label>
                <input
                  type="text"
                  placeholder="Enter end address"
                  value={endAddress}
                  onChange={(e) => setEndAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#dee2e6] rounded-lg text-xs sm:text-[13px] focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Desktop Headers */}
          <div className="hidden sm:grid grid-cols-[3fr_2fr_90px_32px] gap-2 pb-1.5 border-b border-[#e9ecef] mb-2 text-[10px] font-bold uppercase tracking-wider text-[#adb5bd]">
            <span>Activity description</span>
            <span>Material / type</span>
            <span>Qty</span>
            <span></span>
          </div>

          {/* Dynamic Rows */}
          <div className="flex flex-col gap-3 sm:gap-2 mb-4 sm:mb-3">
            {activities.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-[3fr_2fr_90px_32px] gap-2.5 sm:gap-2 items-start bg-slate-50/80 sm:bg-gray-50/50 p-3.5 sm:p-0 rounded-2xl sm:rounded-lg border border-slate-200 sm:border-0 shadow-sm sm:shadow-none relative"
              >
                <div className="flex items-center justify-between sm:hidden pb-1 border-b border-slate-200">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1e7aaa]">
                    Work Activity #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(row.id)}
                    className="text-slate-400 hover:text-red-600 p-1 active:scale-95 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <div>
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1 mt-1">Activity Description</span>
                  <input
                    type="text"
                    placeholder="Describe work activity"
                    value={row.description}
                    onChange={(e) => handleUpdateActivity(row.id, 'description', e.target.value)}
                    className="w-full px-3 sm:px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20"
                  />
                </div>

                <div className="grid grid-cols-[1fr_90px] gap-2 sm:contents pt-1 sm:pt-0">
                  <div>
                    <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1">Material / Type</span>
                    <select
                      value={row.material}
                      onChange={(e) => handleUpdateActivity(row.id, 'material', e.target.value)}
                      className="w-full px-3 sm:px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 text-gray-800"
                    >
                      <option value="">Select type...</option>
                      {(activityType === 'fiber' ? FIBER_MATERIAL_TYPES : CONSTRUCTION_MATERIAL_TYPES).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1">Qty</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.quantity}
                      onChange={(e) => handleUpdateActivity(row.id, 'quantity', e.target.value)}
                      className="w-full sm:w-[68px] px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] text-center font-bold sm:font-semibold focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveActivity(row.id)}
                  className="hidden sm:flex h-8 w-8 border border-[#dee2e6] rounded bg-white text-[#adb5bd] hover:bg-[#fdf0ee] hover:text-[#c0392b] hover:border-[#c0392b] items-center justify-center transition sm:mt-0.5 ml-auto sm:ml-0 print:hidden"
                  title="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddActivity}
            className="w-full py-2 border-2 border-dashed border-[#dee2e6] rounded-lg text-[13px] text-[#6c757d] hover:border-[#29a9e1] hover:text-[#29a9e1] hover:bg-[#e8f6fb] transition font-medium flex items-center justify-center gap-1.5 print:hidden"
          >
            <Plus className="w-4 h-4" /> Add activity row
          </button>
        </div>
      </div>

      {/* 3. MOT Activity */}
      <div className="max-w-[860px] mx-auto mb-4 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border print:border-gray-300 print:mb-3">
        <div className="bg-[#1e7aaa] px-5 py-3 flex items-center gap-2.5 text-white">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <div>
            <strong className="text-[13px] font-semibold block leading-tight">MOT activity</strong>
            <span className="text-[11px] opacity-80 block">Maintenance of traffic</span>
          </div>
        </div>
        <div className="p-5">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_80px_32px] gap-2 pb-1.5 border-b border-[#e9ecef] mb-2 text-[10px] font-bold uppercase tracking-wider text-[#adb5bd]">
            <span>Activity</span>
            <span>Code</span>
            <span>Hours</span>
            <span></span>
          </div>

          <div className="flex flex-col gap-3 sm:gap-2 mb-4 sm:mb-3">
            {motItems.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_80px_32px] gap-2.5 sm:gap-2 items-start bg-slate-50/80 sm:bg-gray-50/50 p-3.5 sm:p-0 rounded-2xl sm:rounded-lg border border-slate-200 sm:border-0"
              >
                <div className="flex items-center justify-between sm:hidden pb-1 border-b border-slate-200">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1e7aaa]">
                    MOT Item #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMot(row.id)}
                    className="text-slate-400 hover:text-red-600 p-1 active:scale-95 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <div>
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1 mt-1">MOT Description</span>
                  <input
                    type="text"
                    placeholder="MOT activity description"
                    value={row.activity}
                    onChange={(e) => handleUpdateMot(row.id, 'activity', e.target.value)}
                    className="w-full px-3 sm:px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1]"
                  />
                </div>

                <div className="grid grid-cols-[1fr_80px] gap-2 sm:contents">
                  <div>
                    <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1">Code</span>
                    <input
                      type="text"
                      placeholder="Code"
                      value={row.code}
                      onChange={(e) => handleUpdateMot(row.id, 'code', e.target.value)}
                      className="w-full px-3 sm:px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] uppercase font-mono focus:bg-white focus:outline-none focus:border-[#29a9e1]"
                    />
                  </div>
                  <div>
                    <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1">Hours</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0.0"
                      value={row.hours}
                      onChange={(e) => handleUpdateMot(row.id, 'hours', e.target.value)}
                      className="w-full sm:w-[68px] px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] text-center font-bold sm:font-semibold focus:bg-white focus:outline-none focus:border-[#29a9e1]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMot(row.id)}
                  className="hidden sm:flex h-8 w-8 border border-[#dee2e6] rounded bg-white text-[#adb5bd] hover:bg-[#fdf0ee] hover:text-[#c0392b] hover:border-[#c0392b] items-center justify-center transition sm:mt-0.5 ml-auto sm:ml-0 print:hidden"
                  title="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddMot}
            className="w-full py-2 border-2 border-dashed border-[#dee2e6] rounded-lg text-[13px] text-[#6c757d] hover:border-[#29a9e1] hover:text-[#29a9e1] hover:bg-[#e8f6fb] transition font-medium flex items-center justify-center gap-1.5 print:hidden"
          >
            <Plus className="w-4 h-4" /> Add MOT row
          </button>
        </div>
      </div>

      {/* 4. Notes & Deviations */}
      <div className="max-w-[860px] mx-auto mb-4 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border print:border-gray-300 print:mb-3">
        <div className="bg-[#1e7aaa] px-5 py-3 flex items-center gap-2.5 text-white">
          <FileText className="w-4 h-4 flex-shrink-0" />
          <div>
            <strong className="text-[13px] font-semibold block leading-tight">Notes & deviations</strong>
            <span className="text-[11px] opacity-80 block">Issues, changes, and next day plan</span>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
              Revisions / deviations from design
            </label>
            <textarea
              rows={3}
              placeholder="Describe any changes from the approved design..."
              value={revisions}
              onChange={(e) => setRevisions(e.target.value)}
              className="w-full p-2.5 border border-[#dee2e6] rounded-lg text-[13px] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 transition resize-y"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
              Issues or damages
            </label>
            <textarea
              rows={3}
              placeholder="Utility strikes, access issues, damage to property..."
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              className="w-full p-2.5 border border-[#dee2e6] rounded-lg text-[13px] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 transition resize-y"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
              Contractor plan for next day
            </label>
            <textarea
              rows={3}
              placeholder="What the crew plans to accomplish tomorrow..."
              value={nextDay}
              onChange={(e) => setNextDay(e.target.value)}
              className="w-full p-2.5 border border-[#dee2e6] rounded-lg text-[13px] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 transition resize-y"
            />
          </div>
        </div>
      </div>

      {/* 5. Sign-off */}
      <div className="max-w-[860px] mx-auto mb-6 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border print:border-gray-300 print:mb-4">
        <div className="bg-[#1e7aaa] px-5 py-3 flex items-center gap-2.5 text-white">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <div>
            <strong className="text-[13px] font-semibold block leading-tight">Sign-off</strong>
            <span className="text-[11px] opacity-80 block">Contractor and supervisor acknowledgment</span>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
              Contractor signature
            </label>
            <input
              type="text"
              placeholder="Type full name as signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full py-2 font-serif italic text-base border-0 border-b-2 border-[#ced4da] rounded-none bg-transparent focus:outline-none focus:border-[#29a9e1] focus:ring-0 px-0 transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
              Supervisor / reviewer
            </label>
            <input
              type="text"
              placeholder="Supervisor name"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              className="w-full px-2.5 py-2 border border-[#dee2e6] rounded-lg text-[13px] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 transition"
            />
          </div>
        </div>
      </div>

      {/* Form Footer Action Buttons (Not in Print) */}
      <div className="max-w-[860px] mx-auto flex flex-col sm:flex-row gap-3.5 sm:gap-3 print:hidden mb-6">
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex-1 py-3.5 sm:py-3 px-5 bg-[#1e7aaa] hover:bg-[#1a6b8a] active:scale-[0.99] disabled:opacity-75 text-white rounded-xl sm:rounded-lg font-bold sm:font-semibold text-sm shadow-[0_4px_12px_rgba(30,122,170,0.25)] flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Download className="w-4 h-4 animate-bounce" />
          {generating ? 'Generating .docx...' : 'Generate Word Report (.docx)'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!validateForm()) return;
            setIsEmailModalOpen(true);
          }}
          className="flex-1 py-3.5 sm:py-3 px-5 bg-[#1e3a5f] hover:bg-[#152e4d] active:scale-[0.99] text-white rounded-xl sm:rounded-lg font-bold sm:font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Mail className="w-4 h-4 text-[#29a9e1]" />
          Email Report Dispatcher
        </button>
        
        <div className="flex gap-2.5 sm:gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-5 py-3.5 sm:py-3 bg-white hover:bg-gray-100 text-[#495057] border border-[#dee2e6] rounded-xl sm:rounded-lg font-bold sm:font-medium text-xs sm:text-[13px] transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-gray-600" /> Print
          </button>
          
          <button
            type="button"
            onClick={handleClearForm}
            className="flex-1 sm:flex-none px-5 py-3.5 sm:py-3 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 hover:border-red-300 border border-[#dee2e6] rounded-xl sm:rounded-lg font-bold sm:font-medium text-xs sm:text-[13px] transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Devices Only */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] flex items-center gap-2.5 sm:hidden z-40 print:hidden">
        <button
          type="button"
          onClick={() => {
            if (!validateForm()) return;
            setIsEmailModalOpen(true);
          }}
          className="flex-[1.5] py-3 px-3 bg-[#29a9e1] active:bg-[#1e7aaa] text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
        >
          <Mail className="w-4 h-4" /> ⚡ 1-Click Dispatch
        </button>
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex-1 py-3 px-2 bg-[#1e3a5f] active:bg-[#152e4d] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-[#29a9e1]" /> .docx Only
        </button>
      </div>

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        data={currentReportData}
        onGenerateReport={handleGenerateReport}
        generating={generating}
      />

      {/* Floating Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg text-white text-sm font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 pointer-events-none z-50 flex items-center gap-2 ${
          toast.error ? 'bg-[#c0392b]' : 'bg-[#2d9e6b]'
        } ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        {toast.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        <span>{toast.msg}</span>
      </div>
    </div>
  );
};

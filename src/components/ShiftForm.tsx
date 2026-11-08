import React, { useState, useEffect, useMemo } from 'react';
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
  Save,
  BookOpen,
  Cloud,
  CloudOff,
  RefreshCw,
  Send
} from 'lucide-react';
import { ShiftReportData, ActivityRow, MotRow, CONSTRUCTION_MATERIAL_TYPES, FIBER_MATERIAL_TYPES, ACTIVITY_DESCRIPTIONS, MOT_ACTIVITIES, MOT_CODES, EosPayload, EosQuantities } from '../types';
import { generateDocxBlob, generateDocxBase64, getFilename } from '../utils/docxGenerator';
import { getLogoBase64 } from '../utils/logo';
import { saveDraftToStorage, loadDraftFromStorage, clearDraftFromStorage } from '../utils/indexedDb';
import { MARKETS, Market } from '../config';
import { EmailModal } from './EmailModal';
import {
  cleanProjectId,
  isValidProjectId,
  recordRecentProjectId,
  getRecentProjectIds,
  generateSubmissionId,
  sendPayloadToWebhook,
  enqueueReport,
  initQueueEngine,
  subscribeQueueCount,
  processQueue,
  cleanExpiredRecentSubmissions,
  recordRecentSubmission,
  findRecentDuplicateSubmission,
  formatSentAtTime
} from '../utils/syncQueue';

interface ShiftFormProps {
  onOpenHtmlModal: () => void;
  onOpenGuideModal: () => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({ onOpenHtmlModal, onOpenGuideModal }) => {
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

  // Queue state
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSubmittingToWebhook, setIsSubmittingToWebhook] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Repeat warning state (Modal 1)
  const [repeatWarning, setRepeatWarning] = useState<{
    show: boolean;
    projectId: string;
    market: string;
    contractor: string;
    sentAtTime: string;
  } | null>(null);

  // Submitted screen state (shows after successful send)
  const [submittedScreenData, setSubmittedScreenData] = useState<{
    projectId: string;
    market: string;
    contractor: string;
    reportDate: string;
    quantities: EosQuantities;
    itemId: string;
  } | null>(null);

  // Form State
  const [submissionId, setSubmissionId] = useState<string>(() => generateSubmissionId());
  const [date, setDate] = useState<string>('');
  const [market, setMarket] = useState<Market | ''>('');
  const [projectId, setProjectId] = useState<string>('');
  const [projectIdError, setProjectIdError] = useState<boolean>(false);
  const [contractor, setContractor] = useState<string>('');
  const [submittedBy, setSubmittedBy] = useState<string>('');
  const [startAddress, setStartAddress] = useState<string>('');
  const [endAddress, setEndAddress] = useState<string>('');
  const [activityType, setActivityType] = useState<'construction' | 'fiber'>('construction');
  const [revisions, setRevisions] = useState<string>('');
  const [issues, setIssues] = useState<string>('');
  const [nextDay, setNextDay] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [supervisor, setSupervisor] = useState<string>('');

  // Drill Footage (ft) manual entry
  const [drillFootage, setDrillFootage] = useState<string>('0');

  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [motItems, setMotItems] = useState<MotRow[]>([]);

  const showToast = (msg: string, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500);
  };

  const initDefaultRows = () => {
    const defaultMats = [
      '1.25" Conduit Bore',
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

    // Remove entries older than 6 hours whenever the app loads (Requirement 2)
    cleanExpiredRecentSubmissions();

    // Offline Queue subscription & auto-retry engine
    const cleanupQueueEngine = initQueueEngine();
    const unsubscribeCount = subscribeQueueCount((count) => setQueueCount(count));

    // Offline Draft Recovery
    loadDraftFromStorage().then((draft) => {
      if (
        draft &&
        (draft.projectId ||
          draft.market ||
          draft.project ||
          draft.contractor ||
          draft.submittedBy ||
          draft.drillFootage ||
          draft.totalFootage ||
          draft.activities?.some((a: any) => a.description || a.quantity) ||
          draft.motItems?.some((m: any) => m.activity || m.hours))
      ) {
        if (draft.submissionId) setSubmissionId(draft.submissionId);
        setDate(draft.date || now.toISOString().split('T')[0]);
        setMarket((draft.market as Market) || '');
        setProjectId(draft.projectId || draft.project || '');
        setContractor(draft.contractor || '');
        setSubmittedBy(draft.submittedBy || '');
        setDrillFootage(draft.drillFootage !== undefined ? String(draft.drillFootage) : (draft.totalFootage || '0'));
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

    return () => {
      cleanupQueueEngine();
      unsubscribeCount();
    };
  }, []);

  // Auto-Save Effect on keystroke / form state change
  useEffect(() => {
    if (!date) return;
    const timer = setTimeout(() => {
      saveDraftToStorage({
        submissionId,
        date,
        market,
        projectId,
        project: projectId || '',
        contractor,
        submittedBy,
        drillFootage,
        totalFootage: drillFootage,
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
  }, [submissionId, date, market, projectId, contractor, submittedBy, drillFootage, startAddress, endAddress, activityType, revisions, issues, nextDay, signature, supervisor, activities, motItems]);

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
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // Helper to parse integer quantity, defaulting empty/blank to 0
  const parseQty = (val: string): number => {
    if (!val || !val.trim()) return 0;
    const n = parseInt(val, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  /**
   * Automatically derives the 5 SOW quantities from the Construction EOS activity rows
   * and the Total Drill Footage input.
   */
  const computedQuantities: EosQuantities = useMemo(() => {
    let tobyCount = 0;
    let dapCount = 0;
    let handHoleCount = 0;
    let fdhCount = 0;

    for (const act of activities) {
      const mat = (act.material || '').trim().toLowerCase();
      const qty = parseQty(act.quantity);
      if (qty <= 0) continue;

      if (mat.includes('toby')) {
        tobyCount += qty;
      } else if (mat.includes('dap')) {
        dapCount += qty;
      } else if (mat.includes('hand hole') || mat.includes('handhole') || mat.includes('vault')) {
        handHoleCount += qty;
      } else if (mat.includes('fdh')) {
        fdhCount += qty;
      }
    }

    return {
      drillFootage: parseQty(drillFootage),
      tobyBoxes: tobyCount,
      daps: dapCount,
      handHoles: handHoleCount,
      fdh: fdhCount
    };
  }, [activities, drillFootage]);

  const handleClearForm = () => {
    clearDraftFromStorage();
    setLastAutoSaved('');
    const now = new Date();
    setSubmissionId(generateSubmissionId());
    setDate(now.toISOString().split('T')[0]);
    setMarket('');
    setProjectId('');
    setProjectIdError(false);
    setContractor('');
    setSubmittedBy('');
    setDrillFootage('0');
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

  // Suggestion list for the currently selected market
  const recentProjectsForMarket = useMemo(() => {
    return getRecentProjectIds(market);
  }, [market]);

  const handleProjectIdBlur = () => {
    if (!projectId) return;
    const cleaned = cleanProjectId(projectId);
    setProjectId(cleaned);
    const valid = isValidProjectId(cleaned);
    setProjectIdError(!valid);
  };

  const currentReportData: ShiftReportData = {
    submissionId,
    date,
    market,
    projectId,
    project: projectId || 'Tillman Fiber',
    contractor,
    submittedBy,
    vendor: 'ITG Communications',
    totalFootage: drillFootage,
    quantities: computedQuantities,
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
    if (!market || !market.trim()) errs.market = true;
    
    const cleaned = cleanProjectId(projectId);
    if (!cleaned || !isValidProjectId(cleaned)) {
      errs.projectId = true;
      setProjectIdError(true);
    } else {
      setProjectIdError(false);
    }

    if (!contractor || !contractor.trim()) errs.contractor = true;
    if (!submittedBy || !submittedBy.trim()) errs.submittedBy = true;

    setValidationErrors(errs);
    const missing: string[] = [];
    if (errs.date) missing.push('Date');
    if (errs.market) missing.push('Market');
    if (errs.projectId) missing.push('Valid Project ID');
    if (errs.contractor) missing.push('Contractor Name');
    if (errs.submittedBy) missing.push('Submitted By');

    if (missing.length > 0) {
      showToast(`⚠️ Please check required fields: ${missing.join(', ')}`, true);
      window.scrollTo({ top: 60, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  /**
   * Builds the exact JSON payload matching Requirement 6
   */
  const buildEosPayload = async (): Promise<EosPayload> => {
    const cleanedId = cleanProjectId(projectId);
    const reportDateIso = date || new Date().toISOString().split('T')[0];
    const fileName = getFilename(currentReportData);

    // 1. Generate DOCX as raw Base64 (no "data:" prefix)
    const { base64 } = await generateDocxBase64(currentReportData, fileName);

    // 2. Footage by method text summary
    const footageLines = activities
      .filter((a) => a.description && ACTIVITY_DESCRIPTIONS.includes(a.description as any))
      .map((a) => `• ${a.description}: ${a.quantity || '0'}${a.material ? ` (${a.material})` : ''}`);
    const footageByMethodText = [
      drillFootage && drillFootage !== '0' ? `• Drill Footage: ${drillFootage} ft` : '',
      ...footageLines
    ]
      .filter(Boolean)
      .join('\n');

    // 3. Materials summary text
    const validActivities = activities.filter(
      (a) => a.material && a.material !== 'Select type...' && (a.quantity || a.description)
    );
    const materialsSummaryText = validActivities
      .map(
        (a) =>
          `• ${a.material}: ${a.quantity || '0'} ${a.description ? `(${a.description})` : ''}`.trim()
      )
      .join('\n');

    // 4. MOT summary text
    const validMot = motItems.filter((m) => m.activity.trim() || m.code.trim());
    const motSummaryText = validMot
      .map((m) => `• ${m.activity || 'MOT'} [Code: ${m.code || 'N/A'}] - ${m.hours || '0'} hrs`)
      .join('\n');

    const deviations = [
      issues ? `Issues: ${issues}` : '',
      revisions ? `Revisions: ${revisions}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    return {
      submissionId,
      reportDate: reportDateIso,
      market,
      projectId: cleanedId,
      project: 'Tillman Fiber',
      vendor: 'ITG Communications',
      contractor: contractor.trim(),
      submittedBy: submittedBy.trim(),
      startAddress: startAddress.trim(),
      endAddress: endAddress.trim(),
      deviations,
      quantities: computedQuantities,
      footageByMethodText,
      materialsSummaryText,
      motSummaryText,
      fileName,
      fileBase64: base64
    };
  };

  /**
   * Internal submission to Power Automate / SharePoint
   */
  const submitToSharePoint = async (): Promise<boolean> => {
    setIsSubmittingToWebhook(true);

    try {
      const payload = await buildEosPayload();

      // Remember Project ID for this market
      recordRecentProjectId(payload.market, payload.projectId);

      // Attempt immediate send with 120s timeout
      const result = await sendPayloadToWebhook(payload);

      if (result.success) {
        const itemMsg = result.itemId ? ` (item #${result.itemId})` : '';
        showToast(`Saved to SharePoint${itemMsg}`);

        // 2. Remember recent submissions in localStorage under "eosRecentSubmissions" (Requirement 2)
        recordRecentSubmission({
          projectId: payload.projectId,
          market: payload.market,
          contractor: payload.contractor,
          reportDate: payload.reportDate,
          sentAt: new Date().toISOString()
        });

        // 1. After successful send: DO NOT close window or reset form automatically.
        // Show "Submitted" screen (Requirement 1)
        setSubmittedScreenData({
          projectId: payload.projectId,
          market: payload.market,
          contractor: payload.contractor,
          reportDate: payload.reportDate,
          quantities: payload.quantities,
          itemId: result.itemId ? String(result.itemId) : (result.duplicate ? 'Duplicate' : 'Verified')
        });

        // Close email modal if it was open so the Submitted screen is visible
        setIsEmailModalOpen(false);
        return true;
      } else {
        // Enqueue offline in IndexedDB
        await enqueueReport(payload);
        showToast('Saved offline. Will send automatically.', true);
        return false;
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      try {
        const payload = await buildEosPayload();
        await enqueueReport(payload);
        showToast('Saved offline. Will send automatically.', true);
      } catch {
        showToast('Error preparing submission. Please try again.', true);
      }
      return false;
    } finally {
      setIsSubmittingToWebhook(false);
    }
  };

  /**
   * Tapping Submit Report button:
   * 1. Validates the form
   * 2. Checks eosRecentSubmissions for an entry with same projectId, market, contractor and reportDate in last 6h
   * 3. If duplicate found -> show repeat warning modal
   * 4. If no duplicate -> continue to normal confirmation modal
   */
  const handleInitiateSubmit = () => {
    if (!validateForm()) return;

    const cleanedId = cleanProjectId(projectId);
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check for repeat in last 6 hours
    const duplicateCheck = findRecentDuplicateSubmission(cleanedId, market, contractor, targetDate);
    if (duplicateCheck.found && duplicateCheck.entry) {
      setRepeatWarning({
        show: true,
        projectId: cleanedId,
        market,
        contractor: contractor.trim(),
        sentAtTime: formatSentAtTime(duplicateCheck.entry.sentAt)
      });
      return;
    }

    // No repeat found -> continue to normal confirmation
    setShowConfirmModal(true);
  };

  /**
   * Action when continuing from Repeat Warning to normal confirmation
   */
  const handleContinueFromWarning = () => {
    setRepeatWarning(null);
    setShowConfirmModal(true);
  };

  /**
   * Executed when the user clicks "Confirm" in the confirmation modal.
   * Opens the Email Modal / Dispatch flow (or direct dispatch).
   */
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsEmailModalOpen(true);
  };

  /**
   * Direct submit from confirmation modal if user wants 1-click submit directly
   */
  const handleConfirmAndDirectSubmit = async () => {
    setShowConfirmModal(false);
    await submitToSharePoint();
  };

  /**
   * Resets form and creates a new submissionId (Only called by "Start a new EOS" button)
   */
  const handleStartNewEos = () => {
    setSubmittedScreenData(null);
    handleClearForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {/* Page Header Card */}
      <div className="max-w-[860px] mx-auto mb-4 sm:mb-5 bg-white rounded-2xl sm:rounded-xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-100 print:shadow-none print:border print:border-gray-300 print:mb-3">
        {logoSrc ? (
          <img src={logoSrc} className="h-[120px] sm:h-[140px] w-auto block object-contain" alt="LSCG Logo" />
        ) : (
          <div className="h-[120px] sm:h-[140px] w-[440px] sm:w-[480px] bg-gray-100 animate-pulse rounded flex items-center justify-center font-bold text-[#1e3a5f]">
            LSCG LOGO
          </div>
        )}
        <div className="w-full sm:w-auto text-left sm:text-right flex-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <div className="flex items-center justify-start sm:justify-end gap-2 mb-2 print:hidden">
            <button
              type="button"
              onClick={onOpenGuideModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f6fb] text-[#1e7aaa] hover:bg-[#d4f0fc] border border-[#29a9e1]/20 shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#29a9e1]" />
              User Guide / PDF Guide
            </button>
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
        <div className="bg-[#1e7aaa] px-4 sm:px-5 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong className="text-[13px] font-semibold block leading-tight">General information</strong>
              <span className="text-[11px] opacity-80 block">Report header details (* Required fields)</span>
            </div>
          </div>
          {queueCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-100 border border-amber-300/40">
              <CloudOff className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{queueCount} waiting to send</span>
            </div>
          )}
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
              <label className={`text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider ${validationErrors.market ? 'text-red-600' : 'text-[#6c757d]'}`}>
                Market <span className="text-red-500">*</span>
              </label>
              <select
                value={market}
                onChange={(e) => {
                  setMarket(e.target.value as Market);
                  if (validationErrors.market) setValidationErrors((prev) => ({ ...prev, market: false }));
                }}
                className={`w-full px-3 sm:px-2.5 py-2.5 sm:py-2 border rounded-xl sm:rounded-lg text-sm sm:text-[13px] transition font-medium ${
                  validationErrors.market
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 text-red-900'
                    : 'border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 text-slate-800'
                }`}
              >
                <option value="">Select market...</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider ${projectIdError || validationErrors.projectId ? 'text-red-600' : 'text-[#6c757d]'}`}>
                Project ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="eos-recent-projects-list"
                placeholder="e.g. BHCD-FPW-03-E"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  if (projectIdError) setProjectIdError(false);
                  if (validationErrors.projectId) setValidationErrors((prev) => ({ ...prev, projectId: false }));
                }}
                onBlur={handleProjectIdBlur}
                className={`w-full px-3 sm:px-2.5 py-2.5 sm:py-2 border rounded-xl sm:rounded-lg text-sm sm:text-[13px] uppercase font-mono tracking-wider transition ${
                  projectIdError || validationErrors.projectId
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 text-red-900 placeholder-red-400 font-medium'
                    : 'border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20'
                }`}
              />
              <datalist id="eos-recent-projects-list">
                {recentProjectsForMarket.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
              {projectIdError && (
                <span className="text-[11px] font-bold text-red-600 mt-0.5">
                  Check the Project ID (3-30 chars, letters and numbers)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-3 mb-3.5 sm:mb-3">
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider ${validationErrors.contractor ? 'text-red-600' : 'text-[#6c757d]'}`}>
                Contractor name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contractor / Foreman Name"
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

            <div className="flex flex-col gap-1">
              <label className="text-[11px] sm:text-[10px] font-extrabold sm:font-bold uppercase tracking-wider text-[#6c757d]">Vendor</label>
              <div className="px-3.5 sm:px-3 py-2.5 sm:py-2 bg-[#e8f6fb] border border-[#b3dff0] rounded-xl sm:rounded-lg text-sm sm:text-[13px] font-semibold text-[#1a6b8a] truncate">
                ITG Communications
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

      {/* 3. Work Activities */}
      <div className="max-w-[860px] mx-auto mb-4 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border print:border-gray-300 print:mb-3">
        <div className="bg-[#1e7aaa] px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong className="text-[13px] font-semibold block leading-tight">
                {activityType === 'fiber' ? 'Fiber EOS' : 'Construction EOS'}
              </strong>
              <span className="text-[11px] opacity-80 block">Additional work completed this shift (kept on report & Word doc)</span>
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
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#e8f6fb] border border-[#b3dff0] rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1a6b8a]">
                    Total drill footage:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={drillFootage}
                      onChange={(e) => setDrillFootage(e.target.value)}
                      className="w-24 px-2 py-1.5 border border-[#b3dff0] rounded-lg text-sm font-bold text-[#1a6b8a] bg-white text-center focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 shadow-inner"
                    />
                    <span className="text-sm font-bold text-[#1a6b8a]">FT</span>
                  </div>
                </div>

                {/* Live SOW counts derived automatically from rows */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#1a6b8a]">
                  <span className="px-2 py-1 bg-white/80 rounded border border-[#b3dff0]">
                    Toby Boxes: <strong>{computedQuantities.tobyBoxes}</strong>
                  </span>
                  <span className="px-2 py-1 bg-white/80 rounded border border-[#b3dff0]">
                    DAPs: <strong>{computedQuantities.daps}</strong>
                  </span>
                  <span className="px-2 py-1 bg-white/80 rounded border border-[#b3dff0]">
                    Hand Holes: <strong>{computedQuantities.handHoles}</strong>
                  </span>
                  <span className="px-2 py-1 bg-white/80 rounded border border-[#b3dff0]">
                    FDH: <strong>{computedQuantities.fdh}</strong>
                  </span>
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
                  <select
                    value={row.description}
                    onChange={(e) => handleUpdateActivity(row.id, 'description', e.target.value)}
                    className="w-full px-3 sm:px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 text-gray-800"
                  >
                    <option value="">Select activity...</option>
                    {ACTIVITY_DESCRIPTIONS.map((desc) => (
                      <option key={desc} value={desc}>
                        {desc}
                      </option>
                    ))}
                  </select>
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
          <div className="hidden sm:grid grid-cols-[1.3fr_1.7fr_80px_32px] gap-2 pb-1.5 border-b border-[#e9ecef] mb-2 text-[10px] font-bold uppercase tracking-wider text-[#adb5bd]">
            <span>Activity</span>
            <span>Code</span>
            <span>Hours</span>
            <span></span>
          </div>

          <div className="flex flex-col gap-3 sm:gap-2 mb-4 sm:mb-3">
            {motItems.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-[1.3fr_1.7fr_80px_32px] gap-2.5 sm:gap-2 items-start bg-slate-50/80 sm:bg-gray-50/50 p-3.5 sm:p-0 rounded-2xl sm:rounded-lg border border-slate-200 sm:border-0"
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
                  <select
                    value={row.activity}
                    onChange={(e) => handleUpdateMot(row.id, 'activity', e.target.value)}
                    title={row.activity}
                    className="w-full px-3 sm:px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] text-gray-800"
                  >
                    <option value="">Select MOT description...</option>
                    {MOT_ACTIVITIES.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-[1fr_80px] gap-2 sm:contents">
                  <div>
                    <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1">Code</span>
                    <select
                      value={row.code}
                      onChange={(e) => handleUpdateMot(row.id, 'code', e.target.value)}
                      title={row.code}
                      className="w-full px-3 sm:px-2 py-2 sm:py-1.5 border border-[#dee2e6] rounded-xl sm:rounded text-sm sm:text-[13px] bg-white sm:bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] text-gray-800"
                    >
                      <option value="">Select code...</option>
                      {MOT_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
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
          <Download className="w-4 h-4" />
          {generating ? 'Generating .docx...' : 'Generate Word Report (.docx)'}
        </button>

        <button
          type="button"
          onClick={handleInitiateSubmit}
          disabled={isSubmittingToWebhook}
          className="flex-1 py-3.5 sm:py-3 px-5 bg-[#1e3a5f] hover:bg-[#152e4d] active:scale-[0.99] text-white rounded-xl sm:rounded-lg font-bold sm:font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-75"
        >
          {isSubmittingToWebhook ? (
            <>
              <RefreshCw className="w-4 h-4 text-[#29a9e1] animate-spin" />
              Sending to SharePoint...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-[#29a9e1]" />
              Submit Report
            </>
          )}
        </button>

        <div className="flex gap-2.5 sm:gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-4 py-3.5 sm:py-3 bg-white hover:bg-gray-100 text-[#495057] border border-[#dee2e6] rounded-xl sm:rounded-lg font-bold sm:font-medium text-xs sm:text-[13px] transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-gray-600" /> Print
          </button>
          
          <button
            type="button"
            onClick={handleClearForm}
            className="flex-1 sm:flex-none px-4 py-3.5 sm:py-3 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 hover:border-red-300 border border-[#dee2e6] rounded-xl sm:rounded-lg font-bold sm:font-medium text-xs sm:text-[13px] transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Devices Only */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] flex items-center gap-2.5 sm:hidden z-40 print:hidden">
        <button
          type="button"
          onClick={handleInitiateSubmit}
          disabled={isSubmittingToWebhook}
          className="flex-[1.5] py-3 px-3 bg-[#1e3a5f] active:bg-[#152e4d] text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-75"
        >
          {isSubmittingToWebhook ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#29a9e1]" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-[#29a9e1]" />
              Submit Report
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex-1 py-3 px-2 bg-[#1e7aaa] active:bg-[#166085] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-white" /> .docx Only
        </button>
      </div>

      {/* Requirement 3: Warn Before a Repeat Modal */}
      {repeatWarning && repeatWarning.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Previous Submission Detected
                </h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Recent shift report found within the last 6 hours
                </p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-sm text-slate-800 leading-relaxed mb-6">
              An EOS for <strong className="font-mono text-slate-950 font-bold">{repeatWarning.projectId}</strong> (<strong className="text-slate-950 font-semibold">{repeatWarning.market}</strong>, <strong className="text-slate-950 font-semibold">{repeatWarning.contractor}</strong>) was already sent at <strong className="text-slate-950 font-semibold">{repeatWarning.sentAtTime}</strong>. If you need to fix a mistake, contact the policing team instead of resubmitting. If this is a separate shift, you can still submit, but it will be held for review.
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setRepeatWarning(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-800 border border-slate-300 rounded-xl font-bold text-sm transition text-center shadow-xs"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={handleContinueFromWarning}
                className="flex-1 py-3 px-4 bg-[#1e3a5f] hover:bg-[#152e4d] active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                Submit for review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 2: Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-[#e8f6fb] rounded-xl text-[#1a6b8a]">
                <Send className="w-6 h-6 text-[#1a6b8a]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Confirm Submission
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Power Automate & SharePoint Auto-Sync
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed mb-6">
              Submitting for <strong className="text-slate-900 font-mono">{cleanProjectId(projectId)}</strong> on the <strong className="text-slate-900">{market}</strong> sheet. If this project isn't on that sheet yet, it will be added as a new row.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm transition"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 px-4 bg-[#1e3a5f] hover:bg-[#152e4d] text-white rounded-xl font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-[#29a9e1]" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 1: Submitted Screen (Only "Start a new EOS" resets form and generates fresh submissionId) */}
      {submittedScreenData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            {/* Header Banner */}
            <div className="bg-emerald-600 p-6 text-white text-center flex flex-col items-center justify-center relative">
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Submitted</h2>
              <p className="text-sm font-semibold text-emerald-100 mt-1">
                Saved to SharePoint (item #{submittedScreenData.itemId})
              </p>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Core Information Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3.5">
                  Shift Report Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Project ID</span>
                    <span className="font-mono font-bold text-slate-900 text-base">
                      {submittedScreenData.projectId}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Market</span>
                    <span className="font-bold text-slate-900 text-base">
                      {submittedScreenData.market}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Contractor</span>
                    <span className="font-semibold text-slate-900">
                      {submittedScreenData.contractor}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Shift Date</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {submittedScreenData.reportDate}
                    </span>
                  </div>
                  <div className="flex flex-col sm:col-span-2 pt-2 border-t border-slate-200/80">
                    <span className="text-xs text-slate-500 font-medium">SharePoint Item Number</span>
                    <span className="font-mono font-extrabold text-emerald-700 text-base">
                      item #{submittedScreenData.itemId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Five Quantities Section */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#1e3a5f] flex items-center justify-between">
                  <span>Reported SOW Quantities</span>
                  <span className="text-slate-400 font-normal lowercase">(sent to sheet)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-2">
                  <div className="p-3 bg-[#e8f6fb] border border-[#b3dff0] rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold uppercase text-[#1a6b8a] tracking-wider">
                      Drill Footage
                    </span>
                    <span className="text-lg font-black text-[#1e3a5f] mt-0.5">
                      {submittedScreenData.quantities.drillFootage}
                      <span className="text-xs font-semibold ml-0.5 text-[#1a6b8a]">ft</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Toby Boxes
                    </span>
                    <span className="text-lg font-black text-slate-900 mt-0.5">
                      {submittedScreenData.quantities.tobyBoxes}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      DAPs
                    </span>
                    <span className="text-lg font-black text-slate-900 mt-0.5">
                      {submittedScreenData.quantities.daps}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Hand Holes
                    </span>
                    <span className="text-lg font-black text-slate-900 mt-0.5">
                      {submittedScreenData.quantities.handHoles}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      FDH
                    </span>
                    <span className="text-lg font-black text-slate-900 mt-0.5">
                      {submittedScreenData.quantities.fdh}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: "Start a new EOS" is the ONLY button that resets form and generates fresh submissionId */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleStartNewEos}
                  className="flex-[2] py-4 px-6 bg-[#1e3a5f] hover:bg-[#152e4d] text-white rounded-2xl font-black text-base shadow-lg hover:shadow-xl active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-[#29a9e1]" />
                  Start a new EOS
                </button>

                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="flex-1 py-4 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  {generating ? 'Downloading...' : 'Download .docx copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal & 1-Click Dispatch Workflow */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        data={currentReportData}
        onGenerateReport={handleGenerateReport}
        onSubmitToSharePoint={submitToSharePoint}
        generating={generating}
        submitting={isSubmittingToWebhook}
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

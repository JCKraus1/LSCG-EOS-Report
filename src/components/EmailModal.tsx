import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  Copy,
  Check,
  Download,
  Send,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ShiftReportData } from '../types';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShiftReportData;
  onGenerateReport: () => Promise<void>;
  generating: boolean;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  data,
  onGenerateReport,
  generating
}) => {
  const [recipients, setRecipients] = useState('');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedTo, setCopiedTo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('lscg_default_email_recipients_v2');
      if (saved) {
        setRecipients(saved);
      } else {
        setRecipients('FLConstruction@lscg.com, TillmanProduction@lscg.com');
      }
    }
  }, [isOpen]);

  const handleRecipientsChange = (val: string) => {
    setRecipients(val);
    localStorage.setItem('lscg_default_email_recipients_v2', val);
  };

  if (!isOpen) return null;

  // Format Date for Subject line (e.g. 06-27-2026)
  let formattedDate = data.date;
  if (data.date && data.date.includes('-')) {
    const [y, m, d] = data.date.split('-');
    formattedDate = `${m}-${d}-${y}`;
  }

  const subject = `${formattedDate} EOS AND REDLINE REPORT ${data.project || 'NO_PROJ'} ${
    data.contractor || 'NO_CONTRACTOR'
  }`.trim();

  // Assemble clean Construction activity summary
  const validActivities = data.activities.filter(
    (a) => a.description.trim() || (a.material && a.material !== 'Select type...')
  );
  const actLines = validActivities
    .map(
      (a) =>
        `• ${a.material || 'Work'}: ${a.description || 'N/A'}${
          a.start || a.end ? ` (${a.start || ''} to ${a.end || ''})` : ''
        }${a.quantity ? ` | Qty: ${a.quantity}` : ''}`
    )
    .join('\n');

  // Assemble MOT summary
  const validMot = data.motItems.filter((m) => m.activity.trim() || m.code.trim());
  const motLines = validMot
    .map((m) => `• ${m.activity || 'MOT'} [Code: ${m.code || 'N/A'}] - ${m.hours || '0'} hrs`)
    .join('\n');

  const attachmentReminder = `\n\n⚠️ ATTACHMENT REMINDER:\nPlease attach the downloaded Word Report (.docx), Redline PDFs, and Site Photos to this email.`;

  const body = `Please see the attached EOS/Redline Report for project # ${
    data.project || 'N/A'
  } by contractor ${data.contractor || 'N/A'}.

═══ CONSTRUCTION ACTIVITY ═══
Total Drill Footage: ${data.totalFootage || '0'} FT
${actLines || '• No specific activity rows logged.'}

═══ MOT ACTIVITY ═══
${motLines || '• No MOT items logged.'}${attachmentReminder}

═══ DEVIATIONS / NOTES ═══
Revisions: ${data.revisions || 'None'}
Issues/Damages: ${data.issues || 'None'}
Next Day Plan: ${data.nextDay || 'None'}

Submitted by: ${data.submittedBy || 'N/A'}
Supervisor: ${data.supervisor || 'N/A'}`;

  const handleCopy = (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleMailto = () => {
    const cleanTo = recipients
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
      .join(',');
    const mailtoUrl = `mailto:${cleanTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
    window.location.href = mailtoUrl;
  };

  const handle1ClickDispatch = async () => {
    await onGenerateReport();
    handleMailto();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1e3a5f] p-5 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#29a9e1]/20 rounded-xl border border-[#29a9e1]/30">
              <Mail className="w-6 h-6 text-[#29a9e1]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Email Report Dispatcher</h2>
              <p className="text-xs text-cyan-200">
                Persistent recipients & automated LSCG template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 text-gray-800">
          {/* Step 1: Recipients */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#29a9e1]" />
                Default Email Recipients (Saved Automatically)
              </label>
              <button
                onClick={() => handleCopy(recipients, setCopiedTo)}
                className="text-xs text-[#1a6b8a] hover:text-[#1e3a5f] font-semibold flex items-center gap-1"
              >
                {copiedTo ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTo ? 'Copied!' : 'Copy List'}
              </button>
            </div>
            <input
              type="text"
              value={recipients}
              onChange={(e) => handleRecipientsChange(e.target.value)}
              placeholder="email1@company.com, email2@company.com"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 transition"
            />
            <p className="text-[11px] text-gray-500 italic">
              Separate multiple email addresses with commas. This list is saved locally in your browser forever.
            </p>
          </div>

          {/* Step 2: Subject Line */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#29a9e1]" />
                Generated Subject Line
              </label>
              <button
                onClick={() => handleCopy(subject, setCopiedSubject)}
                className="text-xs bg-cyan-50 border border-cyan-200 text-[#1a6b8a] hover:bg-cyan-100 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
              >
                {copiedSubject ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSubject ? 'Copied Subject!' : 'Copy Subject'}
              </button>
            </div>
            <div className="p-3 bg-[#e8f6fb] border border-[#b3dff0] rounded-xl font-mono text-sm font-bold text-[#1e3a5f] break-all select-all">
              {subject}
            </div>
          </div>

          {/* Step 3: Email Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#29a9e1]" />
                Generated Email Body
              </label>
              <button
                onClick={() => handleCopy(body, setCopiedBody)}
                className="text-xs bg-cyan-50 border border-cyan-200 text-[#1a6b8a] hover:bg-cyan-100 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
              >
                {copiedBody ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedBody ? 'Copied Body!' : 'Copy Body Text'}
              </button>
            </div>
            <textarea
              readOnly
              value={body}
              rows={10}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs text-gray-800 focus:outline-none focus:bg-white select-all resize-y"
            />
          </div>

          {/* Attachment Reminder Banner */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-950 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold block text-sm text-amber-900 uppercase tracking-wide">
                🚨 Do Not Forget Attachments!
              </span>
              <p className="font-medium text-amber-900 text-[13px] leading-relaxed">
                Please remember to attach your <strong>redlines (PDFs)</strong> and any required <strong>site photos</strong> (along with the downloaded Word Report) to your email draft before hitting Send!
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl flex items-start gap-3 text-xs text-[#1e3a5f]">
            <AlertCircle className="w-5 h-5 text-[#29a9e1] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-sm text-[#154c6f]">💡 Why can't browsers attach files automatically to emails?</span>
              <p>
                For security reasons, web browsers strictly block web pages from silently attaching files from your computer or downloads into Outlook/Gmail drafts.
              </p>
              <p className="font-semibold text-[#1a6b8a]">
                ⚡ How to make it effortless: Click the <span className="bg-[#29a9e1] text-white px-1.5 py-0.5 rounded text-[11px]">⚡ 1-Click Dispatch</span> button below. It instantly downloads your formatted Word report (.docx) AND opens your email draft. Just drag & drop the downloaded report right into the email!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={handle1ClickDispatch}
            disabled={generating}
            className="flex-[2] py-3.5 px-4 bg-[#29a9e1] hover:bg-[#1a6b8a] text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition disabled:opacity-50 active:scale-[0.99]"
          >
            <Send className="w-4 h-4 animate-pulse" />
            {generating ? 'Processing Report & Email...' : '⚡ 1-Click Dispatch (Download Report + Open Email)'}
          </button>

          <button
            type="button"
            onClick={onGenerateReport}
            disabled={generating}
            className="flex-1 py-3.5 px-3 bg-white hover:bg-gray-100 text-[#1e3a5f] border border-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
            title="Download report only without opening email client"
          >
            <Download className="w-3.5 h-3.5 text-[#29a9e1]" />
            {generating ? '...' : 'Only Download .docx'}
          </button>
        </div>
      </div>
    </div>
  );
};

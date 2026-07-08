import React from 'react';
import { X, Printer, BookOpen, Check, HelpCircle, FileText, Smartphone, Laptop, Sparkles, WifiOff } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print/save the user guide as a PDF.');
      return;
    }

    const printElement = document.getElementById('user-guide-print-content');
    const contentHtml = printElement ? printElement.innerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LSCG Daily Shift Report - Team Training & User Guide</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
            
            @page {
              size: letter;
              margin: 0.8in;
            }
            
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              color: #212529;
              line-height: 1.6;
              background-color: #ffffff;
              font-size: 14px;
            }

            .header-container {
              border-bottom: 3px solid #29a9e1;
              padding-bottom: 16px;
              margin-bottom: 28px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .logo-placeholder {
              font-size: 24px;
              font-weight: 800;
              color: #1e3a5f;
              letter-spacing: -0.5px;
            }

            .doc-metadata {
              text-align: right;
              font-size: 11px;
              color: #6c757d;
            }

            h1 {
              color: #1e3a5f;
              font-size: 24px;
              font-weight: 800;
              margin: 0 0 4px 0;
              letter-spacing: -0.5px;
            }

            .subtitle {
              color: #1e7aaa;
              font-size: 14px;
              font-weight: 600;
              margin: 0;
            }

            h2 {
              color: #1e3a5f;
              font-size: 20px;
              font-weight: 800;
              margin-top: 36px;
              margin-bottom: 16px;
              border-bottom: 2px solid #dee2e6;
              padding-bottom: 8px;
              page-break-after: avoid;
            }

            h3 {
              color: #1e7aaa;
              font-size: 15px;
              font-weight: 700;
              margin-top: 24px;
              margin-bottom: 10px;
              page-break-after: avoid;
            }

            p {
              margin: 0 0 12px 0;
            }

            ul, ol {
              margin: 0 0 16px 0;
              padding-left: 20px;
            }

            li {
              margin-bottom: 6px;
            }

            code {
              font-family: 'JetBrains Mono', monospace;
              background-color: #f1f3f5;
              padding: 2px 5px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }

            .tip-box {
              background-color: #f8f9fa;
              border-left: 4px solid #29a9e1;
              padding: 14px 18px;
              border-radius: 0 8px 8px 0;
              margin: 20px 0;
              page-break-inside: avoid;
            }

            .tip-title {
              font-weight: 700;
              color: #1e7aaa;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }

            .tip-body {
              font-size: 13px;
              color: #495057;
              margin: 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 12.5px;
              page-break-inside: avoid;
            }

            th {
              background-color: #1e3a5f;
              color: #ffffff;
              font-weight: 600;
              text-align: left;
              padding: 8px 12px;
              border: 1px solid #1e3a5f;
            }

            td {
              padding: 8px 12px;
              border: 1px solid #dee2e6;
            }

            tr:nth-child(even) td {
              background-color: #f8f9fa;
            }

            .badge {
              display: inline-block;
              background-color: #e8f6fb;
              color: #1e7aaa;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              border: 1px solid #bbeeef;
            }

            .footer {
              margin-top: 40px;
              border-top: 1px solid #dee2e6;
              padding-top: 12px;
              font-size: 10px;
              color: #adb5bd;
              text-align: center;
              page-break-inside: avoid;
            }

            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="logo-placeholder">LSCG GROUP</div>
              <h1>Daily Shift Report</h1>
              <p class="subtitle">Field Operations & Foreman Training Guide</p>
            </div>
            <div class="doc-metadata">
              <div> Tillman Fiber Project </div>
              <div> Document Ref: LSCG-EOD-01 </div>
              <div> Version 2.1 • July 2026 </div>
            </div>
          </div>
          
          ${contentHtml}
          
          <div class="footer">
            LSCG Daily Shift Report Utility • Proprietary & Confidential • Field Training Resource
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1e3a5f] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-[#29a9e1]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Team User Guide & Training Manual</h3>
              <p className="text-xs text-blue-200">Official companion document for LSCG End of Day reporting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50 text-gray-800">
          {/* Print/Save Notice Banner */}
          <div className="mb-6 bg-[#e8f6fb] border border-[#29a9e1]/30 p-4 rounded-xl text-sm text-[#1a6b8a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex gap-2.5">
              <Sparkles className="w-5 h-5 text-[#29a9e1] flex-shrink-0 mt-0.5" />
              <div>
                <strong>Need a PDF to distribute to your crew?</strong>
                <p className="text-xs text-[#52879c] mt-0.5 mb-0">Click the print button. In the browser print menu, select <strong>"Save as PDF"</strong> to download a beautifully formatted, multi-page instruction manual.</p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#1e7aaa] text-white rounded-lg hover:bg-[#1a6b8a] transition shadow-sm font-semibold text-xs whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Save / Print PDF
            </button>
          </div>

          {/* Core Content container used for printing */}
          <div id="user-guide-print-content" className="bg-white p-5 sm:p-8 rounded-xl border border-gray-100 shadow-xs prose prose-slate max-w-none">
            
            {/* Guide Section 1 */}
            <h2 className="text-xl sm:text-2xl font-black text-[#1e3a5f] mt-2 mb-4 border-b-2 border-gray-100 pb-2">1. System Overview</h2>
            <p>
              The <strong>LSCG Daily Shift Report Application</strong> is a responsive full-stack platform built to capture, persist, format, and dispatch shift metrics for the <strong>Tillman Fiber project</strong>. Foremen, engineers, and subcontractors use this utility to log concrete achievements, fiber stringing, Maintenance of Traffic (MOT) schedules, and unexpected site deviations.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 no-print">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Laptop className="w-4 h-4 text-[#1e7aaa]" />
                  <strong className="text-xs text-slate-700 uppercase tracking-wider">Desktop Optimization</strong>
                </div>
                <p className="text-xs text-slate-500 mb-0">Full visual access, complex grids, bulk data entry, and PDF exports optimized for office dispatchers.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-[#1e7aaa]" />
                  <strong className="text-xs text-slate-700 uppercase tracking-wider">Field-Ready Mobile</strong>
                </div>
                <p className="text-xs text-slate-500 mb-0">Collapsible sections, oversized tactile inputs, a floating 1-Click submit button, and offline resilience for direct trench-side use.</p>
              </div>
            </div>

            <div className="tip-box">
              <div className="tip-title">⚡ Offline-First Resilience (Auto-Save)</div>
              <p className="tip-body">
                The application runs on a local client database. Every character typed in the form is instantly cached in <strong>IndexedDB</strong>. If your tablet battery dies, your browser tab refreshes, or your internet drops, all logged work remains safely stored. The app retrieves your draft immediately upon relaunch.
              </p>
            </div>

            <br />
            <hr className="my-6 border-gray-200" />
            <br />

            {/* Guide Section 2 */}
            <h2 className="text-xl sm:text-2xl font-black text-[#1e3a5f] mt-8 mb-4 border-b-2 border-gray-100 pb-2">2. Document Section Breakdown</h2>
            <p>To compile a compliant daily report, complete the six standard form blocks described below:</p>

            <br />
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e7aaa] mt-6 mb-2">Section 2.1: General Information</h3>
            <p>
              Set the foundational parameters of the shift. All critical records require standard tracking metrics:
            </p>
            <ul>
              <li><strong>Date <code>*</code>:</strong> The precise calendar day the work was completed.</li>
              <li><strong>Project # <code>*</code>:</strong> The unique project identifier (e.g., <code>TF-2026-01</code>).</li>
              <li><strong>Contractor Name <code>*</code>:</strong> Name of the primary contractor/foreman authorizing the ledger.</li>
              <li><strong>Submitted By <code>*</code>:</strong> The individual drafting the report (your email is prepopulated by default).</li>
              <li><strong>Vendor <code>*</code>:</strong> Subcontracting firm or crew vendor designation.</li>
              <li><strong>Total Footage <code>*</code>:</strong> Cumulative linear footage completed during the shift.</li>
              <li><strong>Addresses (Start / End):</strong> Optional geographic markers indicating the physical span of the shift work.</li>
            </ul>

            <br />
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e7aaa] mt-6 mb-2">Section 2.2: Activity Type Selector</h3>
            <p>
              Click either <span className="badge">Construction</span> or <span className="badge">Fiber</span> to toggle the specific material lists.
            </p>
            <ul>
              <li><strong>Construction Mode:</strong> Focuses on bores, duct lines, pits, and structural fixtures (e.g. <code>1.5" Conduit Bore</code>, <code>Toby Boxes</code>, <code>Vault</code>, etc.).</li>
              <li><strong>Fiber Mode:</strong> Focuses on fiber counts, tracer wires, and cabling runs (e.g. <code>48ct Fiber</code>, <code>144ct Fiber</code>, <code>Stingray</code>, etc.).</li>
            </ul>

            <div className="page-break"></div>

            <br />
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e7aaa] mt-6 mb-2">Section 2.3: Materials & Daily Activity Grid</h3>
            <p>
              Input exact production outputs for the crew. Each active material row must contain:
            </p>
            <ol>
              <li><strong>Activity Type:</strong> Selected from a standard operational list (<em>Aerial, Directional Bore, Hand Trench, or Underground</em>).</li>
              <li><strong>Material Description:</strong> Select from the preconfigured list or select <code>Other</code> to specify custom materials.</li>
              <li><strong>Quantity:</strong> Numeric count of items or footage placed. Ensure precision; this data translates directly to contractor invoices.</li>
            </ol>

            <br />
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e7aaa] mt-6 mb-2">Section 2.4: Maintenance of Traffic (MOT) Tracker</h3>
            <p>
              LSCG requires complete recording of all traffic control assets and flaggers deployed.
            </p>
            <table>
              <thead>
                <tr>
                  <th>MOT Item Category</th>
                  <th>Standard Billings Code</th>
                  <th>Billable Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>MOT Flagger</td>
                  <td><code>TCHR12 / TCHR13</code></td>
                  <td>Hourly (Normal Rate / Overtime Rate)</td>
                </tr>
                <tr>
                  <td>MOT Traffic Cones</td>
                  <td><code>TCHR68 / TCHR69 / TCHR70 / TCHR71 / TCHR72</code></td>
                  <td>Hourly, Daily, or Weekly rates (10 Cones per pack)</td>
                </tr>
                <tr>
                  <td>MOT Work Zone Signage</td>
                  <td><code>TCHR65 / TCHR66 / TCHR67</code></td>
                  <td>Hourly, Daily, or Weekly billing structures</td>
                </tr>
                <tr>
                  <td>MOT Vehicles</td>
                  <td><code>TCHR76 / TCHR77 / TCHR78</code></td>
                  <td>Hourly Rate based on vehicle size (Large / Medium / Small)</td>
                </tr>
              </tbody>
            </table>

            <br />
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e7aaa] mt-6 mb-2">Section 2.5: Notes, Revisions & Deviations</h3>
            <p>
              Critical section for risk management and historical reference:
            </p>
            <ul>
              <li><strong>Revisions / Deviations:</strong> Record any engineering adjustments from approved design blueprints.</li>
              <li><strong>Issues or Damages:</strong> Log utility strikes, access issues, property damage, or delays immediately with concrete facts.</li>
              <li><strong>Contractor Plan for Next Day:</strong> Detail what the crew intends to accomplish on the subsequent shift.</li>
            </ul>

            <br />
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e7aaa] mt-6 mb-2">Section 2.6: Sign-off & Verification</h3>
            <p>
              Both parties must append their names. Typing your name in the Contractor signature box automatically formats your name in an official handwriting script style, validating the document as a verified electronic record.
            </p>

            <br />
            <hr className="my-6 border-gray-200" />
            <br />

            {/* Guide Section 3 */}
            <h2 className="text-xl sm:text-2xl font-black text-[#1e3a5f] mt-8 mb-4 border-b-2 border-gray-100 pb-2">3. Document Exports & Dispatch</h2>
            <p>Once the form is filled out, use one of the four action commands to process the file:</p>

            <ul>
              <li>
                <strong>Generate Word Report (.docx):</strong> 
                Compiles the form into a beautifully formatted LSCG Daily Report document (.docx) directly on your device. All tables, metadata, and fonts are built client-side. No internet required.
              </li>
              <li>
                <strong>Submit Report (Email Dispatcher):</strong> 
                Opens a dispatch modal. It compiles the report into an formatted summary text ready to send. Recipient lists are persistently saved to your local device to save time.
              </li>
              <li>
                <strong>Print Report:</strong> 
                Applies an optimized <code>@media print</code> stylesheet to the page, hiding all menus, inputs, buttons, and backgrounds. It leaves a clean, black-and-white, highly professional dual-column ledger perfect for physical hand-off or browser-native PDF export.
              </li>
              <li>
                <strong>Clear Form:</strong> 
                Wipes all input values, deletes the local IndexedDB draft cache, and sets up a fresh, blank ledger. Use this at the start of a new shift.
              </li>
            </ul>

            <br />
            <div className="tip-box">
              <div className="tip-title">💡 Compliance Reminder</div>
              <p className="tip-body">
                LSCG guidelines mandate submitting EOS reports everyday upon shift completion. Make sure addresses and total footages align with your asbuilt / redline report to prevent billing disputes.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            Close Guide
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#1e7aaa] rounded-lg hover:bg-[#1a6b8a] transition shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Save Instruction Manual (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};

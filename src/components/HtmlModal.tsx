import React, { useEffect, useState } from 'react';
import { Copy, Download, Check, X, FileCode } from 'lucide-react';
import { getStandaloneHtml } from '../utils/standaloneHtml';

interface HtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HtmlModal: React.FC<HtmlModalProps> = ({ isOpen, onClose }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getStandaloneHtml().then((html) => {
        setHtmlContent(html);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LSCG_End_Of_Day_Shift_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e3a5f] text-white">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-[#29a9e1]" />
            <div>
              <h3 className="text-lg font-bold">Self-Contained Standalone HTML File</h3>
              <p className="text-xs text-blue-200">Zero build step required • Unpkg CDN enabled • Base64 Logo embedded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-[#1a6b8a]">
            <strong>Instructions:</strong> You can click the <strong>Download Standalone .HTML</strong> button below to save this form directly to your desktop or SharePoint. When opened in any browser (Chrome, Edge, Safari), it functions completely offline without any local web server and generates formatted `.docx` Word reports on the fly!
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 font-medium">
              Generating base64 graphics and packaging HTML...
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[50vh] leading-relaxed select-all">
                <code>{htmlContent}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              {copied ? 'Copied HTML!' : 'Copy Raw Code'}
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1e7aaa] rounded-lg hover:bg-[#1a6b8a] transition shadow-md"
            >
              <Download className="w-4 h-4" />
              Download Standalone .HTML File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Mail, X } from 'lucide-react';
import { CONTRACTORS, ContractorEntry, findContractorByName } from '../config';

interface ContractorComboboxProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export const ContractorCombobox: React.FC<ContractorComboboxProps> = ({
  value,
  onChange,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllOnOpen, setShowAllOnOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAllOnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const matchedContractor = useMemo(() => findContractorByName(value), [value]);

  const filteredContractors: ContractorEntry[] = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (showAllOnOpen || !query) {
      return CONTRACTORS;
    }
    return CONTRACTORS.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.contacts.some((contact) => contact.toLowerCase().includes(query))
    );
  }, [value, showAllOnOpen]);

  const handleSelect = (entry: ContractorEntry) => {
    onChange(entry.name);
    setIsOpen(false);
    setShowAllOnOpen(false);
  };

  const handleToggleChevron = () => {
    if (isOpen) {
      setIsOpen(false);
      setShowAllOnOpen(false);
    } else {
      setShowAllOnOpen(true);
      setIsOpen(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          placeholder="Select or type contractor..."
          value={value}
          onFocus={() => {
            setShowAllOnOpen(true);
            setIsOpen(true);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setShowAllOnOpen(false);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setShowAllOnOpen(false);
            }
          }}
          className={`w-full pl-3 sm:pl-2.5 pr-14 py-2.5 sm:py-2 border rounded-xl sm:rounded-lg text-sm sm:text-[13px] transition ${
            hasError
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 text-red-900 placeholder-red-400 font-medium'
              : 'border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-none focus:border-[#29a9e1] focus:ring-2 focus:ring-[#29a9e1]/20 text-slate-800'
          }`}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 gap-0.5">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setShowAllOnOpen(true);
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              aria-label="Clear contractor"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleChevron}
            aria-label="Toggle contractor list"
            className="p-1 text-slate-500 hover:text-[#1e7aaa] rounded-md transition cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#1e7aaa]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Helper indicator showing auto-added email status */}
      {matchedContractor && matchedContractor.emails.length > 0 && (
        <span className="text-[11px] font-medium text-[#1a6b8a] flex items-center gap-1 leading-tight">
          <Mail className="w-3 h-3 text-[#29a9e1] flex-shrink-0" />
          Auto-adds {matchedContractor.emails.length} recipient email
          {matchedContractor.emails.length > 1 ? 's' : ''}
        </span>
      )}

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-200 rounded-xl shadow-xl z-40 max-h-64 overflow-y-auto divide-y divide-slate-100">
          {filteredContractors.map((entry) => {
            const isSelected = entry.name.toLowerCase() === value.trim().toLowerCase();
            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => handleSelect(entry)}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#e8f6fb] text-[#1e3a5f]'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-[13px] font-semibold truncate flex items-center gap-1.5">
                    <span>{entry.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1e7aaa] flex-shrink-0" />}
                  </div>
                  {(entry.contacts.length > 0 || entry.emails.length > 0) && (
                    <div className="text-[11px] text-slate-500 truncate">
                      {entry.contacts.join(', ')}
                      {entry.emails.length > 0
                        ? ` • ${entry.emails.length} email${entry.emails.length > 1 ? 's' : ''}`
                        : ' • No email on file'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {value.trim() && !matchedContractor && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAllOnOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 bg-slate-50 hover:bg-[#e8f6fb] text-[#1e3a5f] text-xs font-semibold flex items-center justify-between cursor-pointer"
            >
              <span>Use typed contractor: "{value.trim()}"</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Custom</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

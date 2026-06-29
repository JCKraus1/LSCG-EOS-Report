import React, { useState } from 'react';
import { ShiftForm } from './components/ShiftForm';
import { HtmlModal } from './components/HtmlModal';

export default function App() {
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);

  return (
    <>
      <ShiftForm onOpenHtmlModal={() => setIsHtmlModalOpen(true)} />
      <HtmlModal isOpen={isHtmlModalOpen} onClose={() => setIsHtmlModalOpen(false)} />
    </>
  );
}

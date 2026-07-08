import React, { useState } from 'react';
import { ShiftForm } from './components/ShiftForm';
import { HtmlModal } from './components/HtmlModal';
import { UserGuideModal } from './components/UserGuideModal';

export default function App() {
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  return (
    <>
      <ShiftForm 
        onOpenHtmlModal={() => setIsHtmlModalOpen(true)} 
        onOpenGuideModal={() => setIsGuideModalOpen(true)} 
      />
      <HtmlModal isOpen={isHtmlModalOpen} onClose={() => setIsHtmlModalOpen(false)} />
      <UserGuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />
    </>
  );
}


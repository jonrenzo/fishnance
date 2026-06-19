'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer1 = setTimeout(() => setMounted(true), 0);
      // Small delay to trigger entry transition
      const timer2 = setTimeout(() => setAnimate(true), 20);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      const timer1 = setTimeout(() => setAnimate(false), 0);
      // Delay unmounting until exit transition finishes (300ms)
      const timer2 = setTimeout(() => setMounted(false), 300);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div
        className={`relative w-full max-w-[430px] bg-white rounded-t-[28px] shadow-[0_-8px_32px_rgba(15,36,38,0.12)] px-6 pt-3 pb-8 z-10 transition-transform duration-300 transform no-scrollbar overflow-y-auto max-h-[85vh] ${
          animate ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-border-mid rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          {title ? <h3 className="text-[18px] font-extrabold text-dark">{title}</h3> : <div />}
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-bg border border-border text-muted hover:text-dark hover:bg-border transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}

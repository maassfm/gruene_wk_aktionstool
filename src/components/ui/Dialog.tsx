"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/60 bg-white border-2 border-black shadow-[8px_8px_0_#000] p-0 max-w-lg w-full mx-4"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-4">
          <h2 className="font-headline font-bold text-xl uppercase text-tanne">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-black hover:bg-black hover:text-white w-8 h-8 flex items-center justify-center border-2 border-black text-xl leading-none font-bold transition-colors"
            aria-label="Schließen"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

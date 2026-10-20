"use client";

import type { ReactNode } from "react";
import { CloseIcon } from "./icons";

/** Bottom sheet over the phone frame. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="mt-auto flex max-h-[85dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-white animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-line px-4 py-3">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-muted">
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

/** Centered dialog. */
export function Dialog({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[380px] rounded-3xl bg-white p-6 text-center animate-pop-in" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

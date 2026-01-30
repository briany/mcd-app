"use client";

import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

import type { Coupon } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CouponDetailModalProps {
  coupon: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CouponDetailModal = ({ coupon, isOpen, onClose }: CouponDetailModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!isInDialog) {
      onClose();
    }
  };

  if (!coupon) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        "m-0 h-full max-h-full w-full max-w-full bg-transparent p-0",
        "md:m-auto md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl",
        "backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden bg-white md:rounded-2xl md:shadow-xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">{coupon.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {coupon.rawMarkdown ? (
            <article className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-strong:text-slate-800 prose-img:rounded-xl">
              <Markdown
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Render images with proper styling
                  img: ({ src, alt }) =>
                    src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={alt || "Coupon image"}
                        className="mx-auto max-h-48 w-auto rounded-xl object-contain"
                      />
                    ) : null,
                }}
              >
                {coupon.rawMarkdown}
              </Markdown>
            </article>
          ) : (
            <p className="text-sm text-slate-500">No additional details available.</p>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Close
          </button>
        </footer>
      </div>
    </dialog>
  );
};

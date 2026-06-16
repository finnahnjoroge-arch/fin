"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface AnnouncementBarProps {
  text: string;
  link?: string;
  bgColor?: string;
}

export function AnnouncementBar({ text, link, bgColor }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(true);

  if (!visible || !text) return null;

  const content = (
    <div
      className="relative flex w-full items-center justify-center py-2 pr-10 pl-4 text-sm font-medium text-white"
      style={{ backgroundColor: bgColor || "#2563eb" }}
    >
      <span className="text-center">{text}</span>
      <button
        onClick={() => setVisible(false)}
        aria-label="Close announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );

  if (link) {
    return (
      <div className="relative">
        <Link href={link} className="block w-full hover:opacity-90">
        {content}
        </Link>
      </div>
    );
  }

  return content;
}


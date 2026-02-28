"use client";

import { useState } from "react";

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: number;
}

export function Accordion({ items, defaultOpen }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen ?? null);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border-b border-[rgba(0,0,0,0.06)]"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between py-6 text-left cursor-pointer group"
            >
              <span className={`font-medium text-base pr-4 transition-colors duration-200 ${
                isOpen ? "text-[#3A8D7B]" : "text-[#1A2332] group-hover:text-[#3A8D7B]"
              }`}>
                {item.question}
              </span>
              <svg
                className="h-4 w-4 shrink-0 transition-transform duration-300"
                style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  color: isOpen ? "#3A8D7B" : "#9CA3AF",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              style={{
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <p className="text-[#6B7280] text-base leading-[1.7] pb-6">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

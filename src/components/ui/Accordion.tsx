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
      {items.map((item, i) => (
        <div
          key={i}
          className="border-b border-[rgba(0,0,0,0.06)]"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-6 text-left cursor-pointer group"
          >
            <span className={`font-medium text-base pr-4 transition-colors duration-200 ${
              openIndex === i ? "text-[#3A8D7B]" : "text-[#1A2332] group-hover:text-[#3A8D7B]"
            }`}>
              {item.question}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 transition-all duration-300 ${
                openIndex === i ? "rotate-180 text-[#3A8D7B]" : "text-[#9CA3AF]"
              }`}
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
            className={`overflow-hidden transition-all duration-400 ${
              openIndex === i ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <p className="text-[#6B7280] text-base leading-[1.7]">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
          className="border-b border-[rgba(255,255,255,0.06)]"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-6 text-left cursor-pointer group"
          >
            <span className={`font-medium text-[16px] pr-4 transition-colors duration-200 ${
              openIndex === i ? "text-white" : "text-[#E8EAF0] group-hover:text-[#C8A44E]"
            }`}>
              {item.question}
            </span>
            <svg
              className={`h-5 w-5 shrink-0 text-[#5A6478] transition-transform duration-300 ${
                openIndex === i ? "rotate-180" : ""
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
            <p className="text-[#7A8299] text-[15px] leading-[1.7]">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

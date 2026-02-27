interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="text-[13px] font-medium text-[#3A8D7B] uppercase tracking-[0.2em] mb-5">
      {children}
    </div>
  );
}

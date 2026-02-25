interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="text-[12px] font-medium text-[#C8A44E] uppercase tracking-[0.2em] mb-5">
      {children}
    </div>
  );
}

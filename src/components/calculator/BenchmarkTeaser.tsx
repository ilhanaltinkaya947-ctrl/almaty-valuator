const MOCK_DATA = [
  { complex: "Esentai City", area: "95 м²", price: "154 200 000 ₸" },
  { complex: "Ritz Carlton", area: "110 м²", price: "168 500 000 ₸" },
  { complex: "Almaty Towers", area: "88 м²", price: "121 700 000 ₸" },
];

export function BenchmarkTeaser() {
  return (
    <div className="relative rounded-2xl glass-card overflow-hidden">
      <div className="blur-[8px] select-none pointer-events-none p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#5A6478] text-left">
              <th className="pb-2 font-medium">ЖК</th>
              <th className="pb-2 font-medium">Площадь</th>
              <th className="pb-2 font-medium text-right">Цена</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DATA.map((row, i) => (
              <tr key={i} className="border-t border-[rgba(255,255,255,0.04)]">
                <td className="py-2.5 text-[#E8EAF0]">{row.complex}</td>
                <td className="py-2.5 text-[#7A8299]">{row.area}</td>
                <td className="py-2.5 text-right text-[#C8A44E] font-mono">{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <svg className="h-8 w-8 text-[#5A6478] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <div className="text-sm font-semibold text-white mb-0.5">
            Полный отчёт
          </div>
          <div className="text-xs text-[#7A8299]">
            Доступно после консультации с экспертом
          </div>
        </div>
      </div>
    </div>
  );
}

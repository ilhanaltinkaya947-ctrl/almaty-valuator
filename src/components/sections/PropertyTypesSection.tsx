import Image from "next/image";
import { RevealGroup } from "@/components/ui/RevealGroup";

const PROPERTY_TYPES = [
  {
    title: "Квартиры",
    badge: "Любое состояние",
    image: "https://images.unsplash.com/photo-1743433035631-e3a94e0203a8?w=800",
    span: "col-span-2 sm:col-span-1 sm:row-span-2",
    tall: true,
  },
  {
    title: "Дома и коттеджи",
    badge: "Любое состояние",
    image: "https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?w=800",
    span: "",
    tall: false,
  },
  {
    title: "Коммерция",
    badge: "Любое состояние",
    image: "https://images.unsplash.com/photo-1580741990231-4aa1c1d9a76a?w=800",
    span: "",
    tall: false,
  },
  {
    title: "Земельные участки",
    badge: "Любое состояние",
    image: "https://images.unsplash.com/photo-1764222233275-87dc016c11dc?w=800",
    span: "col-span-2",
    tall: false,
  },
];

export function PropertyTypesSection() {
  return (
    <section id="services" className="py-20 sm:py-28" style={{ backgroundColor: "#0C0E16" }}>
      <div className="mx-auto max-w-[1120px] px-6">
        {/* Right-aligned heading — different from other sections */}
        <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.2em] mb-5" style={{ color: "#C8A44E" }}>
              Виды недвижимости
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Выкупаем любые типы
            </h2>
          </div>
          <p className="text-[15px] text-[#5A6478] max-w-[300px]">
            Любое состояние. Любой район Алматы. Оценка бесплатно.
          </p>
        </div>

        {/* Bento grid — asymmetric, NOT uniform 2x2 */}
        <RevealGroup className="grid grid-cols-2 gap-4 sm:gap-5 auto-rows-[200px] sm:auto-rows-[220px]">
          {PROPERTY_TYPES.map((pt) => (
            <div
              key={pt.title}
              className={`reveal-child reveal bento-card group rounded-2xl overflow-hidden relative ${pt.span}`}
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Image
                src={pt.image}
                alt={pt.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                sizes={pt.tall ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 50vw, 50vw"}
              />
              {/* Overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(to top, rgba(8,9,14,0.92) 0%, rgba(8,9,14,0.4) 40%, rgba(8,9,14,0.1) 100%)",
                }}
              />
              {/* Badge */}
              <span
                className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: "rgba(200,164,78,0.12)",
                  color: "#E8D5A0",
                  border: "1px solid rgba(200,164,78,0.2)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {pt.badge}
              </span>
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-[17px] font-semibold text-white mb-1 group-hover:text-[#E8D5A0] transition-colors duration-300">
                  {pt.title}
                </h3>
              </div>
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

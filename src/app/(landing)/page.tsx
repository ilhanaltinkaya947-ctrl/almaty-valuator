import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { CalculatorSection } from "@/components/sections/CalculatorSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { PropertyTypesSection } from "@/components/sections/PropertyTypesSection";
import { HowWeWorkSection } from "@/components/sections/HowWeWorkSection";
import { AdvantagesSection } from "@/components/sections/AdvantagesSection";
import { LegalSection } from "@/components/sections/LegalSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTABanner } from "@/components/sections/CTABanner";
import { ContactSection } from "@/components/sections/ContactSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function HomePage() {
  return (
    <>
      <Header />
      <HeroSection />
      <ScrollReveal>
        <TrustBar />
      </ScrollReveal>
      <ScrollReveal>
        <CalculatorSection />
      </ScrollReveal>
      <AboutSection />
      <ScrollReveal>
        <PropertyTypesSection />
      </ScrollReveal>
      <HowWeWorkSection />
      <ScrollReveal>
        <AdvantagesSection />
      </ScrollReveal>
      <ScrollReveal>
        <LegalSection />
      </ScrollReveal>
      <ScrollReveal>
        <CTABanner />
      </ScrollReveal>
      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>
      <ScrollReveal>
        <ContactSection />
      </ScrollReveal>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import {
  AIModulesSection,
  CTASection,
  DashboardPreviewSection,
  FAQSection,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  StatisticsSection,
  TestimonialsSection,
  TrustedSection,
  WhyCyberShieldSection,
} from "@/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberShield — AI-Powered Digital Investigation Platform" },
      {
        name: "description",
        content:
          "Manage, analyze, and investigate digital evidence faster with CyberShield — AI-powered case management for authorized investigators.",
      },
      { property: "og:title", content: "CyberShield — AI-Powered Digital Investigation Platform" },
      {
        property: "og:description",
        content:
          "Evidence management, AI analysis, relationship mapping, and automated reports — with human oversight at every step.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <TrustedSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AIModulesSection />
        <DashboardPreviewSection />
        <StatisticsSection />
        <WhyCyberShieldSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

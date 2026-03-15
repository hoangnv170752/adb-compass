import Navigation from "@/components/layout/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import StatsSection from "@/components/sections/StatsSection";
import ShowcaseSection from "@/components/sections/ShowcaseSection";
import TechStackSection from "@/components/sections/TechStackSection";
import DownloadSection from "@/components/sections/DownloadSection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <ShowcaseSection />
        <TechStackSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";
import Container from "@/components/layout/Container";
import GradientText from "@/components/common/GradientText";

const HeroSection = () => {
  return (
    <section className="flex min-h-[calc(100vh-64px)] items-center py-12 lg:py-0">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        {/* Text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GradientText as="h1" className="text-3xl font-bold leading-tight md:text-5xl">
              Android Device Management, Simplified.
            </GradientText>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 max-w-[540px] text-lg text-text-secondary"
          >
            A powerful desktop app for managing Android devices. Install APKs, mirror screens,
            browse files, and debug — all from one beautiful interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <a
              href="#download"
              className="gradient-bg inline-flex items-center gap-2 rounded-lg px-8 py-4 font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-glow"
            >
              <Download size={20} />
              Download for Free
            </a>
            <a
              href="https://github.com/hoangnv170752/device-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-8 py-4 font-semibold text-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-surface-elevated"
            >
              <Github size={20} />
              View on GitHub
            </a>
          </motion.div>
        </div>

        {/* Mockup - Shows real app screenshots */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <div className="animate-float">
            {/* Light mode image */}
            <img
              src="/home_light.png"
              alt="DeviceHub app overview showing connected Android devices"
              className="w-full rounded-2xl shadow-xl dark:hidden"
              loading="lazy"
            />
            {/* Dark mode image */}
            <img
              src="/home_dark.png"
              alt="DeviceHub app overview showing connected Android devices"
              className="hidden w-full rounded-2xl shadow-xl dark:block"
              loading="lazy"
            />
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default HeroSection;

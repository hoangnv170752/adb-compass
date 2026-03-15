import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/layout/Container";

// Real app screenshots from public folder
const tabs = [
  {
    id: "home",
    label: "Home",
    lightImage: "/home_light.png",
    darkImage: "/home_dark.png",
    caption: "View all connected devices and their details at a glance"
  },
  {
    id: "device",
    label: "Device",
    lightImage: "/device_light.png",
    darkImage: "/device_dark.png",
    caption: "Detailed device information with hardware specs and status"
  },
  {
    id: "screen",
    label: "Screen",
    lightImage: "/screen_light.png",
    darkImage: "/screen_dark.png",
    caption: "Mirror and control your device screen in real-time"
  },
  {
    id: "files",
    label: "Files",
    lightImage: "/file_light.png",
    darkImage: "/file_dark.png",
    caption: "Browse and manage files with an intuitive file explorer"
  },
  {
    id: "logcat",
    label: "Logcat",
    lightImage: "/logcat_light.png",
    darkImage: "/logcat_dark.png",
    caption: "Debug with built-in logcat viewer and real-time log filtering"
  },
];

const ShowcaseSection = () => {
  const [active, setActive] = useState("home");
  const current = tabs.find((t) => t.id === active)!;

  return (
    <section className="py-5xl-sp bg-gradient-to-b from-background to-card">
      <Container className="max-w-[1024px]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground">See it in action</h2>
          <p className="mt-4 text-lg text-text-secondary">
            Explore DeviceHub's powerful features through each tab
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                active === tab.id
                  ? "gradient-bg text-primary-foreground shadow-md"
                  : "bg-surface-elevated text-text-secondary hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Screenshot */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Light mode image */}
              <img
                src={current.lightImage}
                alt={current.caption}
                className="w-full rounded-xl shadow-xl dark:hidden"
                loading="lazy"
              />
              {/* Dark mode image */}
              <img
                src={current.darkImage}
                alt={current.caption}
                className="hidden w-full rounded-xl shadow-xl dark:block"
                loading="lazy"
              />
              <p className="mt-4 text-center text-sm text-text-muted">{current.caption}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
};

export default ShowcaseSection;

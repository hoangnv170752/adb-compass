import { motion } from "framer-motion";
import {
  Smartphone, Monitor, LayoutGrid, Package,
  FolderOpen, Download, Terminal, Wifi, Layers, BrainCircuit
} from "lucide-react";
import Container from "@/components/layout/Container";

const AI_FEATURE = {
  icon: BrainCircuit,
  title: "AI Log Analysis",
  description: "Automatically analyze logcat logs using AI (OpenAI, Claude, Gemini). Identifies crashes, ANR, OOM, root causes, and actionable fix suggestions — exclusive to DeviceHub.",
};

const features = [
  {
    icon: Smartphone,
    title: "Device Management",
    description: "Auto-detect connected Android devices. View detailed hardware info, battery status, storage, and more.",
  },
  {
    icon: Monitor,
    title: "Screen Mirroring",
    description: "Mirror your device screen in real-time with up to 60 FPS. Touch, scroll, and type directly from your desktop.",
  },
  {
    icon: LayoutGrid,
    title: "Multi-Screen Control",
    description: "Control multiple devices simultaneously. Perfect for testing across different devices or team demos.",
  },
  {
    icon: Package,
    title: "App Management",
    description: "Browse, search, and manage installed apps. Uninstall apps, clear data, and grant permissions with one click.",
  },
  {
    icon: FolderOpen,
    title: "File Management",
    description: "Full-featured file explorer. Upload, download, and organize files on your device with drag-and-drop.",
  },
  {
    icon: Download,
    title: "APK Installation",
    description: "Drag and drop APK files to install. Pre-installation validation ensures successful installs every time.",
  },
  {
    icon: Terminal,
    title: "Developer Tools",
    description: "Built-in logcat viewer and shell terminal. Filter logs, run commands, and debug in real-time.",
  },
  {
    icon: Wifi,
    title: "Wireless ADB",
    description: "Connect wirelessly over WiFi. No USB cable needed after initial setup.",
  },
  {
    icon: Layers,
    title: "Cross-Platform",
    description: "Native apps for Windows, macOS, and Linux. Fast, lightweight, and beautifully designed.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-5xl-sp">
      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground">
            Everything you need to manage Android devices
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            DeviceHub combines powerful tools in one elegant interface
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-8 shadow-lg ring-1 ring-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <BrainCircuit size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">{AI_FEATURE.title}</h3>
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Exclusive
                </span>
                <span className="flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-warning">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
                  Under Development
                </span>
              </div>
              <p className="mt-2 text-base text-text-secondary">{AI_FEATURE.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["OpenAI GPT-4o", "Claude 3.5", "Gemini 2.0"].map((m) => (
                  <span key={m} className="rounded-lg border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-text-muted">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <feature.icon size={24} className="text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-base text-text-secondary">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection;

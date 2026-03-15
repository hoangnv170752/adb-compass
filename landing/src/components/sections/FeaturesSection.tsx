import { motion } from "framer-motion";
import {
  Smartphone, Monitor, LayoutGrid, Package,
  FolderOpen, Download, Terminal, Wifi, Layers
} from "lucide-react";
import Container from "@/components/layout/Container";

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

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

import { motion } from "framer-motion";
import Container from "@/components/layout/Container";

const platforms = [
  { name: "Windows", format: "EXE, MSI, ZIP", icon: "/win-svg.svg" },
  { name: "macOS", format: "DMG", icon: "/apple-svg.svg" },
  { name: "Linux", format: "DEB, AppImage", icon: "/linux-svg.svg" },
];

const DownloadSection = () => {
  return (
    <section id="download" className="py-5xl-sp bg-gradient-to-b from-primary/5 to-secondary/5">
      <Container className="text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-4 text-lg text-text-secondary">
            Download DeviceHub for free and take control of your Android devices.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {platforms.map((platform, i) => (
            <motion.button
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card px-8 py-6 text-left transition-all duration-200 hover:border-primary hover:shadow-lg sm:w-auto"
            >
              <img src={platform.icon} alt={platform.name} className="h-8 w-8" />
              <div>
                <div className="font-semibold text-foreground">{platform.name}</div>
                <div className="text-sm text-text-muted">{platform.format}</div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <span className="inline-block rounded-full bg-surface-elevated px-4 py-2 font-mono text-sm text-text-muted">
            v1.0.0
          </span>
        </motion.div>
      </Container>
    </section>
  );
};

export default DownloadSection;

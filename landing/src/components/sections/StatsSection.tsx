import { motion } from "framer-motion";
import Container from "@/components/layout/Container";

const stats = [
  { label: "App Size", value: "<50MB", description: "vs Android Studio 1GB+" },
  { label: "Startup", value: "<2s", description: "vs 30s+ IDE startup" },
  { label: "Price", value: "$0", description: "Free forever, no tiers" },
  { label: "All-in-One", value: "9+", description: "Integrated tools" },
];

const comparisons = [
  { feature: "Screen Mirroring", deviceHub: true, vysor: true, scrcpy: true, studio: true },
  { feature: "File Browser", deviceHub: true, vysor: false, scrcpy: false, studio: true },
  { feature: "Wireless ADB", deviceHub: true, vysor: "pro", scrcpy: true, studio: true },
  { feature: "APK Drag & Drop", deviceHub: true, vysor: false, scrcpy: false, studio: false },
  { feature: "Multi-Device Sync", deviceHub: true, vysor: false, scrcpy: false, studio: false },
  { feature: "App Management", deviceHub: true, vysor: false, scrcpy: false, studio: true },
  { feature: "Logcat Viewer", deviceHub: true, vysor: false, scrcpy: false, studio: true },
  { feature: "Shell Terminal", deviceHub: true, vysor: false, scrcpy: false, studio: true },
  { feature: "GUI Interface", deviceHub: true, vysor: true, scrcpy: false, studio: true },
  { feature: "Free & Open Source", deviceHub: true, vysor: false, scrcpy: true, studio: false },
  { feature: "Lightweight (<50MB)", deviceHub: true, vysor: true, scrcpy: true, studio: false },
];

const Check = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">✓</span>
);
const Cross = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-error/15 text-error">✕</span>
);
const Paid = () => (
  <span className="inline-flex items-center justify-center rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">$</span>
);

const StatusCell = ({ value }: { value: boolean | string }) => {
  if (value === true) return <Check />;
  if (value === "pro") return <Paid />;
  return <Cross />;
};

const StatsSection = () => {
  return (
    <section className="py-5xl-sp">
      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground">
            Why DeviceHub?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            See how DeviceHub stacks up against the competition
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <div className="text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="mt-2 text-sm font-semibold text-foreground">{stat.label}</div>
              <div className="mt-1 text-xs text-text-muted">{stat.description}</div>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.2 }}
          className="mt-16 overflow-x-auto"
        >
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 pr-4 text-left text-sm font-semibold text-foreground">Feature</th>
                <th className="px-4 py-4 text-center">
                  <span className="gradient-text text-sm font-bold">DeviceHub</span>
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-text-muted">Vysor</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-text-muted">scrcpy</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-text-muted">Android Studio</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.feature} className="border-b border-border/50 transition-colors hover:bg-surface-elevated/30">
                  <td className="py-3.5 pr-4 text-sm text-text-secondary">{row.feature}</td>
                  <td className="px-4 py-3.5 text-center"><StatusCell value={row.deviceHub} /></td>
                  <td className="px-4 py-3.5 text-center"><StatusCell value={row.vysor} /></td>
                  <td className="px-4 py-3.5 text-center"><StatusCell value={row.scrcpy} /></td>
                  <td className="px-4 py-3.5 text-center"><StatusCell value={row.studio} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Check /> <span>Included</span>
            </div>
            <div className="flex items-center gap-2">
              <Paid /> <span>Paid feature</span>
            </div>
            <div className="flex items-center gap-2">
              <Cross /> <span>Not available</span>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default StatsSection;

import { motion } from "framer-motion";
import Container from "@/components/layout/Container";

const techs = [
  { name: "React", icon: "/react-svg.svg" },
  { name: "TailwindCSS", icon: "/tailwind-svg.svg" },
  { name: "Rust/Tauri", icon: "/rust-svg.svg" },
  { name: "Framer Motion", icon: "/framer-svg.svg" },
];

const TechStackSection = () => {
  return (
    <section className="bg-surface-elevated/50 py-5xl-sp">
      <Container>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-semibold text-foreground"
        >
          Built with modern technologies
        </motion.h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-12">
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-3 text-text-muted transition-all duration-200 grayscale hover:text-foreground hover:grayscale-0"
            >
              <img src={tech.icon} alt={tech.name} className="h-12 w-12" />
              <span className="text-sm font-medium">{tech.name}</span>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default TechStackSection;

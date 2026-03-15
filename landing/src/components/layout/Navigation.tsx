import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";
import Container from "./Container";

const Navigation = () => {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const links = [
    { label: "Features", href: "#features" },
    { label: "Download", href: "#download" },
    { label: "GitHub", href: "https://github.com/hoangnv170752/DeviceHub", external: true },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md"
    >
      <Container className="flex h-full items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <img src="/logo-64.png" alt="DeviceHub" className="h-10 w-10 rounded-xl shadow-sm" />
          <span className="text-xl font-bold text-foreground">DeviceHub</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => setDark(!dark)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated text-text-secondary transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setDark(!dark)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated text-text-secondary"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary"
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border bg-background/95 backdrop-blur-md md:hidden"
        >
          <Container className="flex flex-col gap-4 py-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                target={link.external ? "_blank" : undefined}
                className="text-sm font-medium text-text-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </Container>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navigation;

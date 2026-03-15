import Container from "./Container";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-3xl-sp">
      <Container className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <div className="flex items-center gap-2">
            <img src="/logo-64.png" alt="DeviceHub" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-foreground">DeviceHub</span>
          </div>
          <p className="text-sm text-text-muted">© 2026 DeviceHub. Made with ❤️ by hoangnv170752</p>
          <p className="text-xs text-text-muted">Original idea by h1dr0n</p>
        </div>

        <div className="flex gap-6">
          {[
            { label: "GitHub", href: "https://github.com/hoangnv170752/DeviceHub" },
            { label: "Documentation", href: "#" },
            { label: "License", href: "#" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-text-secondary transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

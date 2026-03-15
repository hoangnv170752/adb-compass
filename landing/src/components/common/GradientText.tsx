import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

const GradientText = ({ children, className, as: Tag = "span" }: GradientTextProps) => (
  <Tag className={cn("gradient-text", className)}>
    {children}
  </Tag>
);

export default GradientText;

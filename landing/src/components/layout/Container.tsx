import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className }: ContainerProps) => (
  <div className={cn("mx-auto w-full max-w-[1280px] px-6", className)}>
    {children}
  </div>
);

export default Container;

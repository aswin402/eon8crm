"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-7 h-7 rounded-md bg-muted/20" />;
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="w-7 h-7 rounded-md border border-border/80 bg-background/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-3.5 h-3.5 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}

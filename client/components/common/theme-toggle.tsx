"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, startTransition } from "react";
import { Icons } from "./icons";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    })
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <div className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Icons.sun className="h-5 w-5 rotate-0 scale-100 transition-all" />
      ) : (
        <Icons.moon className="h-5 w-5 rotate-0 scale-100 transition-all" />
      )}
    </Button>
  );
}

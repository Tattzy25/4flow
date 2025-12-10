"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const themes = [
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
];

export type ThemeSwitcherProps = {
  value?: "light" | "dark" | "system";
  onChange?: (theme: "light" | "dark" | "system") => void;
  defaultValue?: "light" | "dark" | "system";
  className?: string;
};

export const ThemeSwitcher = ({
  value,
  onChange,
  defaultValue = "system",
  className,
}: ThemeSwitcherProps) => {
  const [theme, setTheme] = useControllableState({
    defaultProp: defaultValue,
    prop: value,
    onChange,
  });
  const [mounted, setMounted] = useState(false);
  const { theme: themeFromNextThemes, setTheme: setThemeNext } = useTheme();

  const handleThemeClick = useCallback(
    (themeKey: "light" | "dark" | "system") => {
      // keep controlled state in sync
      setTheme(themeKey);
      // also set the actual UI theme via next-themes provider
      try {
        setThemeNext?.(themeKey);
      } catch (e) {
        // ignore: setThemeNext may be undefined until mounted
      }
    },
    [setTheme, setThemeNext]
  );

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep internal state in sync with next-themes theme value when it becomes available
  useEffect(() => {
    if (!themeFromNextThemes) return;
    if (themeFromNextThemes !== theme) {
      setTheme(themeFromNextThemes as "light" | "dark" | "system");
    }
  }, [themeFromNextThemes, setTheme, theme]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative isolate flex h-9 items-center gap-1 rounded-md bg-background px-2 ring-1 ring-border",
        className
      )}
         role="radiogroup"
    >
      {themes.map(({ key, icon: Icon, label }) => {
        // prefer next-themes resolved value (if available), otherwise fall back to local state
        const activeTheme = themeFromNextThemes ?? theme;
        const isActive = activeTheme === key;

        return (
            <button
            aria-label={label}
              aria-pressed={isActive}
               role="radio"
               aria-checked={isActive}
            className="relative h-8 w-8 rounded-md"
            key={key}
            onClick={() => handleThemeClick(key as "light" | "dark" | "system")}
            type="button"
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-border"
                layoutId="activeTheme"
                transition={{ type: "spring", duration: 0.3 }}
              />
            )}
            <Icon
              className={cn(
                "relative z-10 m-auto h-4 w-4",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

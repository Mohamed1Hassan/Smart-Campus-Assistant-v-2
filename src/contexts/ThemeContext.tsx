"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  triggerTransition: (x: number, y: number) => void;
  transitionData: { x: number; y: number; isTransitioning: boolean; targetTheme: Theme } | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  try {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    // Default to light mode unless explicitly dark
    return "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // IMPORTANT for Next.js hydration:
  // - Always start from a fixed value ('light') so that
  //   server HTML matches the first client render.
  // - Then, after mount on the client, read the real value
  //   from localStorage and update state.
  const [theme, setThemeState] = useState<Theme>("light");
  const [transitionData, setTransitionData] = useState<{ 
    x: number; 
    y: number; 
    isTransitioning: boolean;
    targetTheme: Theme;
  } | null>(null);

  // After the component mounts on the client, read the stored theme once
  // and update state. This avoids hydration mismatches.
  useEffect(() => {
    const initial = getInitialTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initial);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes first to avoid conflicts
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    // Add the current theme class (Tailwind uses 'dark' class for dark mode)
    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      // For light mode, ensure dark is removed
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // Save to localStorage
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }, [theme]);

  // Sync theme from localStorage periodically to catch mismatches
  useEffect(() => {
    const checkAndSyncTheme = () => {
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      const hasDarkClass = document.documentElement.classList.contains("dark");

      if (storedTheme === "dark" && !hasDarkClass && theme !== "dark") {
        setThemeState("dark");
      } else if (storedTheme === "light" && hasDarkClass && theme !== "light") {
        setThemeState("light");
      }
    };

    const interval = setInterval(checkAndSyncTheme, 2000);
    checkAndSyncTheme();
    return () => clearInterval(interval);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const triggerTransition = (x: number, y: number) => {
    const newTargetTheme = theme === "dark" ? "light" : "dark";
    setTransitionData({ x, y, isTransitioning: true, targetTheme: newTargetTheme });
    
    // Switch theme exactly when the coverage is complete
    setTimeout(() => {
      setThemeState(newTargetTheme);
    }, 300);

    // Immediate cleanup to trigger the exit animation
    setTimeout(() => {
      setTransitionData(null);
    }, 600);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        triggerTransition,
        transitionData,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

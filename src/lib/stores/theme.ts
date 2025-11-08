import { writable } from "svelte/store";
import { browser } from "$app/environment";

type Theme = "light" | "dark";

function createThemeStore() {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): Theme => {
    if (!browser) return "dark";

    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const { subscribe, set, update } = writable<Theme>(getInitialTheme());

  return {
    subscribe,
    toggle: () => {
      update((current) => {
        const newTheme = current === "dark" ? "light" : "dark";
        if (browser) {
          localStorage.setItem("theme", newTheme);
          if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        return newTheme;
      });
    },
    set: (theme: Theme) => {
      if (browser) {
        localStorage.setItem("theme", theme);
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      set(theme);
    },
    init: () => {
      if (browser) {
        const theme = getInitialTheme();
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
  };
}

export const themeStore = createThemeStore();

// START_MODULE_CONTRACT
//   PURPOSE: Let the reader choose the light, dark or system theme, remember the choice, and follow the system setting while system is chosen.
//   SCOPE: ThemeToggle, a group of three icon buttons with pressed state.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ThemeToggle - the three-choice theme control in the header
// END_MODULE_MAP

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  applyTheme,
  readTheme,
  storeTheme,
  THEME_CHOICES,
  type ThemeChoice,
} from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const LABELS: Record<ThemeChoice, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
};

const ICONS: Record<ThemeChoice, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

// START_CONTRACT: ThemeToggle
//   PURPOSE: Show the three theme choices as pressed-state buttons, store the choice when one is picked, and apply it at once.
//   INPUTS: none
//   OUTPUTS: { JSX.Element - a labelled group of three buttons; the pressed state starts as system so the server and the first client render agree }
//   SIDE_EFFECTS: after mount, reads data-theme; on a click, writes localStorage (when available) and toggles the dark class; while system is chosen, listens for changes of the system setting
//   LINKS: M-DOCS-SITE
// END_CONTRACT: ThemeToggle
export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    setChoice(readTheme(document.documentElement));
  }, []);

  useEffect(() => {
    if (choice !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      applyTheme(document.documentElement, "system", media.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  function select(next: ThemeChoice) {
    storeTheme(() => window.localStorage, next);
    applyTheme(
      document.documentElement,
      next,
      window.matchMedia(DARK_QUERY).matches,
    );
    setChoice(next);
  }

  return (
    <div role="group" aria-label="Theme" className="flex items-center gap-1">
      {THEME_CHOICES.map((option) => {
        const Icon = ICONS[option];
        return (
          <Button
            key={option}
            type="button"
            variant="ghost"
            size="icon"
            data-theme-choice={option}
            aria-pressed={choice === option}
            aria-label={LABELS[option]}
            onClick={() => select(option)}
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}

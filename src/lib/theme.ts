// Theme helpers shared by the toggle button and the no-flash init script.
export const THEME_STORAGE_KEY = "lian-carpool-theme";

export type AppTheme = "light" | "dark";

// Inline script injected in <head> so the saved theme applies before paint.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=document.documentElement;if(t==="light"){d.classList.remove("dark");}else{d.classList.add("dark");}}catch(e){}})();`;

export function applyTheme(theme: AppTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function currentTheme(): AppTheme {
  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

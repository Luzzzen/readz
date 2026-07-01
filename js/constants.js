/* ==========================================================
   READZ
   Constants
   ========================================================== */

export const DB_NAME = "readz-db";
export const DB_VERSION = 1;

export const STORES = {
    BOOKS: "books",
    SETTINGS: "settings",
    STATISTICS: "statistics",
};

export const THEMES = {
    SEPIA: "sepia",
    LIGHT: "light",
    DARK: "dark",
};

export const DEFAULT_SETTINGS = {
    theme: THEMES.SEPIA,
    fontSize: 100, // porcentaje
};

export const PUBLIC_LIBRARY_URL = "data/library.json";

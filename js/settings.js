/* ==========================================================
   READZ
   Settings
   ========================================================== */

import * as Database from "./database.js";
import { THEMES, DEFAULT_SETTINGS } from "./constants.js";

const panel = document.getElementById("settings-panel");

let currentTheme = DEFAULT_SETTINGS.theme;
let currentFontSize = DEFAULT_SETTINGS.fontSize;

let onFontSizeChange = null;
let onThemeChange = null;

/* ==========================================================
   Init
   ========================================================== */

export async function initializeSettings({ onFontSize, onTheme } = {}) {

    onFontSizeChange = onFontSize || null;
    onThemeChange = onTheme || null;

    currentTheme = await Database.getSetting("theme", DEFAULT_SETTINGS.theme);
    currentFontSize = await Database.getSetting("fontSize", DEFAULT_SETTINGS.fontSize);

    applyTheme(currentTheme);

    buildPanel();

}

function buildPanel() {

    panel.innerHTML = `
        <h3>Tema</h3>
        <div class="theme-options">
            <button class="theme-swatch" data-theme="${THEMES.SEPIA}" title="Sepia"></button>
            <button class="theme-swatch" data-theme="${THEMES.LIGHT}" title="Claro"></button>
            <button class="theme-swatch" data-theme="${THEMES.DARK}" title="Oscuro"></button>
        </div>

        <h3>Tamaño de fuente</h3>
        <div class="font-size-control">
            <button class="icon-button" data-action="decrease">A-</button>
            <span id="font-size-value">${currentFontSize}%</span>
            <button class="icon-button" data-action="increase">A+</button>
        </div>

        <button class="button-link" id="close-settings">Cerrar</button>
    `;

    highlightActiveTheme();

    panel.querySelectorAll(".theme-swatch").forEach((swatch) => {
        swatch.addEventListener("click", () => setTheme(swatch.dataset.theme));
    });

    panel.querySelector('[data-action="decrease"]').addEventListener("click", () => changeFontSize(-10));
    panel.querySelector('[data-action="increase"]').addEventListener("click", () => changeFontSize(10));

    panel.querySelector("#close-settings").addEventListener("click", togglePanel);

}

/* ==========================================================
   Theme
   ========================================================== */

function applyTheme(theme) {

    document.body.classList.remove("theme-light", "theme-dark");

    if (theme === THEMES.LIGHT) document.body.classList.add("theme-light");
    if (theme === THEMES.DARK) document.body.classList.add("theme-dark");

}

async function setTheme(theme) {

    currentTheme = theme;

    applyTheme(theme);

    highlightActiveTheme();

    await Database.setSetting("theme", theme);

    if (typeof onThemeChange === "function") {
        onThemeChange(theme);
    }

}

function highlightActiveTheme() {

    panel.querySelectorAll(".theme-swatch").forEach((swatch) => {
        swatch.classList.toggle("active", swatch.dataset.theme === currentTheme);
    });

}

/* ==========================================================
   Font size
   ========================================================== */

async function changeFontSize(delta) {

    currentFontSize = Math.min(150, Math.max(70, currentFontSize + delta));

    panel.querySelector("#font-size-value").textContent = `${currentFontSize}%`;

    await Database.setSetting("fontSize", currentFontSize);

    if (typeof onFontSizeChange === "function") {
        onFontSizeChange(currentFontSize);
    }

}

/* ==========================================================
   Panel
   ========================================================== */

export function togglePanel() {
    panel.hidden = !panel.hidden;
}

export function getFontSize() {
    return currentFontSize;
}

export function getTheme() {
    return currentTheme;
}

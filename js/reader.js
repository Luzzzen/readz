/* ==========================================================
   READZ
   Reader
   ========================================================== */

import * as Database from "./database.js";
import * as Router from "./router.js";
import * as Statistics from "./statistics.js";
import { togglePanel, getFontSize, getTheme } from "./settings.js";
import { renderLibrary } from "./library.js";

const readerView = document.getElementById("reader-view");

const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const CONTENT_THEMES = {
    sepia: { body: { background: "#f5f1e8 !important", color: "#2f2b26 !important" } },
    light: { body: { background: "#ffffff !important", color: "#1f1f1f !important" } },
    dark: { body: { background: "#171717 !important", color: "#f5f5f5 !important" } },
};

let currentBook = null;
let epub = null;
let rendition = null;

let sessionStart = null;
let saveTimer = null;
let hideControlsTimer = null;

/* ==========================================================
   Open / close
   ========================================================== */

export async function openBook(book) {

    currentBook = book;

    buildReaderDOM(book);

    Router.goToReader();

    epub = ePub(book.buffer.slice(0));

    rendition = epub.renderTo("viewer", {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "auto",
    });

    Object.entries(CONTENT_THEMES).forEach(([name, styles]) => {
        rendition.themes.register(name, styles);
    });

    rendition.themes.select(getTheme());
    rendition.themes.fontSize(`${getFontSize()}%`);

    await rendition.display(book.currentLocation || undefined);

    bindRelocated();
    bindControlsVisibility();

    startSession();

    await Database.updateBook(book.id, { lastOpened: Date.now() });

}

export function closeReader() {

    clearTimeout(hideControlsTimer);

    stopSession();

    if (rendition) rendition.destroy();

    epub = null;
    rendition = null;
    currentBook = null;

    Router.goToLibrary();

    renderLibrary();

}

/* ==========================================================
   DOM
   ========================================================== */

function buildReaderDOM(book) {

    readerView.innerHTML = "";
    readerView.classList.remove("controls-visible");

    readerView.innerHTML = `
        <div id="reader-toolbar">
            <button class="icon-button" id="reader-back">←</button>
            <h2>${book.title}</h2>
            <button class="icon-button" id="reader-settings">Aa</button>
        </div>
        <div id="reader-container">
            <div id="viewer"></div>
        </div>
        <div class="nav-zone" id="nav-prev"></div>
        <div class="nav-zone" id="nav-next"></div>
        <div id="reader-footer">
            <span id="progress-label"></span>
        </div>
    `;

    document.getElementById("reader-back").addEventListener("click", closeReader);
    document.getElementById("reader-settings").addEventListener("click", togglePanel);

    document.getElementById("nav-prev").addEventListener("click", (event) => {
        event.stopPropagation();
        prevPage();
    });

    document.getElementById("nav-next").addEventListener("click", (event) => {
        event.stopPropagation();
        nextPage();
    });

}

/* ==========================================================
   Navigation
   ========================================================== */

export function nextPage() {
    rendition?.next();
}

export function prevPage() {
    rendition?.prev();
}

/* ==========================================================
   Font size / theme (llamados desde settings.js al cambiar)
   ========================================================== */

export function applyFontSize(size) {
    rendition?.themes.fontSize(`${size}%`);
}

export function applyTheme(theme) {
    rendition?.themes.select(theme);
}

/* ==========================================================
   Visibilidad de barras (toolbar / footer)
   ========================================================== */

function showControls() {
    readerView.classList.add("controls-visible");
}

function hideControls() {
    readerView.classList.remove("controls-visible");
}

function scheduleAutoHide() {
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(hideControls, 3000);
}

function bindControlsVisibility() {

    if (supportsHover) {

        // PC: se muestran al mover el mouse y se ocultan solas a los 3s de inactividad.
        readerView.addEventListener("mousemove", () => {
            showControls();
            scheduleAutoHide();
        });

    } else {

        // Mobile: cada toque sobre el contenido las alterna (mostrar/ocultar).
        // Se usa el evento de epub.js porque el contenido vive en un iframe aparte
        // y sus clics no llegan al DOM externo.
        rendition.on("click", () => {
            readerView.classList.toggle("controls-visible");
            clearTimeout(hideControlsTimer);
        });

    }

}

/* ==========================================================
   Progress
   ========================================================== */

function bindRelocated() {

    rendition.on("relocated", (location) => {

        const progress = epub.locations.length()
            ? epub.locations.percentageFromCfi(location.start.cfi)
            : 0;

        currentBook.currentLocation = location.start.cfi;
        currentBook.progress = progress;

        const label = document.getElementById("progress-label");

        if (label) label.textContent = `${Math.round(progress * 100)}%`;

        if (location.atEnd && !currentBook.finishedAt) {

            currentBook.finishedAt = Date.now();

            Statistics.registerBookFinished();

        }

        scheduleSave();

    });

    epub.ready.then(() => epub.locations.generate(1600));

}

function scheduleSave() {

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {

        Database.updateBook(currentBook.id, {
            currentLocation: currentBook.currentLocation,
            progress: currentBook.progress,
            finishedAt: currentBook.finishedAt,
        });

    }, 800);

}

/* ==========================================================
   Reading time
   ========================================================== */

function startSession() {
    sessionStart = Date.now();
}

function stopSession() {

    if (!sessionStart || !currentBook) return;

    const elapsedSeconds = Math.round((Date.now() - sessionStart) / 1000);

    currentBook.readingTimeSeconds = (currentBook.readingTimeSeconds || 0) + elapsedSeconds;

    Database.updateBook(currentBook.id, {
        readingTimeSeconds: currentBook.readingTimeSeconds,
    });

    Statistics.addReadingTime(elapsedSeconds);

    sessionStart = null;

}

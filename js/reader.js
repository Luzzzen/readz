/* ==========================================================
   READZ
   Reader
   ========================================================== */

import * as Database from "./database.js";
import * as Router from "./router.js";
import * as Statistics from "./statistics.js";
import { togglePanel, getFontSize } from "./settings.js";
import { renderLibrary } from "./library.js";

const readerView = document.getElementById("reader-view");

let currentBook = null;
let epub = null;
let rendition = null;

let sessionStart = null;
let saveTimer = null;

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

    rendition.themes.fontSize(`${getFontSize()}%`);

    await rendition.display(book.currentLocation || undefined);

    bindRelocated();

    startSession();

    await Database.updateBook(book.id, { lastOpened: Date.now() });

}

export function closeReader() {

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

    document.getElementById("reader-container").addEventListener("click", () => {
        readerView.classList.toggle("controls-visible");
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
   Font size (llamado desde settings.js al cambiar)
   ========================================================== */

export function applyFontSize(size) {
    rendition?.themes.fontSize(`${size}%`);
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

/**
 * ==========================================================
 * READZ
 * Library Module
 * ==========================================================
 */

import * as Database from "./database.js";
import { confirmDialog, toast } from "./ui.js";
import { blobToDataUrl } from "./utils.js";
import { PUBLIC_LIBRARY_URL } from "./constants.js";

let onReadNow = null;

/* ==========================================================
   Init
   ========================================================== */

export function initializeLibrary() {

    const importButton = document.getElementById("import-book-button");
    const epubInput = document.getElementById("epub-input");

    importButton.addEventListener("click", () => epubInput.click());

    epubInput.addEventListener("change", handleBookSelection);

    document.querySelectorAll(".explore-link").forEach((button) => {
        button.addEventListener("click", () => {
            document.getElementById("public-library-grid")?.scrollIntoView({ behavior: "smooth" });
        });
    });

    renderLibrary();
    renderPublicLibrary();

}

/* ==========================================================
   Import
   ========================================================== */

async function handleBookSelection(event) {

    const file = event.target.files[0];

    if (!file) return;

    const importButton = document.getElementById("import-book-button");

    importButton.disabled = true;
    importButton.textContent = "Importando...";

    try {

        const buffer = await file.arrayBuffer();

        const book = await createBookFromBuffer(buffer, file.name);

        await Database.saveBook(book);

        renderLibrary();

        showImportSuccess(book);

    } catch (error) {

        console.error("Error al importar EPUB:", error);

        toast("No se pudo importar el archivo");

    } finally {

        importButton.disabled = false;
        importButton.textContent = "Importar EPUB";

        event.target.value = "";

    }

}

/**
 * Parsea el buffer con epub.js, extrae metadata y portada,
 * y arma el objeto Book que se guarda en IndexedDB.
 */
async function createBookFromBuffer(buffer, fallbackName) {

    const epub = ePub(buffer.slice(0));

    await epub.ready;

    const metadata = await epub.loaded.metadata;

    let cover = null;

    try {

        const coverPath = await epub.coverUrl();

        if (coverPath) {
            const response = await fetch(coverPath);
            const blob = await response.blob();
            cover = await blobToDataUrl(blob);
        }

    } catch (error) {
        // No todos los EPUBs traen portada.
    }

    return {
        id: crypto.randomUUID(),
        title: metadata.title || fallbackName.replace(/\.epub$/i, ""),
        author: metadata.creator || "Autor desconocido",
        cover,
        buffer,
        progress: 0,
        currentLocation: null,
        bookmarks: [],
        notes: [],
        highlights: [],
        addedAt: Date.now(),
        lastOpened: null,
        finishedAt: null,
        readingTimeSeconds: 0,
    };

}

/* ==========================================================
   Render — Mi biblioteca
   ========================================================== */

export async function renderLibrary() {

    const books = await Database.getAllBooks();

    const emptyLibrary = document.getElementById("empty-library");
    const libraryGrid = document.getElementById("library-grid");

    if (!emptyLibrary || !libraryGrid) return;

    if (books.length === 0) {
        emptyLibrary.hidden = false;
        libraryGrid.hidden = true;
        return;
    }

    emptyLibrary.hidden = true;
    libraryGrid.hidden = false;

    libraryGrid.innerHTML = "";

    books
        .sort((a, b) => b.addedAt - a.addedAt)
        .forEach((book) => libraryGrid.appendChild(createBookCard(book)));

}

function createBookCard(book) {

    const article = document.createElement("article");
    article.className = "book-card";
    article.dataset.id = book.id;

    const cover = document.createElement("div");
    cover.className = "book-cover";

    if (book.cover) {

        const image = document.createElement("img");
        image.src = book.cover;
        image.alt = book.title;
        cover.appendChild(image);

    } else {

        const icon = document.createElement("div");
        icon.className = "book-cover-placeholder";
        icon.textContent = "📖";
        cover.appendChild(icon);

    }

    const info = document.createElement("div");
    info.className = "book-info";

    const title = document.createElement("h3");
    title.className = "book-title";
    title.textContent = book.title;

    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.author;

    const progress = document.createElement("p");
    progress.className = "book-progress";
    progress.textContent = book.finishedAt ? "Terminado" : `${Math.round((book.progress || 0) * 100)}%`;

    const removeButton = document.createElement("button");
    removeButton.className = "button-link book-remove";
    removeButton.textContent = "Eliminar";

    removeButton.addEventListener("click", async (event) => {

        event.stopPropagation();

        const confirmed = await confirmDialog(`¿Eliminar "${book.title}" de tu biblioteca?`);

        if (confirmed) {
            await Database.deleteBook(book.id);
            renderLibrary();
        }

    });

    info.append(title, author, progress, removeButton);

    article.append(cover, info);

    article.addEventListener("click", () => requestOpenBook(book));

    return article;

}

/* ==========================================================
   Import success notification
   ========================================================== */

function showImportSuccess(book) {

    removeImportNotification();

    const notification = document.createElement("div");
    notification.id = "import-notification";

    notification.innerHTML = `
        <div class="import-notification-content">
            <div class="import-notification-icon">📚</div>
            <div class="import-notification-text">
                <h3>${book.title}</h3>
                <p>Agregado correctamente a tu biblioteca.</p>
            </div>
            <div class="import-notification-actions">
                <button id="read-now-button" class="button-primary">Leer ahora</button>
                <button id="close-notification-button" class="button-link">Ver biblioteca</button>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    notification.querySelector("#read-now-button").addEventListener("click", () => {
        requestOpenBook(book);
        removeImportNotification();
    });

    notification.querySelector("#close-notification-button").addEventListener("click", () => {
        removeImportNotification();
    });

}

function removeImportNotification() {

    const notification = document.getElementById("import-notification");

    if (notification) notification.remove();

}

/* ==========================================================
   Nuestra biblioteca (dominio público)
   ========================================================== */

async function renderPublicLibrary() {

    const grid = document.getElementById("public-library-grid");

    if (!grid) return;

    try {

        const response = await fetch(PUBLIC_LIBRARY_URL);

        if (!response.ok) return;

        const publicBooks = await response.json();

        grid.innerHTML = "";

        publicBooks.forEach((book) => grid.appendChild(createPublicBookCard(book)));

    } catch (error) {
        // Si todavía no existe data/library.json, no rompemos la app.
    }

}

function createPublicBookCard(book) {

    const article = document.createElement("article");
    article.className = "book-card";

    const cover = document.createElement("div");
    cover.className = "book-cover";

    if (book.cover) {
        const image = document.createElement("img");
        image.src = book.cover;
        image.alt = book.title;
        cover.appendChild(image);
    }

    const info = document.createElement("div");
    info.className = "book-info";

    const title = document.createElement("h3");
    title.className = "book-title";
    title.textContent = book.title;

    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.author;

    const addButton = document.createElement("button");
    addButton.className = "button-primary";
    addButton.textContent = "Agregar a mi biblioteca";

    addButton.addEventListener("click", async () => {

        addButton.disabled = true;
        addButton.textContent = "Agregando...";

        try {

            const response = await fetch(book.url);
            const buffer = await response.arrayBuffer();

            const record = await createBookFromBuffer(buffer, book.title);

            record.title = book.title;
            record.author = book.author;

            await Database.saveBook(record);

            toast(`"${book.title}" agregado a tu biblioteca`);

            renderLibrary();

        } catch (error) {

            console.error("Error al agregar libro público:", error);

            toast("No se pudo agregar el libro");

        } finally {

            addButton.disabled = false;
            addButton.textContent = "Agregar a mi biblioteca";

        }

    });

    info.append(title, author, addButton);
    article.append(cover, info);

    return article;

}

/* ==========================================================
   Reader hook
   ========================================================== */

function requestOpenBook(book) {

    if (typeof onReadNow === "function") {
        onReadNow(book);
    }

}

export function setReadNowHandler(callback) {
    onReadNow = callback;
}

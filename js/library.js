/**
 * ==========================================================
 * READZ
 * Library Module
 * ==========================================================
 *
 * Este módulo se encarga de:
 *
 * - Importar EPUBs.
 * - Crear objetos Book.
 * - Administrar la biblioteca en memoria.
 * - Actualizar la interfaz.
 *
 * Más adelante también:
 *
 * - IndexedDB
 * - Eliminar libros
 * - Ordenar biblioteca
 * - Buscar
 * - Sincronizar progreso
 *
 */

const library = [];

/* ==========================================================
   Public API
   ========================================================== */

let onReadNow = null;

export function initializeLibrary() {

    const importButton = document.getElementById("import-book-button");
    const epubInput = document.getElementById("epub-input");

    importButton.addEventListener("click", () => {

        epubInput.click();

    });

    epubInput.addEventListener("change", handleBookSelection);

}

/* ==========================================================
   Import
   ========================================================== */

async function handleBookSelection(event) {

    const file = event.target.files[0];

    if (!file) {

        return;

    }

    console.log("📚 Libro seleccionado:", file.name);

    const buffer = await file.arrayBuffer();

    const epub = ePub(buffer);

    const metadata = await epub.loaded.metadata;

    const newBook = createBook({

        title: metadata.title,

        author: metadata.creator,

        buffer,

        epub

    });

    addBook(newBook);

    renderLibrary();

    event.target.value = "";

}

/* ==========================================================
   Book Factory
   ========================================================== */

function createBook({

    title,

    author,

    buffer,

    epub

}) {

    return {

        id: crypto.randomUUID(),

        title: title || "Sin título",

        author: author || "Autor desconocido",

        cover: null,

        progress: 0,

        currentLocation: null,

        addedAt: Date.now(),

        lastOpened: null,

        buffer,

        epub

    };

}

/* ==========================================================
   Library
   ========================================================== */

function addBook(book) {

    library.push(book);

    console.log("Biblioteca:", library);

}

function getBooks() {

    return library;

}

/* ==========================================================
   Render
   ========================================================== */

function renderLibrary() {

    const books = getBooks();

    const emptyLibrary = document.getElementById("empty-library");

    const libraryGrid = document.getElementById("library-grid");

    if (!emptyLibrary || !libraryGrid) {

        return;

    }

    if (books.length === 0) {

        emptyLibrary.hidden = false;

        libraryGrid.hidden = true;

        return;

    }

    emptyLibrary.hidden = true;

    libraryGrid.hidden = false;

    libraryGrid.innerHTML = "";

    books.forEach(book => {

        libraryGrid.appendChild(

            createBookCard(book)

        );

    });

}

   Book Card
   ========================================================== */

function createBookCard(book) {

    const article = document.createElement("article");

    article.className = "book-card";

    article.dataset.id = book.id;

    /* =======================
       Cover
       ======================= */

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

    /* =======================
       Info
       ======================= */

    const info = document.createElement("div");

    info.className = "book-info";

    const title = document.createElement("h3");

    title.className = "book-title";

    title.textContent = book.title;

    const author = document.createElement("p");

    author.className = "book-author";

    author.textContent = book.author;

    info.appendChild(title);

    info.appendChild(author);

    article.appendChild(cover);

    article.appendChild(info);

    article.addEventListener("click", () => {

        showImportSuccess(book);

    });

    return article;

}

/* ==========================================================
   Import Success
   ========================================================== */

function showImportSuccess(book) {

    removeImportNotification();

    const notification = document.createElement("div");

    notification.id = "import-notification";

    notification.innerHTML = `

        <div class="import-notification-content">

            <div class="import-notification-icon">

                📚

            </div>

            <div class="import-notification-text">

                <h3>${book.title}</h3>

                <p>

                    Agregado correctamente a tu biblioteca.

                </p>

            </div>

            <div class="import-notification-actions">

                <button
                    id="read-now-button"
                    class="button-primary">

                    Leer ahora

                </button>

                <button
                    id="close-notification-button"
                    class="button-link">

                    Ver biblioteca

                </button>

            </div>

        </div>

    `;

    document.body.appendChild(notification);

    const readNowButton =
        notification.querySelector("#read-now-button");

    const closeButton =
        notification.querySelector("#close-notification-button");

    readNowButton.addEventListener("click", () => {

    requestOpenBook(book);

    removeImportNotification();

});

    closeButton.addEventListener("click", () => {

        removeImportNotification();

    });

}

   Notification
   ========================================================== */

function removeImportNotification() {

    const notification = document.getElementById(

        "import-notification"

    );

    if (!notification) {

        return;

    }

    notification.remove();

}

/* ==========================================================
   Reader
   ========================================================== */

function requestOpenBook(book) {

    if (typeof onReadNow === "function") {

        onReadNow(book);

    }

}
/* ==========================================================
   Helpers
   ========================================================== */

export function findBook(id) {

    return library.find(book => book.id === id);

}

export function getLibrary() {

    return [...library];

}

export function hasBooks() {

    return library.length > 0;

}

export function getBookCount() {

    return library.length;

}

export function clearLibrary() {

    library.length = 0;

    renderLibrary();

}

/* ==========================================================
   Init
   ========================================================== */

/*
 * Cuando en el futuro carguemos la biblioteca
 * desde IndexedDB, simplemente llamaremos:
 *
 * renderLibrary();
 *
 * y automáticamente mostrará:
 *
 * - Estado vacío
 * o
 * - Biblioteca
 *
 */

export {

    renderLibrary

};

export function setReadNowHandler(callback) {

    onReadNow = callback;

}

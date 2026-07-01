/**
 * Biblioteca de Readz
 */

const library = [];

export function initializeLibrary() {

    const importButton = document.getElementById("import-book-button");
    const epubInput = document.getElementById("epub-input");

    importButton.addEventListener("click", () => {

        epubInput.click();

    });

    epubInput.addEventListener("change", handleBookSelection);

}

async function handleBookSelection(event) {

    const file = event.target.files[0];

    if (!file) return;

    console.log("📚 Libro seleccionado:", file.name);

    const buffer = await file.arrayBuffer();

    openBook(buffer);

}

async function openBook(buffer) {

    const book = ePub(buffer);

    window.readzBook = book;

    const metadata = await book.loaded.metadata;

    const bookData = {

        id: crypto.randomUUID(),

        title: metadata.title || "Sin título",

        author: metadata.creator || "Autor desconocido",

        cover: null,

        progress: 0,

        addedAt: Date.now(),

        book,
        buffer

    };

    library.push(bookData);

    console.log(library);

    renderLibrary();

}

function renderLibrary() {

    const container = document.getElementById("library-grid");

    container.innerHTML = "";

    library.forEach(book => {

        container.innerHTML += `

            <article class="book-card">

                <div class="book-cover">

                    📖

                </div>

                <h3>

                    ${book.title}

                </h3>

                <p>

                    ${book.author}

                </p>

            </article>

        `;

    });

}

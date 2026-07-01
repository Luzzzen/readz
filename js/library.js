/**
 * Biblioteca de Readz
 */

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

function openBook(buffer) {

    const book = ePub(buffer);

    window.readzBook = book;

    console.log("✅ EPUB cargado.");

    book.loaded.metadata.then(metadata => {

        console.log("Título:", metadata.title);
        console.log("Autor:", metadata.creator);

    });

}

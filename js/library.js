/**
 * Inicializa la importación de libros.
 */

export function initializeLibrary() {

    const importButton = document.getElementById("import-book-button");

    const epubInput = document.getElementById("epub-input");

    importButton.addEventListener("click", () => {

        epubInput.click();

    });

    epubInput.addEventListener("change", handleBookSelection);

}

/**
 * Se ejecuta cuando el usuario selecciona un EPUB.
 */

function handleBookSelection(event) {

    const file = event.target.files[0];

    if (!file) {

        return;

    }

    console.log(file);

}

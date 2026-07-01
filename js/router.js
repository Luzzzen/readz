/* ==========================================================
   READZ
   Router
   ========================================================== */

const libraryView = document.getElementById("library-view");
const readerView = document.getElementById("reader-view");

export function goToLibrary() {

    readerView.hidden = true;
    libraryView.hidden = false;

    readerView.innerHTML = "";

}

export function goToReader() {

    libraryView.hidden = true;
    readerView.hidden = false;

}

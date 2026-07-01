/* ==========================================================
   READZ
   Keyboard
   ========================================================== */

const readerView = document.getElementById("reader-view");

export function initializeKeyboard({ onNext, onPrev, onClose }) {

    document.addEventListener("keyup", (event) => {

        if (readerView.hidden) return;

        if (event.key === "ArrowRight") onNext?.();
        if (event.key === "ArrowLeft") onPrev?.();
        if (event.key === "Escape") onClose?.();

    });

}

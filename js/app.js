import { openDatabase } from "./database.js";
import { initializeUI } from "./ui.js";
import { initializeLibrary, setReadNowHandler } from "./library.js";
import { openBook, closeReader, nextPage, prevPage, applyFontSize, applyTheme } from "./reader.js";
import { initializeSettings } from "./settings.js";
import { initializeKeyboard } from "./keyboard.js";

document.addEventListener("DOMContentLoaded", async () => {

    await openDatabase();

    initializeUI();

    await initializeSettings({ onFontSize: applyFontSize, onTheme: applyTheme });

    initializeLibrary();

    setReadNowHandler(openBook);

    initializeKeyboard({ onNext: nextPage, onPrev: prevPage, onClose: closeReader });

    console.log("📚 Readz iniciado.");

});

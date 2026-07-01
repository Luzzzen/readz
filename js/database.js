/* ==========================================================
   READZ
   Database (IndexedDB)
   ========================================================== */

import { DB_NAME, DB_VERSION, STORES } from "./constants.js";

let db = null;

export function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORES.BOOKS)) {

                const bookStore = database.createObjectStore(STORES.BOOKS, { keyPath: "id" });

                bookStore.createIndex("addedAt", "addedAt", { unique: false });

            }

            if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
                database.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
            }

            if (!database.objectStoreNames.contains(STORES.STATISTICS)) {
                database.createObjectStore(STORES.STATISTICS, { keyPath: "key" });
            }

        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => reject(event.target.error);

    });

}

function transaction(storeName, mode, callback) {

    return new Promise((resolve, reject) => {

        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);

        const request = callback(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

    });

}

/* ==========================================================
   Books
   ========================================================== */

export function saveBook(book) {
    return transaction(STORES.BOOKS, "readwrite", (store) => store.put(book));
}

export function getBook(id) {
    return transaction(STORES.BOOKS, "readonly", (store) => store.get(id));
}

export function getAllBooks() {
    return transaction(STORES.BOOKS, "readonly", (store) => store.getAll());
}

export function deleteBook(id) {
    return transaction(STORES.BOOKS, "readwrite", (store) => store.delete(id));
}

export async function updateBook(id, changes) {

    const book = await getBook(id);

    if (!book) {
        throw new Error(`Libro no encontrado: ${id}`);
    }

    return saveBook({ ...book, ...changes });

}

/* ==========================================================
   Settings
   ========================================================== */

export async function getSetting(key, fallback = null) {

    const result = await transaction(STORES.SETTINGS, "readonly", (store) => store.get(key));

    return result ? result.value : fallback;

}

export function setSetting(key, value) {
    return transaction(STORES.SETTINGS, "readwrite", (store) => store.put({ key, value }));
}

/* ==========================================================
   Statistics
   ========================================================== */

export async function getStatistic(key, fallback = null) {

    const result = await transaction(STORES.STATISTICS, "readonly", (store) => store.get(key));

    return result ? result.value : fallback;

}

export function setStatistic(key, value) {
    return transaction(STORES.STATISTICS, "readwrite", (store) => store.put({ key, value }));
}

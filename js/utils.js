/* ==========================================================
   READZ
   Utils
   ========================================================== */

export function formatProgress(progress) {
    return `${Math.round((progress || 0) * 100)}%`;
}

export function formatReadingTime(seconds) {

    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;

}

export function formatDate(isoString) {

    if (!isoString) return "";

    return new Date(isoString).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

}

export function debounce(fn, delay = 200) {

    let timeoutId;

    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };

}

export function blobToDataUrl(blob) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(blob);

    });

}

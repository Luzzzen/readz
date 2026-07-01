/* ==========================================================
   READZ
   UI
   ========================================================== */

/**
 * Inicializa la interfaz de Readz.
 */
export function initializeUI() {
    console.log("🎨 Interfaz inicializada.");
}

/**
 * Modal de confirmación simple. Devuelve Promise<boolean>.
 */
export function confirmDialog(message, { confirmText = "Confirmar", cancelText = "Cancelar" } = {}) {

    return new Promise((resolve) => {

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        overlay.innerHTML = `
            <div class="modal-box">
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="button-link" data-action="cancel">${cancelText}</button>
                    <button class="button-primary" data-action="confirm">${confirmText}</button>
                </div>
            </div>
        `;

        const close = (result) => {
            overlay.remove();
            resolve(result);
        };

        overlay.addEventListener("click", (event) => {

            if (event.target === overlay) return close(false);

            const action = event.target.dataset.action;

            if (action === "confirm") close(true);
            if (action === "cancel") close(false);

        });

        document.body.appendChild(overlay);

    });

}

/**
 * Notificación breve no invasiva.
 */
export function toast(message, duration = 2500) {

    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;

    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add("visible"));

    setTimeout(() => {
        el.classList.remove("visible");
        setTimeout(() => el.remove(), 300);
    }, duration);

}

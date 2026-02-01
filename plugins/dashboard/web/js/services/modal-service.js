/**
 * Modal Service - Centralized modal management
 * @module services/modal-service
 */
import { signal, computed } from '@preact/signals-core';

/**
 * @typedef {Object} ModalState
 * @property {string} id - Modal ID
 * @property {string} [content] - HTML content (for simple modals)
 * @property {Object} [data] - Data passed to modal
 * @property {boolean} [closable] - Whether modal can be closed by clicking overlay
 */

class ModalServiceClass {
    /** @type {import('@preact/signals-core').Signal<ModalState[]>} */
    openModals = signal([]);

    /** Computed: is any modal open */
    hasOpenModal = computed(() => this.openModals.value.length > 0);

    /** Computed: topmost modal */
    topModal = computed(() =>
        this.openModals.value[this.openModals.value.length - 1]
    );

    /** Event callbacks */
    _onOpen = null;
    _onClose = null;

    /**
     * Initialize modal listeners
     */
    init() {
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.hasOpenModal.value) {
                const top = this.topModal.value;
                if (top?.closable !== false) {
                    this.close(top.id);
                }
            }
        });
    }

    /**
     * Set callback for modal open
     * @param {Function} callback
     */
    onOpen(callback) {
        this._onOpen = callback;
    }

    /**
     * Set callback for modal close
     * @param {Function} callback
     */
    onClose(callback) {
        this._onClose = callback;
    }

    /**
     * Open a modal
     * @param {string} id - Modal ID
     * @param {Object} [options] - Modal options
     */
    open(id, options = {}) {
        // Don't open if already open
        if (this.isOpen(id)) return;

        const state = {
            id,
            content: options.content,
            data: options.data,
            closable: options.closable !== false
        };

        this.openModals.value = [...this.openModals.value, state];

        // Update DOM
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('open');
            if (options.content) {
                const body = modal.querySelector('.modal-body');
                if (body) body.innerHTML = options.content;
            }
        }

        if (this._onOpen) {
            this._onOpen(state);
        }
    }

    /**
     * Close a modal
     * @param {string} id - Modal ID to close
     */
    close(id) {
        const state = this.openModals.value.find(m => m.id === id);
        if (!state) return;

        this.openModals.value = this.openModals.value.filter(m => m.id !== id);

        // Update DOM
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('open');
        }

        if (this._onClose) {
            this._onClose(state);
        }
    }

    /**
     * Close all open modals
     */
    closeAll() {
        const modals = [...this.openModals.value];
        modals.forEach(m => this.close(m.id));
    }

    /**
     * Check if a modal is open
     * @param {string} id - Modal ID
     * @returns {boolean}
     */
    isOpen(id) {
        return this.openModals.value.some(m => m.id === id);
    }

    /**
     * Get modal state
     * @param {string} id - Modal ID
     * @returns {ModalState|undefined}
     */
    getState(id) {
        return this.openModals.value.find(m => m.id === id);
    }

    /**
     * Update modal content
     * @param {string} id - Modal ID
     * @param {string} content - New HTML content
     */
    setContent(id, content) {
        const modal = document.getElementById(id);
        if (modal) {
            const body = modal.querySelector('.modal-body');
            if (body) body.innerHTML = content;
        }

        // Update state
        this.openModals.value = this.openModals.value.map(m =>
            m.id === id ? { ...m, content } : m
        );
    }

    /**
     * Setup click-outside-to-close for existing modal elements
     */
    setupOverlayClose() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const state = this.getState(modal.id);
                    if (state?.closable !== false) {
                        this.close(modal.id);
                    }
                }
            });
        });
    }
}

// Singleton export
export const ModalService = new ModalServiceClass();
export { ModalServiceClass };

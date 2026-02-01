/**
 * Keyboard Service - Global keyboard shortcut management
 * @module services/keyboard-service
 */
import { signal } from '@preact/signals-core';

/**
 * @typedef {Object} ShortcutDefinition
 * @property {string} key - Key to match (e.g., 'k', 'b', 'Escape')
 * @property {boolean} [meta] - Requires Cmd/Ctrl
 * @property {boolean} [shift] - Requires Shift
 * @property {boolean} [alt] - Requires Alt
 * @property {boolean} [allowInInput] - Allow shortcut when input is focused
 * @property {string} description - Human-readable description
 * @property {Function} handler - Function to execute
 */

class KeyboardServiceClass {
    /** @type {Map<string, ShortcutDefinition>} */
    shortcuts = new Map();

    /** Whether shortcuts are currently enabled */
    enabled = signal(true);

    constructor() {
        this._handleKeydown = this._handleKeydown.bind(this);
    }

    /**
     * Initialize keyboard listener
     */
    init() {
        document.addEventListener('keydown', this._handleKeydown);
    }

    /**
     * Cleanup keyboard listener
     */
    destroy() {
        document.removeEventListener('keydown', this._handleKeydown);
    }

    /**
     * Register a keyboard shortcut
     * @param {string} id - Unique identifier for the shortcut
     * @param {ShortcutDefinition} definition - Shortcut definition
     */
    register(id, definition) {
        this.shortcuts.set(id, definition);
    }

    /**
     * Unregister a keyboard shortcut
     * @param {string} id - Shortcut identifier
     */
    unregister(id) {
        this.shortcuts.delete(id);
    }

    /**
     * Register multiple shortcuts at once
     * @param {Object<string, ShortcutDefinition>} shortcuts
     */
    registerAll(shortcuts) {
        Object.entries(shortcuts).forEach(([id, def]) => {
            this.register(id, def);
        });
    }

    /**
     * Enable all shortcuts
     */
    enable() {
        this.enabled.value = true;
    }

    /**
     * Disable all shortcuts
     */
    disable() {
        this.enabled.value = false;
    }

    /**
     * Get all registered shortcuts for display
     * @returns {Array<{id: string, key: string, description: string}>}
     */
    getAll() {
        return Array.from(this.shortcuts.entries()).map(([id, def]) => ({
            id,
            key: this._formatShortcut(def),
            description: def.description
        }));
    }

    /**
     * Format shortcut for display
     * @private
     */
    _formatShortcut(def) {
        const parts = [];
        if (def.meta) parts.push('⌘');
        if (def.shift) parts.push('⇧');
        if (def.alt) parts.push('⌥');
        parts.push(def.key.toUpperCase());
        return parts.join('');
    }

    /**
     * Handle keydown events
     * @private
     */
    _handleKeydown(e) {
        if (!this.enabled.value) return;

        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

        for (const [id, def] of this.shortcuts) {
            // Check modifiers
            const metaMatch = def.meta ? (e.metaKey || e.ctrlKey) : true;
            const shiftMatch = def.shift ? e.shiftKey : !e.shiftKey;
            const altMatch = def.alt ? e.altKey : !e.altKey;
            const keyMatch = e.key.toLowerCase() === def.key.toLowerCase();

            // Skip if in input and not allowed
            if (isInputFocused && !def.allowInInput) {
                // Still allow certain shortcuts like Escape
                if (def.key !== 'Escape') continue;
            }

            if (metaMatch && shiftMatch && altMatch && keyMatch) {
                e.preventDefault();
                def.handler(e);
                return; // Only handle first match
            }
        }
    }
}

// Singleton export
export const KeyboardService = new KeyboardServiceClass();
export { KeyboardServiceClass };

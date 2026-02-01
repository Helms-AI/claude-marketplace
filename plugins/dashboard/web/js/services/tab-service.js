/**
 * Tab Service - Manages editor tabs
 * @module services/tab-service
 */
import { signal, computed } from '@preact/signals-core';

/**
 * @typedef {Object} Tab
 * @property {string} id - Unique tab identifier
 * @property {string} label - Display label
 * @property {string} icon - Tab icon (emoji or reference)
 * @property {boolean} [closable] - Whether tab can be closed
 * @property {boolean} [dirty] - Whether tab has unsaved changes
 */

class TabServiceClass {
    /** @type {import('@preact/signals-core').Signal<Tab[]>} */
    tabs = signal([]);

    /** @type {import('@preact/signals-core').Signal<string>} */
    activeTabId = signal('welcome');

    /** Computed: current active tab */
    activeTab = computed(() =>
        this.tabs.value.find(t => t.id === this.activeTabId.value)
    );

    /** Computed: tab count */
    count = computed(() => this.tabs.value.length);

    /** Event callbacks */
    _onActivate = null;
    _onClose = null;

    /**
     * Set callback for tab activation
     * @param {Function} callback
     */
    onActivate(callback) {
        this._onActivate = callback;
    }

    /**
     * Set callback for tab close
     * @param {Function} callback
     */
    onClose(callback) {
        this._onClose = callback;
    }

    /**
     * Open or activate a tab
     * @param {string} id - Tab ID
     * @param {string} label - Tab label
     * @param {string} icon - Tab icon
     * @param {Object} [options] - Additional options
     */
    open(id, label, icon, options = {}) {
        const existingTab = this.tabs.value.find(t => t.id === id);

        if (existingTab) {
            this.activate(id);
            return;
        }

        const tab = {
            id,
            label,
            icon,
            closable: options.closable !== false,
            dirty: options.dirty || false
        };

        this.tabs.value = [...this.tabs.value, tab];
        this.activate(id);
    }

    /**
     * Activate a tab
     * @param {string} id - Tab ID to activate
     */
    activate(id) {
        const tab = this.tabs.value.find(t => t.id === id);
        if (!tab) return;

        this.activeTabId.value = id;

        if (this._onActivate) {
            this._onActivate(tab);
        }
    }

    /**
     * Close a tab
     * @param {string} id - Tab ID to close
     */
    close(id) {
        const index = this.tabs.value.findIndex(t => t.id === id);
        if (index === -1) return;

        const tab = this.tabs.value[index];
        if (this._onClose) {
            this._onClose(tab);
        }

        this.tabs.value = this.tabs.value.filter(t => t.id !== id);

        // If closing active tab, activate another
        if (this.activeTabId.value === id) {
            const newActive = this.tabs.value[Math.max(0, index - 1)];
            if (newActive) {
                this.activate(newActive.id);
            } else {
                // No tabs left, open welcome
                this.open('welcome', 'Welcome', '🏠');
            }
        }
    }

    /**
     * Close all tabs except the specified one
     * @param {string} [exceptId] - Tab ID to keep open
     */
    closeAll(exceptId) {
        const toClose = this.tabs.value.filter(t => t.id !== exceptId);
        toClose.forEach(t => this.close(t.id));
    }

    /**
     * Navigate to next or previous tab
     * @param {number} direction - 1 for next, -1 for previous
     */
    navigate(direction) {
        if (this.tabs.value.length <= 1) return;

        const currentIndex = this.tabs.value.findIndex(
            t => t.id === this.activeTabId.value
        );

        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = this.tabs.value.length - 1;
        if (newIndex >= this.tabs.value.length) newIndex = 0;

        this.activate(this.tabs.value[newIndex].id);
    }

    /**
     * Navigate to tab at specific index (1-based for keyboard shortcuts)
     * @param {number} index - 1-based tab index
     */
    navigateToIndex(index) {
        const tab = this.tabs.value[index - 1];
        if (tab) {
            this.activate(tab.id);
        }
    }

    /**
     * Update tab properties
     * @param {string} id - Tab ID
     * @param {Partial<Tab>} updates - Properties to update
     */
    update(id, updates) {
        this.tabs.value = this.tabs.value.map(tab =>
            tab.id === id ? { ...tab, ...updates } : tab
        );
    }

    /**
     * Mark tab as dirty (has unsaved changes)
     * @param {string} id - Tab ID
     * @param {boolean} dirty - Dirty state
     */
    setDirty(id, dirty) {
        this.update(id, { dirty });
    }

    /**
     * Check if a tab exists
     * @param {string} id - Tab ID
     * @returns {boolean}
     */
    has(id) {
        return this.tabs.value.some(t => t.id === id);
    }

    /**
     * Get tab by ID
     * @param {string} id - Tab ID
     * @returns {Tab|undefined}
     */
    get(id) {
        return this.tabs.value.find(t => t.id === id);
    }
}

// Singleton export
export const TabService = new TabServiceClass();
export { TabServiceClass };

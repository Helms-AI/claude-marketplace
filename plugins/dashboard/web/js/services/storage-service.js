/**
 * Storage Service - Centralized localStorage management
 * @module services/storage-service
 */

const STORAGE_PREFIX = 'dashboard-';

class StorageServiceClass {
    /**
     * Get a value from storage
     * @param {string} key - Storage key (without prefix)
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*}
     */
    get(key, defaultValue = null) {
        const value = localStorage.getItem(STORAGE_PREFIX + key);
        if (value === null) return defaultValue;

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    /**
     * Set a value in storage
     * @param {string} key - Storage key (without prefix)
     * @param {*} value - Value to store
     */
    set(key, value) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(STORAGE_PREFIX + key, serialized);
    }

    /**
     * Remove a value from storage
     * @param {string} key - Storage key (without prefix)
     */
    remove(key) {
        localStorage.removeItem(STORAGE_PREFIX + key);
    }

    /**
     * Check if a key exists in storage
     * @param {string} key - Storage key (without prefix)
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(STORAGE_PREFIX + key) !== null;
    }

    /**
     * Get all dashboard-related keys
     * @returns {string[]}
     */
    keys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
                keys.push(key.slice(STORAGE_PREFIX.length));
            }
        }
        return keys;
    }

    /**
     * Clear all dashboard storage
     */
    clear() {
        this.keys().forEach(key => this.remove(key));
    }

    // Convenience methods for common values
    getTheme() {
        return this.get('theme', 'light');
    }

    setTheme(theme) {
        this.set('theme', theme);
    }

    getSidebarWidth() {
        return this.get('sidebar-width', 280);
    }

    setSidebarWidth(width) {
        this.set('sidebar-width', width);
    }

    getPanelHeight() {
        return this.get('panel-height', 200);
    }

    setPanelHeight(height) {
        this.set('panel-height', height);
    }

    getExplorerTab() {
        return this.get('explorer-tab', 'work');
    }

    setExplorerTab(tab) {
        this.set('explorer-tab', tab);
    }
}

// Singleton export
export const StorageService = new StorageServiceClass();
export { StorageServiceClass };

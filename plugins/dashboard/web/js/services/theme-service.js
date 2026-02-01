/**
 * Theme Service - Manages light/dark theme switching
 * @module services/theme-service
 */
import { signal, effect } from '@preact/signals-core';

class ThemeServiceClass {
    // Reactive state
    theme = signal(localStorage.getItem('dashboard-theme') || 'light');

    constructor() {
        // Apply theme reactively
        effect(() => {
            document.documentElement.setAttribute('data-theme', this.theme.value);
            localStorage.setItem('dashboard-theme', this.theme.value);
            this._updateIcons();
        });
    }

    /**
     * Initialize theme (apply from storage)
     */
    init() {
        document.documentElement.setAttribute('data-theme', this.theme.value);
        this._updateIcons();
    }

    /**
     * Toggle between light and dark theme
     */
    toggle() {
        this.theme.value = this.theme.value === 'light' ? 'dark' : 'light';
    }

    /**
     * Set a specific theme
     * @param {'light' | 'dark'} themeName
     */
    set(themeName) {
        if (themeName === 'light' || themeName === 'dark') {
            this.theme.value = themeName;
        }
    }

    /**
     * Get current theme
     * @returns {'light' | 'dark'}
     */
    get() {
        return this.theme.value;
    }

    /**
     * Check if dark mode is active
     * @returns {boolean}
     */
    isDark() {
        return this.theme.value === 'dark';
    }

    /**
     * Update theme toggle icons in the UI
     * @private
     */
    _updateIcons() {
        const icon = this.theme.value === 'light' ? '☽' : '☀';

        // Update all theme icons
        document.querySelectorAll('.theme-icon').forEach(el => {
            el.textContent = icon;
        });

        // Update status bar theme
        const statusTheme = document.getElementById('statusTheme');
        if (statusTheme) {
            const span = statusTheme.querySelector('span');
            if (span) span.textContent = icon;
        }
    }
}

// Singleton export
export const ThemeService = new ThemeServiceClass();
export { ThemeServiceClass };

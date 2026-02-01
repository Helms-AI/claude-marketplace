/**
 * Panel Service - Manages resizable panels (sidebar, bottom panel)
 * @module services/panel-service
 */
import { signal, computed } from '@preact/signals-core';
import { StorageService } from './storage-service.js';

/**
 * @typedef {Object} PanelState
 * @property {boolean} collapsed - Whether panel is collapsed
 * @property {number} size - Panel size in pixels
 * @property {string} activeTab - Active tab within the panel
 */

class PanelServiceClass {
    // Sidebar state
    sidebarCollapsed = signal(false);
    sidebarWidth = signal(StorageService.getSidebarWidth());
    sidebarActiveTab = signal(StorageService.getExplorerTab());

    // Bottom panel state
    bottomPanelCollapsed = signal(false);
    bottomPanelHeight = signal(StorageService.getPanelHeight());
    bottomPanelActiveTab = signal('activity');

    // Resize state
    _isResizing = signal(false);

    /**
     * Initialize panels with stored values
     */
    init() {
        this._applySidebarWidth();
        this._applyBottomPanelHeight();
    }

    // ==================== Sidebar ====================

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar() {
        this.sidebarCollapsed.value = !this.sidebarCollapsed.value;
        this._updateSidebarDOM();
    }

    /**
     * Set sidebar width
     * @param {number} width - Width in pixels
     */
    setSidebarWidth(width) {
        if (width >= 200 && width <= 500) {
            this.sidebarWidth.value = width;
            StorageService.setSidebarWidth(width);
            this._applySidebarWidth();
        }
    }

    /**
     * Set active explorer tab
     * @param {string} tabName - Tab name
     */
    setExplorerTab(tabName) {
        this.sidebarActiveTab.value = tabName;
        StorageService.setExplorerTab(tabName);
        this._updateExplorerTabsDOM();
    }

    /**
     * Start sidebar resize
     */
    startSidebarResize() {
        this._isResizing.value = true;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }

    /**
     * Handle sidebar resize move
     * @param {number} clientX - Mouse X position
     */
    handleSidebarResize(clientX) {
        if (this._isResizing.value) {
            this.setSidebarWidth(clientX);
        }
    }

    /**
     * End sidebar resize
     */
    endSidebarResize() {
        if (this._isResizing.value) {
            this._isResizing.value = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }

    // ==================== Bottom Panel ====================

    /**
     * Toggle bottom panel collapsed state
     */
    toggleBottomPanel() {
        this.bottomPanelCollapsed.value = !this.bottomPanelCollapsed.value;
        this._updateBottomPanelDOM();
    }

    /**
     * Set bottom panel height
     * @param {number} height - Height in pixels
     */
    setBottomPanelHeight(height) {
        if (height >= 100 && height <= 500) {
            this.bottomPanelHeight.value = height;
            StorageService.setPanelHeight(height);
            this._applyBottomPanelHeight();
        }
    }

    /**
     * Switch bottom panel tab
     * @param {string} tabName - Tab name
     */
    setBottomPanelTab(tabName) {
        this.bottomPanelActiveTab.value = tabName;
        this._updateBottomPanelTabsDOM();
    }

    /**
     * Maximize/restore bottom panel
     */
    toggleBottomPanelMaximize() {
        if (this.bottomPanelHeight.value < 400) {
            this.setBottomPanelHeight(400);
        } else {
            this.setBottomPanelHeight(200);
        }
    }

    // ==================== DOM Updates ====================

    /** @private */
    _applySidebarWidth() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.width = this.sidebarWidth.value + 'px';
        }
    }

    /** @private */
    _updateSidebarDOM() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.sidebarCollapsed.value);
        }
    }

    /** @private */
    _applyBottomPanelHeight() {
        const panel = document.getElementById('bottomPanel');
        if (panel) {
            panel.style.height = this.bottomPanelHeight.value + 'px';
        }
    }

    /** @private */
    _updateBottomPanelDOM() {
        const panel = document.getElementById('bottomPanel');
        if (panel) {
            panel.classList.toggle('collapsed', this.bottomPanelCollapsed.value);
        }
    }

    /** @private */
    _updateExplorerTabsDOM() {
        const tabName = this.sidebarActiveTab.value;

        // Update tab buttons
        document.querySelectorAll('.explorer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.explorer-tab-content').forEach(content => {
            const contentTab = content.id.replace('TabContent', '');
            content.classList.toggle('active', contentTab === tabName);
        });
    }

    /** @private */
    _updateBottomPanelTabsDOM() {
        const tabName = this.bottomPanelActiveTab.value;

        // Update tab buttons
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.panel-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Panel');
        });
    }
}

// Singleton export
export const PanelService = new PanelServiceClass();
export { PanelServiceClass };

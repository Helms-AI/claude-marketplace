/**
 * Artifact Tab Bar Organism - Tab container with overflow handling
 * @module components/organisms/artifact-tab-bar
 *
 * Manages multiple artifact tabs with horizontal scrolling,
 * fade indicators, and active tab state.
 *
 * @example
 * ```html
 * <artifact-tab-bar
 *   @artifact-select="${this._handleSelect}"
 *   @artifact-close="${this._handleClose}"
 * ></artifact-tab-bar>
 * ```
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';
import '../molecules/artifact-tab.js';
import '../atoms/icon.js';

class ArtifactTabBar extends SignalWatcher(LitElement) {
    static properties = {
        _hasOverflowLeft: { type: Boolean, state: true },
        _hasOverflowRight: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: block;
            height: 42px;
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .container {
            display: flex;
            align-items: stretch;
            height: 100%;
            position: relative;
        }

        /* Scroll buttons */
        .scroll-button {
            display: none;
            align-items: center;
            justify-content: center;
            width: 24px;
            flex-shrink: 0;
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            border: none;
            color: var(--text-muted, #6e7681);
            cursor: pointer;
            transition: all 0.15s ease;
            z-index: 1;
        }

        .scroll-button:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-primary, #cccccc);
        }

        .scroll-button.visible {
            display: flex;
        }

        .scroll-button.left {
            border-right: 1px solid var(--border-color, #3c3c3c);
        }

        .scroll-button.right {
            border-left: 1px solid var(--border-color, #3c3c3c);
        }

        /* Tab container with scroll */
        .tabs-container {
            flex: 1;
            display: flex;
            align-items: stretch;
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
            position: relative;
        }

        .tabs-container::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
        }

        /* Fade indicators */
        .tabs-container::before,
        .tabs-container::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 24px;
            pointer-events: none;
            z-index: 1;
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        .tabs-container::before {
            left: 0;
            background: linear-gradient(
                to right,
                var(--bg-secondary, rgba(30, 30, 30, 1)),
                transparent
            );
        }

        .tabs-container::after {
            right: 0;
            background: linear-gradient(
                to left,
                var(--bg-secondary, rgba(30, 30, 30, 1)),
                transparent
            );
        }

        :host([data-overflow-left]) .tabs-container::before {
            opacity: 1;
        }

        :host([data-overflow-right]) .tabs-container::after {
            opacity: 1;
        }

        /* Tabs area */
        .tabs {
            display: flex;
            align-items: stretch;
            gap: 0;
            padding: 0 var(--spacing-xs, 4px);
        }

        /* Empty state */
        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            padding: var(--spacing-sm, 8px);
            color: var(--text-muted, #6e7681);
            font-size: var(--font-size-xs, 11px);
            gap: var(--spacing-xs, 4px);
        }

        /* Actions */
        .actions {
            display: flex;
            align-items: center;
            padding: 0 var(--spacing-sm, 8px);
            border-left: 1px solid var(--border-color, #3c3c3c);
            flex-shrink: 0;
        }

        .action-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #6e7681);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .action-button:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-primary, #cccccc);
        }

        .action-button:active {
            transform: scale(0.95);
        }

        .action-button[disabled] {
            opacity: 0.3;
            pointer-events: none;
        }
    `;

    constructor() {
        super();
        this._hasOverflowLeft = false;
        this._hasOverflowRight = false;
        this._scrollContainer = null;
    }

    firstUpdated() {
        this._scrollContainer = this.shadowRoot.querySelector('.tabs-container');
        if (this._scrollContainer) {
            this._scrollContainer.addEventListener('scroll', () => this._checkOverflow());
            // Initial check
            this._checkOverflow();
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        // Re-check overflow when tabs change
        requestAnimationFrame(() => this._checkOverflow());
    }

    _checkOverflow() {
        if (!this._scrollContainer) return;

        const { scrollLeft, scrollWidth, clientWidth } = this._scrollContainer;
        this._hasOverflowLeft = scrollLeft > 0;
        this._hasOverflowRight = scrollLeft + clientWidth < scrollWidth - 1;

        // Update data attributes for CSS
        if (this._hasOverflowLeft) {
            this.setAttribute('data-overflow-left', '');
        } else {
            this.removeAttribute('data-overflow-left');
        }

        if (this._hasOverflowRight) {
            this.setAttribute('data-overflow-right', '');
        } else {
            this.removeAttribute('data-overflow-right');
        }
    }

    _scrollLeft() {
        if (this._scrollContainer) {
            this._scrollContainer.scrollBy({ left: -150, behavior: 'smooth' });
        }
    }

    _scrollRight() {
        if (this._scrollContainer) {
            this._scrollContainer.scrollBy({ left: 150, behavior: 'smooth' });
        }
    }

    render() {
        const tabs = AppStore.artifactTabs.value;
        const activeId = AppStore.activeArtifactId.value;
        const artifacts = AppStore.artifacts.value;
        const loadStates = AppStore.artifactLoadStates.value;

        return html`
            <div class="container">
                <!-- Left scroll button -->
                <button
                    class="scroll-button left ${this._hasOverflowLeft ? 'visible' : ''}"
                    @click="${this._scrollLeft}"
                    title="Scroll left"
                    aria-label="Scroll tabs left"
                >
                    <dash-icon name="chevron-left" size="14"></dash-icon>
                </button>

                <!-- Tabs container -->
                <div class="tabs-container" role="tablist">
                    ${tabs.length === 0
                        ? html`
                            <div class="empty-state">
                                <dash-icon name="file" size="14"></dash-icon>
                                <span>No artifacts open</span>
                            </div>
                        `
                        : html`
                            <div class="tabs">
                                ${tabs.map(id => {
                                    const artifact = artifacts.get(id);
                                    const loadState = loadStates.get(id) || 'loaded';
                                    return this._renderTab(id, artifact, activeId === id, loadState);
                                })}
                            </div>
                        `
                    }
                </div>

                <!-- Right scroll button -->
                <button
                    class="scroll-button right ${this._hasOverflowRight ? 'visible' : ''}"
                    @click="${this._scrollRight}"
                    title="Scroll right"
                    aria-label="Scroll tabs right"
                >
                    <dash-icon name="chevron-right" size="14"></dash-icon>
                </button>

                <!-- Actions -->
                <div class="actions">
                    <button
                        class="action-button"
                        @click="${this._closeAllTabs}"
                        ?disabled="${tabs.length === 0}"
                        title="Close all tabs"
                        aria-label="Close all artifact tabs"
                    >
                        <dash-icon name="x" size="14"></dash-icon>
                    </button>
                </div>
            </div>
        `;
    }

    _renderTab(id, artifact, isActive, loadState) {
        if (!artifact) {
            return html`
                <artifact-tab
                    artifact-id="${id}"
                    filename="Loading..."
                    ?active="${isActive}"
                    loading
                    @artifact-select="${this._handleSelect}"
                    @artifact-close="${this._handleClose}"
                ></artifact-tab>
            `;
        }

        return html`
            <artifact-tab
                artifact-id="${id}"
                filename="${artifact.filename || artifact.path?.split('/').pop() || 'Untitled'}"
                extension="${artifact.extension || ''}"
                mime-type="${artifact.mimeType || ''}"
                ?active="${isActive}"
                ?loading="${loadState === 'loading'}"
                ?error="${loadState === 'error'}"
                @artifact-select="${this._handleSelect}"
                @artifact-close="${this._handleClose}"
            ></artifact-tab>
        `;
    }

    _handleSelect(e) {
        const { artifactId } = e.detail;
        Actions.setActiveArtifact(artifactId);

        // Re-dispatch for parent components
        this.dispatchEvent(new CustomEvent('artifact-select', {
            detail: { artifactId },
            bubbles: true,
            composed: true
        }));
    }

    _handleClose(e) {
        const { artifactId } = e.detail;
        Actions.closeArtifactTab(artifactId);

        // Re-dispatch for parent components
        this.dispatchEvent(new CustomEvent('artifact-close', {
            detail: { artifactId },
            bubbles: true,
            composed: true
        }));
    }

    _closeAllTabs() {
        const tabs = [...AppStore.artifactTabs.value];
        tabs.forEach(id => Actions.closeArtifactTab(id));

        this.dispatchEvent(new CustomEvent('artifact-close-all', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('artifact-tab-bar', ArtifactTabBar);
export { ArtifactTabBar };

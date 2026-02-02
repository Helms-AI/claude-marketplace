/**
 * Artifact Tab Molecule - Tab for artifact viewer with file icon and close button
 * @module components/molecules/artifact-tab
 *
 * Combines artifact-icon, label, and close-tab-button for file tabs.
 *
 * @example
 * ```html
 * <artifact-tab
 *   artifact-id="changeset:path/file.md"
 *   filename="README.md"
 *   extension=".md"
 *   ?active="${isActive}"
 *   @artifact-select="${this._handleSelect}"
 *   @artifact-close="${this._handleClose}"
 * ></artifact-tab>
 * ```
 */
import { LitElement, html, css } from 'lit';
import '../atoms/artifact-icon.js';
import '../atoms/close-tab-button.js';

class ArtifactTab extends LitElement {
    static properties = {
        artifactId: { type: String, attribute: 'artifact-id' },
        filename: { type: String },
        extension: { type: String },
        mimeType: { type: String, attribute: 'mime-type' },
        active: { type: Boolean, reflect: true },
        modified: { type: Boolean, reflect: true },
        loading: { type: Boolean, reflect: true },
        error: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: inline-flex;
            flex-shrink: 0;
        }

        .tab {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            padding-right: var(--spacing-xs, 4px);
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            font-family: inherit;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            transition: all 0.15s ease;
            max-width: 180px;
            min-width: 80px;
            position: relative;
        }

        .tab:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            color: var(--text-primary, #cccccc);
        }

        /* Active state */
        :host([active]) .tab {
            background: var(--bg-secondary, rgba(255, 255, 255, 0.08));
            color: var(--text-primary, #cccccc);
            border-bottom-color: var(--accent-color, #007acc);
        }

        /* Lift effect for active tab */
        :host([active]) .tab::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--accent-color, #007acc);
            opacity: 0.3;
        }

        /* Modified indicator */
        :host([modified]) .tab::after {
            content: '';
            position: absolute;
            top: 6px;
            right: 6px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--warning-color, #ffc107);
        }

        /* Loading state */
        :host([loading]) .tab {
            opacity: 0.7;
        }

        /* Error state */
        :host([error]) .tab {
            color: var(--danger-color, #ef4444);
        }

        :host([error]) .tab::after {
            background: var(--danger-color, #ef4444);
        }

        /* Icon container */
        .icon {
            display: flex;
            flex-shrink: 0;
        }

        /* Filename */
        .filename {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
            min-width: 0;
            text-align: left;
        }

        /* Close button container */
        .close-container {
            display: flex;
            flex-shrink: 0;
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        .tab:hover .close-container,
        :host([active]) .close-container {
            opacity: 1;
        }

        /* Loading spinner */
        .spinner {
            width: 12px;
            height: 12px;
            border: 2px solid var(--text-muted, #6e7681);
            border-right-color: transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Focus state */
        .tab:focus-visible {
            outline: none;
            box-shadow: inset 0 0 0 2px var(--accent-color, #007acc);
        }
    `;

    constructor() {
        super();
        this.artifactId = '';
        this.filename = '';
        this.extension = '';
        this.mimeType = '';
        this.active = false;
        this.modified = false;
        this.loading = false;
        this.error = false;
    }

    /**
     * Extract extension from filename if not provided
     */
    _getExtension() {
        if (this.extension) return this.extension;
        if (this.filename) {
            const lastDot = this.filename.lastIndexOf('.');
            if (lastDot > 0) {
                return this.filename.substring(lastDot);
            }
        }
        return '';
    }

    /**
     * Get display name (truncate if needed)
     */
    _getDisplayName() {
        return this.filename || 'Untitled';
    }

    render() {
        const ext = this._getExtension();

        return html`
            <button
                class="tab"
                role="tab"
                aria-selected="${this.active}"
                aria-label="${this.filename}"
                @click="${this._handleClick}"
                @auxclick="${this._handleMiddleClick}"
            >
                <span class="icon">
                    ${this.loading
                        ? html`<span class="spinner"></span>`
                        : html`<artifact-icon
                            extension="${ext}"
                            mime-type="${this.mimeType}"
                            size="14"
                          ></artifact-icon>`
                    }
                </span>
                <span class="filename" title="${this.filename}">
                    ${this._getDisplayName()}
                </span>
                <span class="close-container">
                    <close-tab-button
                        size="sm"
                        @close-tab="${this._handleClose}"
                    ></close-tab-button>
                </span>
            </button>
        `;
    }

    _handleClick(e) {
        this.dispatchEvent(new CustomEvent('artifact-select', {
            detail: { artifactId: this.artifactId },
            bubbles: true,
            composed: true
        }));
    }

    _handleMiddleClick(e) {
        // Middle click to close
        if (e.button === 1) {
            e.preventDefault();
            this._handleClose(e);
        }
    }

    _handleClose(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('artifact-close', {
            detail: { artifactId: this.artifactId },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('artifact-tab', ArtifactTab);
export { ArtifactTab };

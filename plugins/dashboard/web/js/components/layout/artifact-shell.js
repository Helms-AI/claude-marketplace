/**
 * Artifact Shell Layout - Complete artifact viewer assembly
 * @module components/layout/artifact-shell
 *
 * Combines artifact tab bar with content viewer.
 * Manages artifact navigation and display.
 *
 * @example
 * ```html
 * <artifact-shell></artifact-shell>
 * ```
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';
import { ArtifactService } from '../../services/artifact-service.js';
import '../organisms/artifact-tab-bar.js';
import '../organisms/artifact-viewer.js';
import '../atoms/icon.js';

class ArtifactShell extends SignalWatcher(LitElement) {
    static properties = {
        _dropActive: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--bg-primary, #1e1e1e);
        }

        /* Tab bar container */
        .tab-bar-container {
            flex-shrink: 0;
        }

        /* Content area */
        .content-area {
            flex: 1;
            overflow: hidden;
            position: relative;
        }

        /* Drop overlay */
        .drop-overlay {
            position: absolute;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(0, 122, 204, 0.1);
            border: 2px dashed var(--accent-color, #007acc);
            border-radius: var(--radius-md, 6px);
            margin: var(--spacing-sm, 8px);
            z-index: 10;
        }

        :host([data-drop-active]) .drop-overlay {
            display: flex;
        }

        .drop-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-md, 12px);
            color: var(--accent-color, #007acc);
            padding: var(--spacing-xl, 24px);
            text-align: center;
        }

        .drop-icon {
            opacity: 0.8;
        }

        .drop-text {
            font-size: var(--font-size-base, 13px);
            font-weight: 500;
        }

        .drop-hint {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
        }

        /* Empty state when no tabs */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: var(--spacing-lg, 16px);
            color: var(--text-muted, #6e7681);
            padding: var(--spacing-xl, 24px);
        }

        .empty-icon {
            opacity: 0.3;
        }

        .empty-title {
            font-size: var(--font-size-lg, 16px);
            color: var(--text-secondary, #8b949e);
        }

        .empty-description {
            font-size: var(--font-size-sm, 12px);
            max-width: 300px;
            text-align: center;
            line-height: 1.5;
        }

        .open-file-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-md, 6px);
            background: transparent;
            color: var(--text-primary, #cccccc);
            font-size: var(--font-size-sm, 12px);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .open-file-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            border-color: var(--accent-color, #007acc);
            color: var(--accent-color, #007acc);
        }

        /* Hidden file input */
        .file-input {
            display: none;
        }
    `;

    constructor() {
        super();
        this._dropActive = false;
    }

    connectedCallback() {
        super.connectedCallback();

        // Set up drag/drop handlers on the component
        this.addEventListener('dragenter', this._handleDragEnter.bind(this));
        this.addEventListener('dragover', this._handleDragOver.bind(this));
        this.addEventListener('dragleave', this._handleDragLeave.bind(this));
        this.addEventListener('drop', this._handleDrop.bind(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        this.removeEventListener('dragenter', this._handleDragEnter);
        this.removeEventListener('dragover', this._handleDragOver);
        this.removeEventListener('dragleave', this._handleDragLeave);
        this.removeEventListener('drop', this._handleDrop);
    }

    _handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        this._dropActive = true;
        this.setAttribute('data-drop-active', '');
    }

    _handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    _handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        // Only deactivate if leaving the component entirely
        const rect = this.getBoundingClientRect();
        if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
        ) {
            this._dropActive = false;
            this.removeAttribute('data-drop-active');
        }
    }

    async _handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        this._dropActive = false;
        this.removeAttribute('data-drop-active');

        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        // Open each dropped file
        for (const file of files) {
            try {
                await ArtifactService.openLocalFile(file);
            } catch (error) {
                console.error('Failed to open dropped file:', error);
            }
        }
    }

    _handleOpenFile() {
        const input = this.shadowRoot.querySelector('.file-input');
        input?.click();
    }

    async _handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            try {
                await ArtifactService.openLocalFile(file);
            } catch (error) {
                console.error('Failed to open file:', error);
            }
        }

        // Clear the input for future selections
        e.target.value = '';
    }

    async _handleRetry(e) {
        const { artifactId } = e.detail;
        const artifact = AppStore.artifacts.value.get(artifactId);
        if (artifact) {
            try {
                await ArtifactService.refreshArtifact(artifactId);
            } catch (error) {
                console.error('Failed to refresh artifact:', error);
            }
        }
    }

    render() {
        const tabs = AppStore.artifactTabs.value;
        const activeId = AppStore.activeArtifactId.value;
        const hasArtifacts = tabs.length > 0;

        return html`
            <!-- Tab bar -->
            <div class="tab-bar-container">
                <artifact-tab-bar></artifact-tab-bar>
            </div>

            <!-- Content area -->
            <div class="content-area">
                ${hasArtifacts
                    ? html`
                        <artifact-viewer
                            artifact-id="${activeId}"
                            @artifact-retry="${this._handleRetry}"
                        ></artifact-viewer>
                    `
                    : html`
                        <div class="empty-state">
                            <dash-icon name="files" size="64" class="empty-icon"></dash-icon>
                            <span class="empty-title">No artifacts open</span>
                            <span class="empty-description">
                                Open files from changesets in the sidebar, or drag and drop files here to view them.
                            </span>
                            <button class="open-file-btn" @click="${this._handleOpenFile}">
                                <dash-icon name="folder-open" size="14"></dash-icon>
                                Open File
                            </button>
                        </div>
                    `
                }

                <!-- Drop overlay -->
                <div class="drop-overlay">
                    <div class="drop-content">
                        <dash-icon name="upload" size="48" class="drop-icon"></dash-icon>
                        <span class="drop-text">Drop files to view</span>
                        <span class="drop-hint">Supported: text, code, images, JSON, and more</span>
                    </div>
                </div>
            </div>

            <!-- Hidden file input -->
            <input
                type="file"
                class="file-input"
                multiple
                @change="${this._handleFileSelect}"
            />
        `;
    }
}

customElements.define('artifact-shell', ArtifactShell);
export { ArtifactShell };

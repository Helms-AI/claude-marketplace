/**
 * Artifact Viewer Organism - Content dispatcher to appropriate renderer
 * @module components/organisms/artifact-viewer
 *
 * Displays artifact content using the appropriate renderer based on
 * the negotiated content type.
 *
 * @example
 * ```html
 * <artifact-viewer artifact-id="changeset:path/file.md"></artifact-viewer>
 * ```
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore } from '../../store/app-state.js';
import { RendererType } from '../../lib/artifact-negotiator.js';
import '../atoms/icon.js';
import '../atoms/spinner.js';
import './text-viewer.js';
import './markdown-viewer.js';
import './json-tree-viewer.js';
import './code-viewer.js';

class ArtifactViewer extends SignalWatcher(LitElement) {
    static properties = {
        artifactId: { type: String, attribute: 'artifact-id' }
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow: hidden;
            background: var(--bg-primary, #1e1e1e);
        }

        .container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        /* Loading state */
        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: var(--spacing-md, 12px);
            color: var(--text-muted, #6e7681);
        }

        .loading-text {
            font-size: var(--font-size-sm, 12px);
        }

        /* Error state */
        .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: var(--spacing-md, 12px);
            color: var(--danger-color, #ef4444);
            padding: var(--spacing-xl, 24px);
            text-align: center;
        }

        .error-title {
            font-size: var(--font-size-lg, 16px);
            font-weight: 600;
        }

        .error-message {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-muted, #6e7681);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-radius: var(--radius-sm, 4px);
            font-family: var(--font-mono, 'Fira Code', monospace);
            max-width: 100%;
            overflow-x: auto;
        }

        .retry-btn {
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

        .retry-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            border-color: var(--accent-color, #007acc);
        }

        /* Empty state */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: var(--spacing-md, 12px);
            color: var(--text-muted, #6e7681);
        }

        .empty-state dash-icon {
            opacity: 0.5;
        }

        .empty-text {
            font-size: var(--font-size-sm, 12px);
        }

        /* Viewer container */
        .viewer-container {
            flex: 1;
            overflow: hidden;
        }

        .viewer-container > * {
            height: 100%;
        }

        /* Image viewer */
        .image-viewer {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .image-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            border-bottom: 1px solid var(--border-color, #3c3c3c);
            flex-shrink: 0;
        }

        .image-filename {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            font-family: var(--font-mono, 'Fira Code', monospace);
        }

        .image-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
            padding: var(--spacing-lg, 16px);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.02));
        }

        .image-container img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: var(--radius-sm, 4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* Binary viewer */
        .binary-viewer {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: var(--spacing-md, 12px);
            color: var(--text-muted, #6e7681);
            padding: var(--spacing-xl, 24px);
        }

        .binary-icon {
            opacity: 0.5;
        }

        .binary-info {
            text-align: center;
        }

        .binary-filename {
            font-size: var(--font-size-base, 13px);
            color: var(--text-primary, #cccccc);
            margin-bottom: var(--spacing-xs, 4px);
        }

        .binary-size {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
        }

        .download-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border: 1px solid var(--accent-color, #007acc);
            border-radius: var(--radius-md, 6px);
            background: transparent;
            color: var(--accent-color, #007acc);
            font-size: var(--font-size-sm, 12px);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .download-btn:hover {
            background: var(--accent-color, #007acc);
            color: white;
        }
    `;

    constructor() {
        super();
        this.artifactId = null;
    }

    _getArtifact() {
        if (!this.artifactId) return null;
        return AppStore.artifacts.value.get(this.artifactId);
    }

    _getLoadState() {
        if (!this.artifactId) return null;
        return AppStore.artifactLoadStates.value.get(this.artifactId);
    }

    _formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    _handleRetry() {
        // Dispatch event for parent to handle retry
        this.dispatchEvent(new CustomEvent('artifact-retry', {
            detail: { artifactId: this.artifactId },
            bubbles: true,
            composed: true
        }));
    }

    _handleDownload() {
        const artifact = this._getArtifact();
        if (!artifact?.content) return;

        try {
            // Create blob from content
            const isDataUrl = artifact.content.startsWith('data:');
            let blob;

            if (isDataUrl) {
                // Convert data URL to blob
                const parts = artifact.content.split(',');
                const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
                const data = atob(parts[1]);
                const array = new Uint8Array(data.length);
                for (let i = 0; i < data.length; i++) {
                    array[i] = data.charCodeAt(i);
                }
                blob = new Blob([array], { type: mime });
            } else {
                blob = new Blob([artifact.content], {
                    type: artifact.mimeType || 'application/octet-stream'
                });
            }

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = artifact.filename || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    }

    render() {
        if (!this.artifactId) {
            return html`
                <div class="container">
                    <div class="empty-state">
                        <dash-icon name="file" size="48"></dash-icon>
                        <span class="empty-text">Select an artifact to view</span>
                    </div>
                </div>
            `;
        }

        const loadState = this._getLoadState();
        const artifact = this._getArtifact();

        // Loading state
        if (loadState === 'loading') {
            return html`
                <div class="container">
                    <div class="loading-state">
                        <dash-spinner size="32"></dash-spinner>
                        <span class="loading-text">Loading artifact...</span>
                    </div>
                </div>
            `;
        }

        // Error state
        if (loadState === 'error') {
            return html`
                <div class="container">
                    <div class="error-state">
                        <dash-icon name="alert-circle" size="48"></dash-icon>
                        <span class="error-title">Failed to load artifact</span>
                        ${artifact?.error ? html`
                            <div class="error-message">${artifact.error}</div>
                        ` : ''}
                        <button class="retry-btn" @click="${this._handleRetry}">
                            <dash-icon name="refresh-cw" size="14"></dash-icon>
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }

        // No artifact data
        if (!artifact?.content) {
            return html`
                <div class="container">
                    <div class="empty-state">
                        <dash-icon name="file-question" size="48"></dash-icon>
                        <span class="empty-text">Artifact not found</span>
                    </div>
                </div>
            `;
        }

        // Render appropriate viewer based on renderer type
        return html`
            <div class="container">
                <div class="viewer-container">
                    ${this._renderContent(artifact)}
                </div>
            </div>
        `;
    }

    _renderContent(artifact) {
        const rendererType = artifact.rendererType || RendererType.TEXT;

        switch (rendererType) {
            case RendererType.MARKDOWN:
                return html`
                    <markdown-viewer
                        .content="${artifact.content}"
                        filename="${artifact.filename}"
                    ></markdown-viewer>
                `;

            case RendererType.JSON:
                return html`
                    <json-tree-viewer
                        .content="${artifact.content}"
                        filename="${artifact.filename}"
                    ></json-tree-viewer>
                `;

            case RendererType.CODE:
                return html`
                    <code-viewer
                        .content="${artifact.content}"
                        filename="${artifact.filename}"
                        language="${artifact.language || ''}"
                    ></code-viewer>
                `;

            case RendererType.IMAGE:
                return this._renderImage(artifact);

            case RendererType.BINARY:
                return this._renderBinary(artifact);

            case RendererType.TEXT:
            default:
                return html`
                    <text-viewer
                        .content="${artifact.content}"
                        filename="${artifact.filename}"
                    ></text-viewer>
                `;
        }
    }

    _renderImage(artifact) {
        // Handle both data URLs and regular content
        const src = artifact.content.startsWith('data:')
            ? artifact.content
            : `data:${artifact.mimeType || 'image/png'};base64,${btoa(artifact.content)}`;

        return html`
            <div class="image-viewer">
                <div class="image-toolbar">
                    <span class="image-filename">${artifact.filename}</span>
                </div>
                <div class="image-container">
                    <img src="${src}" alt="${artifact.filename}" />
                </div>
            </div>
        `;
    }

    _renderBinary(artifact) {
        return html`
            <div class="binary-viewer">
                <dash-icon name="file-archive" size="64" class="binary-icon"></dash-icon>
                <div class="binary-info">
                    <div class="binary-filename">${artifact.filename}</div>
                    <div class="binary-size">${this._formatFileSize(artifact.size)}</div>
                </div>
                <button class="download-btn" @click="${this._handleDownload}">
                    <dash-icon name="download" size="14"></dash-icon>
                    Download
                </button>
            </div>
        `;
    }
}

customElements.define('artifact-viewer', ArtifactViewer);
export { ArtifactViewer };

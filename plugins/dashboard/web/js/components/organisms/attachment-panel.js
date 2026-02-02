/**
 * Attachment Panel - Displays attachments in Activities Aside
 * @module components/organisms/attachment-panel
 *
 * Shows a vertical list of current attachments with thumbnails,
 * file info, and remove actions. Integrates with AttachmentService.
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';
import { AttachmentService } from '../../services/attachment-service.js';
import '../atoms/icon.js';

class AttachmentPanel extends SignalWatcher(LitElement) {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
            flex-shrink: 0;
        }

        .header-info {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
        }

        .clear-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border: none;
            background: transparent;
            color: var(--text-muted, #9ca3af);
            font-size: var(--font-size-xs, 11px);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .clear-btn:hover {
            background: var(--error-bg, rgba(239, 68, 68, 0.1));
            color: var(--error-color, #ef4444);
        }

        .attachment-list {
            flex: 1;
            overflow-y: auto;
            padding: var(--spacing-sm, 8px);
        }

        .attachment-item {
            display: flex;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px);
            background: var(--bg-tertiary, #2d2d2d);
            border-radius: var(--radius-md, 8px);
            margin-bottom: var(--spacing-sm, 8px);
            animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-8px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .attachment-thumbnail {
            flex-shrink: 0;
            width: 48px;
            height: 48px;
            border-radius: var(--radius-sm, 4px);
            overflow: hidden;
            background: var(--bg-secondary, #1e1e1e);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .attachment-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .attachment-thumbnail .placeholder {
            color: var(--text-muted, #9ca3af);
        }

        .attachment-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2px;
        }

        .attachment-name {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #e0e0e0);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .attachment-meta {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-size: var(--font-size-xs, 10px);
            color: var(--text-muted, #9ca3af);
        }

        .attachment-actions {
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }

        .remove-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .remove-btn:hover {
            background: var(--error-bg, rgba(239, 68, 68, 0.1));
            color: var(--error-color, #ef4444);
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: var(--spacing-lg, 24px);
            text-align: center;
            color: var(--text-muted, #9ca3af);
        }

        .empty-state dash-icon {
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.5;
        }

        .empty-state p {
            font-size: var(--font-size-sm, 12px);
            margin: 0;
            line-height: 1.5;
        }

        .drop-zone {
            margin: var(--spacing-sm, 8px);
            padding: var(--spacing-md, 16px);
            border: 2px dashed var(--border-color, #3c3c3c);
            border-radius: var(--radius-md, 8px);
            text-align: center;
            color: var(--text-muted, #9ca3af);
            font-size: var(--font-size-xs, 11px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .drop-zone.drag-over {
            border-color: var(--accent-color, #3b82f6);
            background: var(--accent-color-alpha, rgba(59, 130, 246, 0.1));
        }

        .drop-zone p {
            margin: var(--spacing-xs, 4px) 0 0;
        }
    `;

    constructor() {
        super();
        this._dragOver = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.currentAttachments
        ]);
    }

    /**
     * Get current attachments from store
     * @private
     */
    get _attachments() {
        return AppStore.currentAttachments?.value || [];
    }

    /**
     * Format file size for display
     * @private
     */
    _formatSize(bytes) {
        return AttachmentService.formatSize(bytes);
    }

    /**
     * Get file type label
     * @private
     */
    _getTypeLabel(mimeType) {
        if (!mimeType) return 'File';
        const type = mimeType.split('/')[1]?.toUpperCase() || 'FILE';
        return type;
    }

    /**
     * Handle remove attachment
     * @private
     */
    _handleRemove(attachmentId) {
        Actions.removeAttachment(attachmentId);
    }

    /**
     * Handle clear all attachments
     * @private
     */
    _handleClearAll() {
        Actions.clearAttachments();
    }

    /**
     * Handle drag over
     * @private
     */
    _handleDragOver(e) {
        e.preventDefault();
        this._dragOver = true;
        this.requestUpdate();
    }

    /**
     * Handle drag leave
     * @private
     */
    _handleDragLeave(e) {
        e.preventDefault();
        this._dragOver = false;
        this.requestUpdate();
    }

    /**
     * Handle drop
     * @private
     */
    async _handleDrop(e) {
        e.preventDefault();
        this._dragOver = false;
        this.requestUpdate();

        try {
            const attachments = await AttachmentService.fromDrop(e);
            if (attachments.length > 0) {
                Actions.addAttachments(attachments);
            }
        } catch (err) {
            console.error('Failed to process dropped files:', err);
        }
    }

    /**
     * Render attachment item
     * @private
     */
    _renderAttachmentItem(attachment) {
        return html`
            <div class="attachment-item">
                <div class="attachment-thumbnail">
                    ${attachment.thumbnail || attachment.dataUrl
                        ? html`<img src="${attachment.thumbnail || attachment.dataUrl}" alt="${attachment.name}" />`
                        : html`<dash-icon class="placeholder" name="image" size="20"></dash-icon>`
                    }
                </div>
                <div class="attachment-info">
                    <span class="attachment-name" title="${attachment.name}">${attachment.name}</span>
                    <span class="attachment-meta">
                        <span>${this._getTypeLabel(attachment.type)}</span>
                        <span>•</span>
                        <span>${this._formatSize(attachment.size)}</span>
                    </span>
                </div>
                <div class="attachment-actions">
                    <button
                        class="remove-btn"
                        @click=${() => this._handleRemove(attachment.id)}
                        title="Remove attachment"
                        aria-label="Remove ${attachment.name}"
                    >
                        <dash-icon name="x" size="14"></dash-icon>
                    </button>
                </div>
            </div>
        `;
    }

    render() {
        const attachments = this._attachments;

        if (attachments.length === 0) {
            return html`
                <div
                    class="drop-zone ${this._dragOver ? 'drag-over' : ''}"
                    @dragover=${this._handleDragOver}
                    @dragleave=${this._handleDragLeave}
                    @drop=${this._handleDrop}
                >
                    <dash-icon name="upload" size="24"></dash-icon>
                    <p>Drop images here or paste from clipboard</p>
                </div>
                <div class="empty-state">
                    <dash-icon name="paperclip" size="32"></dash-icon>
                    <p>No attachments yet.<br>Paste or drop images to attach them to your message.</p>
                </div>
            `;
        }

        const totalSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0);

        return html`
            <div class="panel-header">
                <span class="header-info">
                    <span>${attachments.length} file${attachments.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>${this._formatSize(totalSize)}</span>
                </span>
                <button
                    class="clear-btn"
                    @click=${this._handleClearAll}
                    title="Clear all attachments"
                >
                    <dash-icon name="trash-2" size="12"></dash-icon>
                    <span>Clear all</span>
                </button>
            </div>
            <div class="attachment-list">
                ${attachments.map(att => this._renderAttachmentItem(att))}
            </div>
        `;
    }
}

customElements.define('attachment-panel', AttachmentPanel);
export { AttachmentPanel };

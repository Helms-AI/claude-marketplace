/**
 * Artifact Icon Atom - File type icon based on extension/MIME type
 * @module components/atoms/artifact-icon
 *
 * Maps file extensions and MIME types to appropriate Lucide icons.
 * Falls back to a generic file icon for unknown types.
 *
 * @example
 * ```html
 * <artifact-icon extension=".md"></artifact-icon>
 * <artifact-icon extension=".json" size="20"></artifact-icon>
 * <artifact-icon mime-type="image/png"></artifact-icon>
 * ```
 */
import { LitElement, html, css } from 'lit';
import './icon.js';

// Extension to icon mapping
const EXTENSION_ICONS = {
    // Documents
    '.md': 'file-text',
    '.markdown': 'file-text',
    '.txt': 'file-text',
    '.pdf': 'file-text',
    '.doc': 'file-text',
    '.docx': 'file-text',

    // Code
    '.js': 'file-code',
    '.ts': 'file-code',
    '.jsx': 'file-code',
    '.tsx': 'file-code',
    '.py': 'file-code',
    '.rb': 'file-code',
    '.go': 'file-code',
    '.rs': 'file-code',
    '.java': 'file-code',
    '.c': 'file-code',
    '.cpp': 'file-code',
    '.h': 'file-code',
    '.cs': 'file-code',
    '.php': 'file-code',
    '.swift': 'file-code',
    '.kt': 'file-code',
    '.scala': 'file-code',
    '.sh': 'terminal',
    '.bash': 'terminal',
    '.zsh': 'terminal',

    // Data
    '.json': 'braces',
    '.yaml': 'file-json',
    '.yml': 'file-json',
    '.xml': 'file-code',
    '.csv': 'table',
    '.sql': 'database',

    // Web
    '.html': 'globe',
    '.htm': 'globe',
    '.css': 'palette',
    '.scss': 'palette',
    '.sass': 'palette',
    '.less': 'palette',

    // Images
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.gif': 'image',
    '.svg': 'image',
    '.webp': 'image',
    '.ico': 'image',
    '.bmp': 'image',

    // Config
    '.env': 'settings',
    '.config': 'settings',
    '.toml': 'settings',
    '.ini': 'settings',
    '.gitignore': 'git-branch',
    '.dockerignore': 'box',
    '.dockerfile': 'box',

    // Archives
    '.zip': 'archive',
    '.tar': 'archive',
    '.gz': 'archive',
    '.rar': 'archive',
    '.7z': 'archive',

    // Audio/Video
    '.mp3': 'music',
    '.wav': 'music',
    '.ogg': 'music',
    '.mp4': 'video',
    '.webm': 'video',
    '.mov': 'video',

    // Binary
    '.exe': 'binary',
    '.dll': 'binary',
    '.so': 'binary',
    '.wasm': 'binary'
};

// MIME type to icon mapping (fallback when extension not available)
const MIME_ICONS = {
    'text/plain': 'file-text',
    'text/markdown': 'file-text',
    'text/html': 'globe',
    'text/css': 'palette',
    'text/javascript': 'file-code',
    'application/json': 'braces',
    'application/xml': 'file-code',
    'application/pdf': 'file-text',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/gif': 'image',
    'image/svg+xml': 'image',
    'audio/mpeg': 'music',
    'video/mp4': 'video',
    'application/zip': 'archive',
    'application/octet-stream': 'binary'
};

class ArtifactIcon extends LitElement {
    static properties = {
        extension: { type: String },
        mimeType: { type: String, attribute: 'mime-type' },
        size: { type: Number },
        color: { type: String }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        dash-icon {
            color: inherit;
        }

        /* File type color coding */
        :host([data-type="code"]) {
            color: var(--domain-frontend, #22d3ee);
        }

        :host([data-type="data"]) {
            color: var(--domain-data, #fbbf24);
        }

        :host([data-type="document"]) {
            color: var(--domain-documentation, #94a3b8);
        }

        :host([data-type="image"]) {
            color: var(--domain-user-experience, #f472b6);
        }

        :host([data-type="config"]) {
            color: var(--domain-devops, #a78bfa);
        }

        :host([data-type="binary"]) {
            color: var(--text-muted, #6e7681);
        }
    `;

    constructor() {
        super();
        this.extension = '';
        this.mimeType = '';
        this.size = 16;
        this.color = '';
    }

    /**
     * Get the appropriate icon name based on extension or MIME type
     */
    _getIconName() {
        // Try extension first (normalized to lowercase with dot)
        if (this.extension) {
            const ext = this.extension.startsWith('.')
                ? this.extension.toLowerCase()
                : `.${this.extension.toLowerCase()}`;
            if (EXTENSION_ICONS[ext]) {
                return EXTENSION_ICONS[ext];
            }
        }

        // Try MIME type
        if (this.mimeType && MIME_ICONS[this.mimeType]) {
            return MIME_ICONS[this.mimeType];
        }

        // Default fallback
        return 'file';
    }

    /**
     * Get the file type category for color coding
     */
    _getFileType() {
        const iconName = this._getIconName();

        if (iconName === 'file-code' || iconName === 'terminal') return 'code';
        if (iconName === 'braces' || iconName === 'file-json' || iconName === 'table' || iconName === 'database') return 'data';
        if (iconName === 'file-text' || iconName === 'globe') return 'document';
        if (iconName === 'image') return 'image';
        if (iconName === 'settings' || iconName === 'git-branch' || iconName === 'box') return 'config';
        if (iconName === 'binary' || iconName === 'archive') return 'binary';

        return 'document';
    }

    updated(changedProperties) {
        if (changedProperties.has('extension') || changedProperties.has('mimeType')) {
            this.setAttribute('data-type', this._getFileType());
        }
    }

    render() {
        const iconName = this._getIconName();
        const style = this.color ? `color: ${this.color}` : '';

        return html`
            <dash-icon
                name="${iconName}"
                size="${this.size}"
                style="${style}"
            ></dash-icon>
        `;
    }
}

customElements.define('artifact-icon', ArtifactIcon);
export { ArtifactIcon, EXTENSION_ICONS, MIME_ICONS };

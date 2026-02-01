/**
 * Icon Atom - SVG icon wrapper component powered by Lucide
 * @module components/atoms/icon
 *
 * Uses Lucide icon library exclusively for all icons.
 * @see https://lucide.dev/icons/ for available icons
 *
 * @example
 * ```html
 * <dash-icon name="terminal"></dash-icon>
 * <dash-icon name="brain" size="24"></dash-icon>
 * <dash-icon name="sparkles" stroke-width="1.5"></dash-icon>
 * ```
 *
 * Common icon names:
 * - Navigation: chevron-right, chevron-down, chevron-left, chevron-up, menu, x, plus, minus
 * - Actions: search, refresh-cw, settings, copy, trash, edit, check
 * - Status: alert-circle, info, alert-triangle, check-circle, x-circle
 * - UI: folder, file, terminal, code, message-square, user, users
 * - Graph: activity, bar-chart, pie-chart
 * - Git: git-branch, git-commit, git-merge
 * - Media: play, pause, square (stop)
 * - Misc: sun, moon, clock, link, external-link, zap
 * - Arrows: arrow-up, arrow-down, arrow-left, arrow-right, send
 * - Toolbar: paperclip, sliders, settings
 */
import { LitElement, css, svg } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { icons as lucideIcons } from 'lucide';

class DashIcon extends LitElement {
    static properties = {
        name: { type: String },
        size: { type: Number },
        color: { type: String },
        strokeWidth: { type: Number, attribute: 'stroke-width' }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
            line-height: 0;
        }

        svg {
            display: block;
            fill: none;
            stroke: currentColor;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        :host([hidden]) {
            display: none;
        }
    `;

    constructor() {
        super();
        this.name = '';
        this.size = 16;
        this.color = 'currentColor';
        this.strokeWidth = 2;
    }

    /**
     * Convert kebab-case to PascalCase for Lucide icon lookup
     * e.g., "arrow-up" -> "ArrowUp", "sliders-horizontal" -> "SlidersHorizontal"
     * @param {string} name - kebab-case icon name
     * @returns {string} PascalCase icon name
     */
    _toPascalCase(name) {
        return name
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
    }

    /**
     * Convert Lucide icon data to SVG elements string
     * Lucide icon data is an array of [tag, attributes] pairs
     * e.g., [["path", { d: "M12 2L2 7..." }], ["circle", { cx: 12, cy: 12, r: 3 }]]
     * @param {Array} iconData - Lucide icon data array
     * @returns {string} SVG inner content
     */
    _renderLucideContent(iconData) {
        if (!Array.isArray(iconData)) {
            console.warn(`[dash-icon] Icon data is not an array:`, iconData);
            return '';
        }
        return iconData.map(([tag, attrs]) => {
            if (!tag || !attrs) return '';
            const attrStr = Object.entries(attrs)
                .map(([key, value]) => `${key}="${value}"`)
                .join(' ');
            return `<${tag} ${attrStr}></${tag}>`;
        }).join('');
    }

    render() {
        // Try kebab-case first, then convert to PascalCase for Lucide lookup
        let lucideIcon = lucideIcons[this.name];
        if (!lucideIcon) {
            const pascalName = this._toPascalCase(this.name);
            lucideIcon = lucideIcons[pascalName];
        }

        if (!lucideIcon) {
            console.warn(`[dash-icon] Unknown icon: "${this.name}" (tried PascalCase: "${this._toPascalCase(this.name)}"). See https://lucide.dev/icons/ for available icons.`);
            return svg``;
        }

        // Lucide ESM format: ["svg", defaultAttrs, [["path", {...}], ...]]
        // The actual paths/shapes are at index 2
        const iconElements = Array.isArray(lucideIcon) && lucideIcon.length >= 3
            ? lucideIcon[2]
            : lucideIcon;

        const svgContent = this._renderLucideContent(iconElements);

        return svg`
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="${this.size}"
                height="${this.size}"
                viewBox="0 0 24 24"
                fill="none"
                stroke="${this.color}"
                stroke-width="${this.strokeWidth}"
                stroke-linecap="round"
                stroke-linejoin="round"
            >${unsafeSVG(svgContent)}</svg>
        `;
    }
}

/**
 * Get all available Lucide icon names
 * @returns {string[]} Array of all icon names
 */
export function getAllIconNames() {
    return Object.keys(lucideIcons).sort();
}

/**
 * Check if an icon name exists in Lucide
 * @param {string} name - Icon name to check
 * @returns {boolean}
 */
export function isValidIconName(name) {
    return name in lucideIcons;
}

customElements.define('dash-icon', DashIcon);
export { DashIcon, lucideIcons };

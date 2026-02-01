/**
 * TabPanel Atom - Content panel for a tab
 * @module components/atoms/tab-panel
 *
 * Usage:
 * <dash-tab-panel name="work" active>
 *   Content for the work tab
 * </dash-tab-panel>
 */
import { LitElement, html, css } from 'lit';

class DashTabPanel extends LitElement {
    static properties = {
        /** Unique panel name (must match corresponding tab name) */
        name: { type: String, reflect: true },
        /** Whether this panel is visible */
        active: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: none;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        :host([active]) {
            display: flex;
        }

        .panel-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        /* Default: slotted content fills available space */
        ::slotted(*) {
            flex: 1;
            min-height: 0;
        }

        /* Filter bars should not grow */
        ::slotted(.filter-bar) {
            flex: 0 0 auto;
        }
    `;

    constructor() {
        super();
        this.name = '';
        this.active = false;
    }

    render() {
        return html`
            <div class="panel-content" role="tabpanel" aria-hidden="${!this.active}">
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('dash-tab-panel', DashTabPanel);
export { DashTabPanel };

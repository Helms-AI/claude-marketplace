/**
 * SearchInput Molecule - Input + icon + clear button
 * @module components/molecules/search-input
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import '../atoms/input.js';

class DashSearchInput extends LitElement {
    static properties = {
        value: { type: String },
        placeholder: { type: String },
        size: { type: String },
        disabled: { type: Boolean },
        autofocus: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
        }

        .search-wrapper {
            position: relative;
        }

        dash-input {
            width: 100%;
        }

        dash-input::part(input) {
            padding-left: 32px;
        }
    `;

    constructor() {
        super();
        this.value = '';
        this.placeholder = 'Search...';
        this.size = 'md';
        this.disabled = false;
        this.autofocus = false;
    }

    render() {
        return html`
            <div class="search-wrapper">
                <dash-input
                    type="search"
                    .value="${this.value}"
                    placeholder="${this.placeholder}"
                    size="${this.size}"
                    icon="search"
                    ?clearable="${!!this.value}"
                    ?disabled="${this.disabled}"
                    ?autofocus="${this.autofocus}"
                    @dash-input="${this._handleInput}"
                    @dash-clear="${this._handleClear}"
                    @dash-submit="${this._handleSubmit}"
                    @dash-escape="${this._handleEscape}"
                ></dash-input>
            </div>
        `;
    }

    _handleInput(e) {
        this.value = e.detail.value;
        this.dispatchEvent(new CustomEvent('dash-search', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    _handleClear() {
        this.value = '';
        this.dispatchEvent(new CustomEvent('dash-search', {
            detail: { value: '' },
            bubbles: true,
            composed: true
        }));
        this.dispatchEvent(new CustomEvent('dash-clear', {
            bubbles: true,
            composed: true
        }));
    }

    _handleSubmit(e) {
        this.dispatchEvent(new CustomEvent('dash-submit', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    _handleEscape() {
        this.dispatchEvent(new CustomEvent('dash-escape', {
            bubbles: true,
            composed: true
        }));
    }

    focus() {
        this.shadowRoot.querySelector('dash-input')?.focus();
    }
}

customElements.define('dash-search-input', DashSearchInput);
export { DashSearchInput };

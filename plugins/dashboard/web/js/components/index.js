/**
 * Components Index - Central export point for all Lit Web Components
 * @module components
 *
 * Component hierarchy (Atomic Design):
 * - Atoms: Basic building blocks (icon, button, input, etc.)
 * - Molecules: Combinations of atoms (search-input, tab-button, etc.)
 * - Organisms: Complex UI sections (command-palette, welcome-panel, etc.)
 * - Templates/Pages: Full page layouts (dashboard-shell, etc.)
 */

// Atomic Design layers
export * from './atoms/index.js';
export * from './molecules/index.js';
export * from './organisms/index.js';

// Domain-specific components
export * from './core/index.js';
export * from './conversation/index.js';
export * from './indicators/index.js';
export * from './tool-cards/index.js';
export * from './terminal/index.js';
export * from './explorer/index.js';
export * from './layout/index.js';

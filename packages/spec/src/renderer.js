"use strict";
/**
 * @fbp/spec - Renderer Types
 *
 * These types extend the storage types with DERIVED data and RUNTIME state.
 * Used by the graph editor UI for rendering and interaction.
 *
 * Key principle: Everything here is either:
 * 1. Derived from storage data (e.g., ports from boundary nodes)
 * 2. Ephemeral runtime state (e.g., selection, view position)
 */
Object.defineProperty(exports, "__esModule", { value: true });

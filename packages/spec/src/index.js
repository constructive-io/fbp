"use strict";
/**
 * @fbp/spec
 *
 * Two-layer type system for flow-based programming graphs:
 *
 * 1. STORAGE TYPES (./types.ts)
 *    - Minimal, canonical data for persistence
 *    - No derived data, no runtime state
 *    - Boundary nodes ARE the interface definition
 *
 * 2. RENDERER TYPES (./renderer.ts)
 *    - Extended types with derived port data
 *    - Runtime state (selection, view, etc.)
 *    - Used by the graph editor UI
 *
 * 3. SPEC API (./api.ts)
 *    - Pure functions for path-based graph manipulation
 *    - insertNode, removeNode, setProps, addEdge, etc.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Storage types (for persistence)
__exportStar(require("./types"), exports);
// Renderer types (for UI)
__exportStar(require("./renderer"), exports);
// Spec API (for manipulation)
__exportStar(require("./api"), exports);

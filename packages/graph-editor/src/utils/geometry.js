"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenToCanvas = screenToCanvas;
exports.canvasToScreen = canvasToScreen;
exports.getBezierPath = getBezierPath;
exports.pointInRect = pointInRect;
exports.rectsOverlap = rectsOverlap;
exports.clamp = clamp;
exports.distance = distance;
function screenToCanvas(screenPoint, pan, zoom) {
    return {
        x: (screenPoint.x - pan.x) / zoom,
        y: (screenPoint.y - pan.y) / zoom
    };
}
function canvasToScreen(canvasPoint, pan, zoom) {
    return {
        x: canvasPoint.x * zoom + pan.x,
        y: canvasPoint.y * zoom + pan.y
    };
}
function getBezierPath(start, end, curvature = 0.5) {
    const dx = end.x - start.x;
    const controlOffset = Math.abs(dx) * curvature;
    const cp1 = { x: start.x + controlOffset, y: start.y };
    const cp2 = { x: end.x - controlOffset, y: end.y };
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}
function pointInRect(point, rect) {
    return (point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height);
}
function rectsOverlap(a, b) {
    return !(a.x + a.width < b.x ||
        b.x + b.width < a.x ||
        a.y + a.height < b.y ||
        b.y + b.height < a.y);
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function distance(a, b) {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

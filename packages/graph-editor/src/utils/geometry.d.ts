import type { Point } from '../context/GraphContext';
export declare function screenToCanvas(screenPoint: Point, pan: Point, zoom: number): Point;
export declare function canvasToScreen(canvasPoint: Point, pan: Point, zoom: number): Point;
export declare function getBezierPath(start: Point, end: Point, curvature?: number): string;
export declare function pointInRect(point: Point, rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}): boolean;
export declare function rectsOverlap(a: {
    x: number;
    y: number;
    width: number;
    height: number;
}, b: {
    x: number;
    y: number;
    width: number;
    height: number;
}): boolean;
export declare function clamp(value: number, min: number, max: number): number;
export declare function distance(a: Point, b: Point): number;

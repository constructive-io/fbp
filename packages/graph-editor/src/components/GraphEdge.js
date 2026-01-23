"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphEdge = GraphEdge;
exports.TempEdge = TempEdge;
const react_1 = __importDefault(require("react"));
const GraphContext_1 = require("../context/GraphContext");
const GraphNode_1 = require("./GraphNode");
const geometry_1 = require("../utils/geometry");
function GraphEdge({ edge }) {
    const { getDefinition } = (0, GraphContext_1.useGraph)();
    const { selection, selectEdges } = (0, GraphContext_1.useSelection)();
    const { nodes } = (0, GraphContext_1.useScopedGraph)();
    const edgeId = `${edge.src.node}:${edge.src.port}->${edge.dst.node}:${edge.dst.port}`;
    const isSelected = selection.edgeIds.has(edgeId);
    const srcNode = nodes.find(n => n.name === edge.src.node);
    const dstNode = nodes.find(n => n.name === edge.dst.node);
    if (!srcNode || !dstNode)
        return null;
    const srcDef = getDefinition(srcNode.type);
    const dstDef = getDefinition(dstNode.type);
    const srcPos = (0, GraphNode_1.getNodePortPosition)(srcNode, edge.src.port, true, srcDef);
    const dstPos = (0, GraphNode_1.getNodePortPosition)(dstNode, edge.dst.port, false, dstDef);
    if (!srcPos || !dstPos)
        return null;
    const path = (0, geometry_1.getBezierPath)(srcPos, dstPos);
    const handleClick = (e) => {
        e.stopPropagation();
        selectEdges([edgeId], e.shiftKey);
    };
    return (<g onClick={handleClick} style={{ cursor: 'pointer' }}>
      <path d={path} fill="none" stroke="transparent" strokeWidth={12}/>
      <path d={path} fill="none" stroke={isSelected ? '#3b82f6' : '#64748b'} strokeWidth={isSelected ? 3 : 2} strokeLinecap="round"/>
    </g>);
}
function TempEdge({ start, end }) {
    const path = (0, geometry_1.getBezierPath)(start, end);
    return (<path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="8 4" strokeLinecap="round" pointerEvents="none"/>);
}

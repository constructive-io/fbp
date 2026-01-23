"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodePalette = NodePalette;
const react_1 = __importStar(require("react"));
const GraphContext_1 = require("../context/GraphContext");
const NodeIcon_1 = require("./NodeIcon");
const BOUNDARY_NODE_TYPES = ['core/graph/input', 'core/graph/output', 'core/graph/prop'];
function NodePalette() {
    const { state, dispatch } = (0, GraphContext_1.useGraph)();
    const definitions = Array.from(state.definitions.values());
    const groupedDefinitions = definitions.reduce((acc, def) => {
        const category = def.category || 'other';
        if (!acc[category])
            acc[category] = [];
        acc[category].push(def);
        return acc;
    }, {});
    const handleAddNode = (definition) => {
        const position = { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 };
        // Handle boundary nodes specially
        if (BOUNDARY_NODE_TYPES.includes(definition.type)) {
            const boundaryType = definition.type === 'core/graph/input' ? 'input'
                : definition.type === 'core/graph/output' ? 'output'
                    : 'prop';
            dispatch({ type: 'ADD_BOUNDARY_NODE', boundaryType, position });
            return;
        }
        const newNode = {
            name: `${definition.type.split('/').pop()}_${Date.now().toString(36)}`,
            type: definition.type,
            meta: position
        };
        dispatch({ type: 'ADD_NODE', node: newNode });
    };
    const handleDragStart = (0, react_1.useCallback)((e, definition) => {
        e.dataTransfer.setData('application/fbp-node', JSON.stringify({
            type: definition.type,
            isBoundary: BOUNDARY_NODE_TYPES.includes(definition.type)
        }));
        e.dataTransfer.effectAllowed = 'copy';
    }, []);
    return (<div className="h-full flex flex-col bg-slate-800">
      <div className="px-3 py-2 border-b border-slate-700">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nodes</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groupedDefinitions).map(([category, defs]) => (<div key={category} className="mb-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 px-1">
              {category}
            </div>
            <div className="flex flex-col gap-1">
              {defs.map(def => (<button key={def.type} onClick={() => handleAddNode(def)} draggable onDragStart={(e) => handleDragStart(e, def)} className="w-full px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-left text-xs text-slate-300 transition-colors flex items-center gap-2 cursor-grab active:cursor-grabbing" title={`Drag to add ${def.type}`}>
                  {def.icon && <NodeIcon_1.NodeIcon icon={def.icon} size={14} className="opacity-70"/>}
                  <span>{def.type.split('/').pop()}</span>
                </button>))}
            </div>
          </div>))}
        {definitions.length === 0 && (<div className="text-xs text-slate-500 px-1 py-2">No node definitions available</div>)}
      </div>
    </div>);
}

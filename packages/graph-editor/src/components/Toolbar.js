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
exports.Toolbar = Toolbar;
const react_1 = __importStar(require("react"));
const GraphContext_1 = require("../context/GraphContext");
function HotkeyItem({ keys, description }) {
    return (<div className="flex items-center gap-2 text-xs">
      <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono text-[10px]">
        {keys}
      </kbd>
      <span className="text-slate-400">{description}</span>
    </div>);
}
function NodePaletteItem({ definition, onDragStart }) {
    const shortName = definition.type.split('/').pop() || definition.type;
    return (<div draggable onDragStart={() => onDragStart(definition)} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded cursor-grab text-xs text-slate-300 transition-colors" title={definition.type}>
      {shortName}
    </div>);
}
function Toolbar() {
    const { state, dispatch } = (0, GraphContext_1.useGraph)();
    const [showHotkeys, setShowHotkeys] = (0, react_1.useState)(true);
    const [showPalette, setShowPalette] = (0, react_1.useState)(true);
    const definitions = Array.from(state.definitions.values());
    const groupedDefinitions = definitions.reduce((acc, def) => {
        const category = def.category || 'other';
        if (!acc[category])
            acc[category] = [];
        acc[category].push(def);
        return acc;
    }, {});
    const handleDragStart = (definition) => {
        const event = new CustomEvent('node-drag-start', { detail: definition });
        window.dispatchEvent(event);
    };
    const handleAddNode = (definition) => {
        const newNode = {
            name: `${definition.type.split('/').pop()}_${Date.now().toString(36)}`,
            type: definition.type,
            meta: { x: 200, y: 200 }
        };
        dispatch({ type: 'ADD_NODE', node: newNode });
    };
    return (<div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex justify-between p-3 gap-3">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur rounded-lg border border-slate-700 shadow-xl">
          <button onClick={() => setShowPalette(!showPalette)} className="w-full px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-t-lg flex items-center justify-between">
            <span>Node Palette</span>
            <span className="text-slate-500">{showPalette ? '−' : '+'}</span>
          </button>
          
          {showPalette && (<div className="p-2 border-t border-slate-700 max-h-80 overflow-y-auto">
              {Object.entries(groupedDefinitions).map(([category, defs]) => (<div key={category} className="mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 px-1">
                    {category}
                  </div>
                  <div className="flex flex-col gap-1">
                    {defs.map(def => (<div key={def.type} onClick={() => handleAddNode(def)} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer text-xs text-slate-300 transition-colors" title={`Click to add ${def.type}`}>
                        {def.type.split('/').pop()}
                      </div>))}
                  </div>
                </div>))}
              {definitions.length === 0 && (<div className="text-xs text-slate-500 px-1">No node definitions</div>)}
            </div>)}
        </div>

        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur rounded-lg border border-slate-700 shadow-xl">
          <button onClick={() => setShowHotkeys(!showHotkeys)} className="w-full px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-t-lg flex items-center justify-between">
            <span>Keyboard Shortcuts</span>
            <span className="text-slate-500">{showHotkeys ? '−' : '+'}</span>
          </button>
          
          {showHotkeys && (<div className="p-3 border-t border-slate-700 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Selection</div>
              <HotkeyItem keys="Click" description="Select node"/>
              <HotkeyItem keys="Shift+Click" description="Add to selection"/>
              <HotkeyItem keys="Shift+Drag" description="Box select"/>
              <HotkeyItem keys="⌘/Ctrl+A" description="Select all"/>
              <HotkeyItem keys="Escape" description="Clear selection"/>
              
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3 mb-2">Editing</div>
              <HotkeyItem keys="Delete" description="Delete selected"/>
              <HotkeyItem keys="⌘/Ctrl+D" description="Duplicate"/>
              
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3 mb-2">Navigation</div>
              <HotkeyItem keys="Alt+Drag" description="Pan canvas"/>
              <HotkeyItem keys="⌘/Ctrl+Scroll" description="Zoom"/>
              <HotkeyItem keys="Enter" description="Dive into subnet"/>
              <HotkeyItem keys="U" description="Go up from subnet"/>
              
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3 mb-2">Connections</div>
              <HotkeyItem keys="Drag port" description="Create edge"/>
              <HotkeyItem keys="Click edge" description="Select edge"/>
            </div>)}
        </div>
      </div>
    </div>);
}

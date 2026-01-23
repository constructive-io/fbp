"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphEditor = GraphEditor;
const react_1 = __importDefault(require("react"));
const GraphContext_1 = require("../context/GraphContext");
const GraphCanvas_1 = require("./GraphCanvas");
const PropertiesPanel_1 = require("./PropertiesPanel");
const NodePalette_1 = require("./NodePalette");
const StatusBar_1 = require("./StatusBar");
function GraphEditor({ graph, definitions, showPropertiesPanel = true, showNodePalette = true, showStatusBar = true, className = '', onSelectionChange, evaluationResult, onRefreshEvaluation, evaluateFn }) {
    return (<GraphContext_1.GraphProvider initialGraph={graph} externalDefinitions={definitions} onSelectionChange={onSelectionChange}>
      <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
        <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 flex-shrink-0">
          <span className="text-sm font-medium text-slate-300">FBP Graph Editor</span>
          <span className="ml-3 text-xs text-slate-500">Flow-Based Programming</span>
        </div>
        
        <div className="flex flex-1 min-h-0">
          {showNodePalette && (<div className="w-48 flex-shrink-0 border-r border-slate-700 bg-slate-850">
              <NodePalette_1.NodePalette />
            </div>)}
          
          <div className="flex-1 min-w-0">
            <GraphCanvas_1.GraphCanvas />
          </div>
          
          {showPropertiesPanel && (<div className="w-72 flex-shrink-0 border-l border-slate-700">
              <PropertiesPanel_1.PropertiesPanel evaluationResult={evaluationResult} onRefreshEvaluation={onRefreshEvaluation} evaluateFn={evaluateFn} definitions={definitions}/>
            </div>)}
        </div>
        
        {showStatusBar && <StatusBar_1.StatusBar />}
      </div>
    </GraphContext_1.GraphProvider>);
}

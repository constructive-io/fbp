import type { NodeDefinition } from '@fbp/types';
import React, { useCallback } from 'react';

import { defKey, nextNodeName,useGraph } from '../context/GraphContext';
import { BOUNDARY_NODE_KINDS, isBoundaryNodeKind } from '../types';
import { NodeIcon } from './NodeIcon';

export function NodePalette() {
  const { state, dispatch } = useGraph();
  
  const definitions = Array.from(state.definitions.values());
  
  const groupedDefinitions = definitions.reduce((acc, def) => {
    const category = def.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(def);
    return acc;
  }, {} as Record<string, NodeDefinition[]>);

  const handleAddNode = (definition: NodeDefinition) => {
    const position = { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 };
    
    if (isBoundaryNodeKind(definition.name)) {
      const boundaryType = definition.name === BOUNDARY_NODE_KINDS.input ? 'input' 
        : definition.name === BOUNDARY_NODE_KINDS.output ? 'output' 
          : 'prop';
      dispatch({ type: 'ADD_BOUNDARY_NODE', boundaryType, position });
      return;
    }
    
    const nodeType = defKey(definition);
    const existingNames = state.graph.nodes.map(n => n.name);
    const newNode = {
      name: nextNodeName(nodeType, existingNames),
      type: nodeType,
      meta: position
    };
    dispatch({ type: 'ADD_NODE', node: newNode });
  };

  const handleDragStart = useCallback((e: React.DragEvent, definition: NodeDefinition) => {
    const fullType = defKey(definition);
    e.dataTransfer.setData('application/fbp-node', JSON.stringify({
      definitionName: fullType,
      isBoundary: isBoundaryNodeKind(definition.name)
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="px-3 py-2 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nodes</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groupedDefinitions).map(([category, defs]) => (
          <div key={category} className="mb-3">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 px-1">
              {category}
            </div>
            <div className="flex flex-col gap-1">
              {defs.map(def => (
                <button
                  key={defKey(def)}
                  onClick={() => handleAddNode(def)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, def)}
                  className="w-full px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-left text-xs text-zinc-300 transition-colors flex items-center gap-2 cursor-grab active:cursor-grabbing"
                  title={`Drag to add ${def.name}`}
                >
                  {def.icon && <NodeIcon icon={def.icon} size={14} className="opacity-70" />}
                  <span>{def.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {definitions.length === 0 && (
          <div className="text-xs text-zinc-500 px-1 py-2">No node definitions available</div>
        )}
      </div>
    </div>
  );
}

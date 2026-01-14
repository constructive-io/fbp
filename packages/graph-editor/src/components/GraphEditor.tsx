import React from 'react';
import { GraphProvider } from '../context/GraphContext';
import { GraphCanvas } from './GraphCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import type { Graph, NodeDefinition } from '@fbp/types';

interface GraphEditorProps {
  graph?: Graph;
  definitions?: NodeDefinition[];
  showPropertiesPanel?: boolean;
  showToolbar?: boolean;
  className?: string;
  onGraphChange?: (graph: Graph) => void;
}

export function GraphEditor({
  graph,
  definitions,
  showPropertiesPanel = true,
  showToolbar = true,
  className = ''
}: GraphEditorProps) {
  return (
    <GraphProvider initialGraph={graph} externalDefinitions={definitions}>
      <div className={`flex h-full ${className}`}>
        <div className="flex-1 relative">
          {showToolbar && <Toolbar />}
          <GraphCanvas />
        </div>
        {showPropertiesPanel && (
          <div className="w-72 flex-shrink-0">
            <PropertiesPanel />
          </div>
        )}
      </div>
    </GraphProvider>
  );
}

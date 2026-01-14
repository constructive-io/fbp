import React, { useCallback } from 'react';
import { useGraph, useSelection } from '../context/GraphContext';
import type { PropDefinition, Prop } from '@fbp/types';
import { clsx } from 'clsx';

export function PropertiesPanel() {
  const { state, dispatch, getDefinition, getShortName, isChannelReference } = useGraph();
  const { selection } = useSelection();

  const selectedNodeIds = Array.from(selection.nodeIds);
  
  if (selectedNodeIds.length === 0) {
    return (
      <div className="p-4 text-slate-400 text-sm">
        Select a node to view its properties
      </div>
    );
  }

  if (selectedNodeIds.length > 1) {
    return (
      <div className="p-4 text-slate-400 text-sm">
        {selectedNodeIds.length} nodes selected
      </div>
    );
  }

  const nodeId = selectedNodeIds[0];
  const node = state.graph.nodes.find(n => n.name === nodeId);
  
  if (!node) return null;

  const definition = getDefinition(node.type);
  const propDefs = definition?.props || [];

  const getPropValue = (propName: string): unknown => {
    const prop = node.props?.find(p => p.name === propName);
    return prop?.value;
  };

  const handlePropChange = (propName: string, value: unknown) => {
    dispatch({ type: 'SET_NODE_PROP', nodeId, propName, value });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      <div className="p-3 border-b border-slate-700">
        <div className="text-xs text-slate-500 mb-1">Node</div>
        <div className="font-semibold text-white">{node.name}</div>
        <div className="text-xs text-slate-400 mt-1 font-mono">{node.type}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Properties</div>
        
        {propDefs.length === 0 ? (
          <div className="text-slate-500 text-sm">No properties defined</div>
        ) : (
          <div className="space-y-4">
            {propDefs.map(propDef => (
              <PropertyField
                key={propDef.name}
                definition={propDef}
                value={getPropValue(propDef.name)}
                onChange={(value) => handlePropChange(propDef.name, value)}
                isChannelRef={isChannelReference(getPropValue(propDef.name))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PropertyFieldProps {
  definition: PropDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  isChannelRef: boolean;
}

function PropertyField({ definition, value, onChange, isChannelRef }: PropertyFieldProps) {
  const displayValue = value ?? definition.default ?? '';

  const renderInput = () => {
    switch (definition.type.toLowerCase()) {
      case 'boolean':
        return (
          <button
            onClick={() => onChange(!displayValue)}
            className={clsx(
              'w-10 h-5 rounded-full transition-colors relative',
              displayValue ? 'bg-blue-500' : 'bg-slate-600'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                displayValue ? 'left-5' : 'left-0.5'
              )}
            />
          </button>
        );

      case 'number':
        return (
          <input
            type="number"
            value={displayValue as number}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={clsx(
              'w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-600',
              'text-white text-sm focus:outline-none focus:border-blue-500',
              isChannelRef && 'font-mono text-purple-400'
            )}
          />
        );

      case 'enum':
      case 'select':
        const options = (definition as any).options || [];
        return (
          <select
            value={displayValue as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={displayValue as string}
            onChange={(e) => onChange(e.target.value)}
            className={clsx(
              'w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-600',
              'text-white text-sm focus:outline-none focus:border-blue-500',
              isChannelRef && 'font-mono text-purple-400'
            )}
          />
        );
    }
  };

  return (
    <div>
      <label className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-300">{definition.name}</span>
        {isChannelRef && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900 text-purple-300">
            ref
          </span>
        )}
      </label>
      {renderInput()}
      {definition.description && (
        <p className="text-xs text-slate-500 mt-1">{definition.description}</p>
      )}
    </div>
  );
}

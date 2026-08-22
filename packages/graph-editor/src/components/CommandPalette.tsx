import type { NodeDefinition } from '@fbp/types';
import React, { useCallback,useEffect, useRef, useState } from 'react';

import { defKey, nextNodeName,useGraph } from '../context/GraphContext';
import { useScopedGraph } from '../context/GraphContext';
import { BOUNDARY_NODE_KINDS, isBoundaryNodeKind } from '../types';
import { NodeIcon } from './NodeIcon';

interface CommandPaletteProps {
  position: { x: number; y: number };
  canvasPosition: { x: number; y: number };
  onClose: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function scoreMatch(query: string, text: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return 100;
  if (lower.startsWith(q)) return 90;
  if (lower.includes(q)) return 80;
  // Fuzzy score: consecutive matches score higher
  let score = 0;
  let qi = 0;
  let consecutive = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) {
      qi++;
      consecutive++;
      score += consecutive * 2;
    } else {
      consecutive = 0;
    }
  }
  return qi === q.length ? score : 0;
}

export function CommandPalette({ position, canvasPosition, onClose }: CommandPaletteProps) {
  const { state, dispatch } = useGraph();
  const { nodes: scopedNodes } = useScopedGraph();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const definitions = Array.from(state.definitions.values());

  const filteredResults = query.trim() === ''
    ? definitions
    : definitions
      .map(def => {
        const key = defKey(def);
        const nameScore = scoreMatch(query, def.name);
        const categoryScore = def.category ? scoreMatch(query, def.category) * 0.8 : 0;
        const keyScore = scoreMatch(query, key) * 0.9;
        const descScore = def.description ? scoreMatch(query, def.description) * 0.5 : 0;
        const score = Math.max(nameScore, categoryScore, keyScore, descScore);
        return { def, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ def }) => def);

  // Group results by category for display
  const groupedResults = filteredResults.reduce((acc, def) => {
    const category = def.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(def);
    return acc;
  }, {} as Record<string, NodeDefinition[]>);

  // Flat list for keyboard navigation
  const flatResults = Object.values(groupedResults).flat();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const addNode = useCallback((def: NodeDefinition) => {
    if (isBoundaryNodeKind(def.name)) {
      const boundaryType = def.name === BOUNDARY_NODE_KINDS.input ? 'input'
        : def.name === BOUNDARY_NODE_KINDS.output ? 'output'
          : 'prop';
      dispatch({ type: 'ADD_BOUNDARY_NODE', boundaryType, position: canvasPosition });
    } else {
      const nodeType = defKey(def);
      const existingNames = scopedNodes.map(n => n.name);
      const newNode = {
        name: nextNodeName(nodeType, existingNames),
        type: nodeType,
        meta: canvasPosition
      };
      dispatch({ type: 'ADD_NODE', node: newNode });
    }
    onClose();
  }, [canvasPosition, dispatch, onClose, scopedNodes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
      break;
    case 'Enter':
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        addNode(flatResults[selectedIndex]);
      }
      break;
    case 'Escape':
      e.preventDefault();
      onClose();
      break;
    case 'Tab':
      e.preventDefault();
      if (e.shiftKey) {
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else {
        setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
      }
      break;
    }
  }, [flatResults, selectedIndex, addNode, onClose]);

  // Position the palette near the mouse, but keep it on screen
  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    zIndex: 9999,
  };

  let flatIndex = 0;

  return (
    <div
      style={style}
      className="w-64 max-h-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-zinc-800">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search nodes..."
          className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto p-1">
        {Object.entries(groupedResults).map(([category, defs]) => (
          <div key={category}>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-2 py-1 sticky top-0 bg-zinc-900">
              {category}
            </div>
            {defs.map(def => {
              const idx = flatIndex++;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={defKey(def)}
                  data-selected={isSelected}
                  onClick={() => addNode(def)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-2 py-1.5 rounded text-left text-xs flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-blue-600/30 text-zinc-100'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {def.icon && <NodeIcon icon={def.icon} size={14} className="opacity-70 flex-shrink-0" />}
                  <span className="truncate">{def.name}</span>
                  {def.description && (
                    <span className="ml-auto text-[10px] text-zinc-500 truncate max-w-[80px]">
                      {def.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
        {flatResults.length === 0 && (
          <div className="text-xs text-zinc-500 px-2 py-3 text-center">
            No matching nodes
          </div>
        )}
      </div>
      <div className="px-2 py-1 border-t border-zinc-800 text-[10px] text-zinc-500 flex gap-3">
        <span><kbd className="px-1 bg-zinc-800 rounded">↑↓</kbd> navigate</span>
        <span><kbd className="px-1 bg-zinc-800 rounded">↵</kbd> add</span>
        <span><kbd className="px-1 bg-zinc-800 rounded">esc</kbd> close</span>
      </div>
    </div>
  );
}

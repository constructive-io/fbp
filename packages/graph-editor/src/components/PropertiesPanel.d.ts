import React from 'react';
import type { Graph } from '@fbp/types';
type EvaluateFn = (graph: Graph, options: {
    definitions: any[];
    outputNode: string;
    outputPort: string;
}) => Promise<any>;
interface PropertiesPanelProps {
    evaluationResult?: unknown;
    onRefreshEvaluation?: () => void;
    evaluateFn?: EvaluateFn;
    definitions?: any[];
}
export declare function PropertiesPanel({ evaluationResult: externalResult, onRefreshEvaluation, evaluateFn, definitions }: PropertiesPanelProps): React.JSX.Element;
export {};

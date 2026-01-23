import React from 'react';
interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    placeholder?: string;
    className?: string;
}
export declare function CodeEditor({ value, onChange, language, placeholder, className }: CodeEditorProps): React.JSX.Element;
export {};

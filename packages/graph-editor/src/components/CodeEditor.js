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
exports.CodeEditor = CodeEditor;
const react_1 = __importStar(require("react"));
const prism_react_renderer_1 = require("prism-react-renderer");
const clsx_1 = require("clsx");
function CodeEditor({ value, onChange, language = 'graphql', placeholder = '', className }) {
    const textareaRef = (0, react_1.useRef)(null);
    const [isFocused, setIsFocused] = (0, react_1.useState)(false);
    // Sync scroll between textarea and highlighted code
    const handleScroll = (0, react_1.useCallback)(() => {
        const textarea = textareaRef.current;
        const pre = textarea?.parentElement?.querySelector('pre');
        if (textarea && pre) {
            pre.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
        }
    }, []);
    // Auto-resize textarea to fit content
    (0, react_1.useEffect)(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
        }
    }, [value]);
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        // Handle Tab key for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onChange(newValue);
            // Set cursor position after the inserted spaces
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }, 0);
        }
    }, [value, onChange]);
    return (<div className={(0, clsx_1.clsx)('relative rounded bg-slate-800 border overflow-hidden', isFocused ? 'border-blue-500' : 'border-slate-600', className)}>
      <prism_react_renderer_1.Highlight theme={prism_react_renderer_1.themes.nightOwl} code={value || placeholder} language={language}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (<pre className={(0, clsx_1.clsx)(highlightClassName, 'absolute inset-0 p-2 m-0 overflow-auto pointer-events-none', 'text-sm font-mono leading-relaxed whitespace-pre-wrap break-words')} style={{
                ...style,
                background: 'transparent',
                minHeight: '120px'
            }}>
            {tokens.map((line, i) => (<div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (<span key={key} {...getTokenProps({ token })} style={{
                        ...getTokenProps({ token }).style,
                        opacity: !value && placeholder ? 0.5 : 1
                    }}/>))}
              </div>))}
          </pre>)}
      </prism_react_renderer_1.Highlight>
      <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onScroll={handleScroll} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onKeyDown={handleKeyDown} placeholder={placeholder} spellCheck={false} className={(0, clsx_1.clsx)('relative w-full p-2 m-0 bg-transparent resize-none', 'text-sm font-mono leading-relaxed whitespace-pre-wrap break-words', 'text-transparent caret-white', 'focus:outline-none', 'min-h-[120px]')} style={{
            WebkitTextFillColor: 'transparent'
        }}/>
    </div>);
}

/**
 * Code Editor component with syntax highlighting
 * Lazy loads syntax highlighting libraries to reduce bundle size
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense, lazy, useState } from 'react';

// Lazy load syntax highlighter to reduce bundle size
const SyntaxHighlighter = lazy(() =>
    import('react-syntax-highlighter').then(module => ({
        default: module.Prism || module.default
    }))
);

// Lazy load syntax highlighter styles
const syntaxStyle = lazy(() =>
    import('react-syntax-highlighter/dist/esm/styles/prism/tomorrow').then(module => ({
        default: module.default
    }))
);

interface CodeEditorProps {
    code?: string;
    language?: string;
    onChange?: (code: string) => void;
    readOnly?: boolean;
    theme?: 'light' | 'dark';
    showLineNumbers?: boolean;
    height?: string;
}

function CodeEditorLoading() {
    return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md border">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">Loading code editor...</p>
                <p className="mt-1 text-xs text-gray-500">Initializing syntax highlighting</p>
            </div>
        </div>
    );
}

function CodeHighlighter({
    code,
    language,
    showLineNumbers = true,
    height = '300px'
}: {
    code: string;
    language: string;
    showLineNumbers?: boolean;
    height?: string;
}) {
    return (
        <Suspense fallback={<CodeEditorLoading />}>
            <div style={{ height }} className="overflow-auto">
                <SyntaxHighlighter
                    language={language}
                    showLineNumbers={showLineNumbers}
                    wrapLines={true}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        height: '100%',
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </Suspense>
    );
}

function SimpleTextArea({
    code,
    onChange,
    height = '300px',
    language
}: {
    code: string;
    onChange: (code: string) => void;
    height?: string;
    language: string;
}) {
    return (
        <div className="relative">
            <textarea
                value={code}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-4 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ height }}
                placeholder={`Enter ${language} code here...`}
            />
            <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {language}
            </div>
        </div>
    );
}

export function CodeEditor({
    code = '',
    language = 'javascript',
    onChange,
    readOnly = false,
    theme = 'light',
    showLineNumbers = true,
    height = '300px'
}: CodeEditorProps) {
    const [currentCode, setCurrentCode] = useState(code);

    const handleCodeChange = (newCode: string) => {
        setCurrentCode(newCode);
        onChange?.(newCode);
    };

    if (readOnly) {
        return (
            <CodeHighlighter
                code={currentCode}
                language={language}
                showLineNumbers={showLineNumbers}
                height={height}
            />
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                    Code Editor ({language})
                </label>
                <div className="flex items-center space-x-2">
                    <select
                        value={language}
                        onChange={(e) => {
                            // Language change would be handled by parent component
                        }}
                        className="text-xs border rounded px-2 py-1"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                    </select>
                </div>
            </div>

            <SimpleTextArea
                code={currentCode}
                onChange={handleCodeChange}
                height={height}
                language={language}
            />

            {/* Preview panel for syntax highlighted version */}
            <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show syntax highlighted preview
                </summary>
                <div className="mt-2 border rounded-md">
                    <CodeHighlighter
                        code={currentCode}
                        language={language}
                        showLineNumbers={showLineNumbers}
                        height="200px"
                    />
                </div>
            </details>
        </div>
    );
}

export default CodeEditor;
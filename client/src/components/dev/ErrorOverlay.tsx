import { AlertTriangle, Code, ExternalLink, FileText, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface ErrorInfo {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  source?: string;
}

interface ErrorOverlayProps {
  error: ErrorInfo;
  onClose: () => void;
}

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ error, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse stack trace for better display
  const parseStackTrace = (stack?: string) => {
    if (!stack) {return [];}

    return stack
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4]),
            raw: line,
          };
        }
        return { raw: line };
      });
  };

  const stackTrace = parseStackTrace(error.stack);

  const openInEditor = (file: string, line: number) => {
    // Try to open in VS Code (common development setup)
    const vscodeUrl = `vscode://file/${file}:${line}`;
    window.open(vscodeUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-red-50 border-2 border-red-200 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-red-100 border-b border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold text-red-800">Development Error</h2>
                <p className="text-sm text-red-600">
                  This overlay only appears in development mode
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-200 rounded-full transition-colors"
              aria-label="Close error overlay"
            >
              <X className="h-5 w-5 text-red-600" />
            </button>
          </div>

          {/* Error Message */}
          <div className="p-4 border-b border-red-200">
            <h3 className="font-medium text-red-800 mb-2">Error Message:</h3>
            <div className="bg-white p-3 rounded border border-red-200">
              <code className="text-red-700 text-sm font-mono break-words">{error.message}</code>
            </div>
          </div>

          {/* File Information */}
          {error.filename && (
            <div className="p-4 border-b border-red-200">
              <h3 className="font-medium text-red-800 mb-2">Location:</h3>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-red-600" />
                <span className="font-mono text-red-700">
                  {error.filename}
                  {error.lineno && `:${error.lineno}`}
                  {error.colno && `:${error.colno}`}
                </span>
                {error.filename && error.lineno && (
                  <button
                    onClick={() => openInEditor(error.filename!, error.lineno!)}
                    className="ml-2 p-1 hover:bg-red-200 rounded transition-colors"
                    title="Open in editor"
                  >
                    <ExternalLink className="h-3 w-3 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {error.stack && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-red-800">Stack Trace:</h3>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>

              <div className="bg-white border border-red-200 rounded overflow-hidden">
                <div
                  className={`transition-all duration-200 ${
                    isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-32 overflow-hidden'
                  }`}
                >
                  <div className="p-3 font-mono text-xs">
                    {stackTrace.map((trace, index) => (
                      <div key={index} className="mb-1">
                        {trace.function ? (
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">at</span>
                            <span className="text-blue-600 font-medium">{trace.function}</span>
                            <span className="text-gray-500">
                              ({trace.file}:{trace.line}:{trace.column})
                            </span>
                            {trace.file && trace.line && (
                              <button
                                onClick={() => openInEditor(trace.file!, trace.line!)}
                                className="p-0.5 hover:bg-red-100 rounded"
                                title="Open in editor"
                              >
                                <ExternalLink className="h-3 w-3 text-red-500" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-600">{trace.raw}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Source Code Preview */}
          {error.source && (
            <div className="p-4 border-t border-red-200">
              <h3 className="font-medium text-red-800 mb-2">Source:</h3>
              <div className="bg-white border border-red-200 rounded p-3">
                <pre className="text-xs font-mono text-gray-700 overflow-x-auto">
                  <code>{error.source}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Development Tips */}
          <div className="p-4 bg-blue-50 border-t border-red-200">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Code className="h-4 w-4" />
              Development Tips:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check the browser console for additional details</li>
              <li>• Use React DevTools to inspect component state</li>
              <li>• Enable source maps for better debugging experience</li>
              <li>• This error overlay only appears in development mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay;

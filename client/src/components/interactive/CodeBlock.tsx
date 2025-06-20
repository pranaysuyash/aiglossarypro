import { useState, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Play, Download, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  description?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  executable?: boolean;
  className?: string;
  maxHeight?: string;
}

export default function CodeBlock({
  code,
  language,
  title,
  description,
  showLineNumbers = true,
  highlightLines = [],
  executable = false,
  className = '',
  maxHeight = '400px'
}: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  
  // Language display mapping
  const languageLabels: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    swift: 'Swift',
    kotlin: 'Kotlin',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    bash: 'Bash',
    shell: 'Shell',
  };

  const displayLanguage = languageLabels[language.toLowerCase()] || language.toUpperCase();

  // Custom style for line highlighting
  const customStyle = {
    ...( isDark ? oneDark : oneLight ),
    lineHeight: '1.5',
    fontSize: '14px',
    padding: '1rem',
    margin: '0',
    borderRadius: '0.5rem',
    backgroundColor: isDark ? '#1e1e1e' : '#fafafa',
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: 'Code copied',
        description: 'Code has been copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy code to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadCode = () => {
    const extension = getFileExtension(language);
    const filename = `${title?.toLowerCase().replace(/\s+/g, '_') || 'code'}.${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteCode = async () => {
    if (!executable) return;
    
    setIsExecuting(true);
    setOutput('');

    try {
      // This is a mock execution for demonstration
      // In a real implementation, you'd send this to a code execution service
      setOutput('// Code execution would happen here\n// This is a demonstration of the UI');
      
      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Code executed',
        description: 'Check the output below',
      });
    } catch (error) {
      setOutput('Error: Code execution failed');
      toast({
        title: 'Execution failed',
        description: 'There was an error executing the code',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
      sql: 'sql',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      yaml: 'yml',
      markdown: 'md',
      bash: 'sh',
      shell: 'sh',
    };
    return extensions[lang.toLowerCase()] || 'txt';
  };

  const needsExpansion = code.split('\n').length > 20;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            <Badge variant="secondary" className="text-xs">
              {displayLanguage}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            {needsExpansion && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                className="h-8 w-8"
              >
                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyCode}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownloadCode}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            {executable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExecuteCode}
                disabled={isExecuting}
                className="h-8 w-8"
              >
                {isExecuting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div 
          className="overflow-auto"
          style={{ 
            maxHeight: needsExpansion && !isExpanded ? '300px' : maxHeight 
          }}
        >
          <SyntaxHighlighter
            language={language.toLowerCase()}
            style={customStyle}
            showLineNumbers={showLineNumbers}
            wrapLines={true}
            lineProps={(lineNumber) => ({
              style: highlightLines.includes(lineNumber) 
                ? { 
                    backgroundColor: isDark ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 255, 0, 0.2)',
                    display: 'block',
                    width: '100%'
                  }
                : {}
            })}
          >
            {code}
          </SyntaxHighlighter>
        </div>
        
        {needsExpansion && !isExpanded && (
          <div className="bg-gradient-to-t from-white dark:from-gray-900 to-transparent h-8 -mt-8 relative z-10 flex items-end justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-xs"
            >
              Show more ({code.split('\n').length} lines)
            </Button>
          </div>
        )}

        {/* Output section for executable code */}
        {executable && output && (
          <div className="border-t">
            <div className="p-4">
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Output:
              </h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                {output}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
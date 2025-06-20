import { ITermSection, IEnhancedUserSettings, ISectionDisplayProps } from '@/interfaces/interfaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  EyeOff, 
  Maximize2,
  Minimize2,
  ExternalLink,
  BookOpen,
  Code,
  TestTube,
  Lightbulb,
  Target,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SectionDisplayComponentProps extends ISectionDisplayProps {
  isExpanded?: boolean;
  onToggleExpand?: (sectionName: string) => void;
  showControls?: boolean;
}

export default function SectionDisplay({
  section,
  userSettings,
  onInteraction,
  isExpanded = false,
  onToggleExpand,
  showControls = true
}: SectionDisplayComponentProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Section type configurations
  const sectionConfigs = {
    introduction: { icon: BookOpen, color: 'blue', label: 'Introduction' },
    definition: { icon: FileText, color: 'green', label: 'Definition' },
    prerequisites: { icon: AlertTriangle, color: 'orange', label: 'Prerequisites' },
    'key-concepts': { icon: Lightbulb, color: 'purple', label: 'Key Concepts' },
    examples: { icon: TestTube, color: 'pink', label: 'Examples' },
    implementation: { icon: Code, color: 'indigo', label: 'Implementation' },
    applications: { icon: Target, color: 'cyan', label: 'Applications' },
    'case-studies': { icon: FileText, color: 'teal', label: 'Case Studies' },
  };

  const getSectionConfig = (sectionName: string) => {
    const key = sectionName.toLowerCase().replace(/\s+/g, '-');
    return sectionConfigs[key as keyof typeof sectionConfigs] || {
      icon: FileText,
      color: 'gray',
      label: sectionName
    };
  };

  const config = getSectionConfig(section.sectionName);
  const IconComponent = config.icon;

  const handleInteraction = (type: string, data?: any) => {
    if (onInteraction) {
      onInteraction(type, { sectionId: section.id, sectionName: section.sectionName, ...data });
    }
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
    handleInteraction('section_toggled', { collapsed: !isCollapsed });
  };

  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand(section.sectionName);
    }
    handleInteraction('section_expanded', { expanded: !isExpanded });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    handleInteraction('section_fullscreen', { fullscreen: !isFullscreen });
  };

  // Render different section content types
  const renderSectionContent = () => {
    const { sectionData } = section;

    // Handle different data structures
    if (typeof sectionData === 'string') {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{sectionData}</ReactMarkdown>
        </div>
      );
    }

    if (sectionData.type === 'markdown' && sectionData.content) {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{sectionData.content}</ReactMarkdown>
        </div>
      );
    }

    if (sectionData.type === 'list' && sectionData.items) {
      return (
        <ul className="space-y-2">
          {sectionData.items.map((item: any, index: number) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <div>
                {typeof item === 'string' ? (
                  <span>{item}</span>
                ) : (
                  <div>
                    <strong>{item.title}</strong>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (sectionData.type === 'table' && sectionData.headers && sectionData.rows) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                {sectionData.headers.map((header: string, index: number) => (
                  <th key={index} className="border border-gray-200 dark:border-gray-700 p-2 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectionData.rows.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex} className="even:bg-gray-50 dark:even:bg-gray-800/50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-200 dark:border-gray-700 p-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (sectionData.type === 'key-value' && sectionData.pairs) {
      return (
        <div className="space-y-3">
          {sectionData.pairs.map((pair: any, index: number) => (
            <div key={index} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
              <dt className="font-medium text-gray-900 dark:text-gray-100">
                {pair.key || pair.term}
              </dt>
              <dd className="text-gray-600 dark:text-gray-400 mt-1">
                {pair.value || pair.definition}
              </dd>
            </div>
          ))}
        </div>
      );
    }

    // Fallback: render as JSON for debugging
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(sectionData, null, 2)}
        </pre>
      </div>
    );
  };

  // Get appropriate container based on display type
  const getContainerClassName = () => {
    const baseClasses = "transition-all duration-200";
    
    if (isFullscreen) {
      return `${baseClasses} fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto p-4`;
    }

    switch (section.displayType) {
      case 'card':
        return `${baseClasses} mb-4`;
      case 'sidebar':
        return `${baseClasses} mb-2`;
      case 'main':
        return `${baseClasses} mb-6`;
      case 'modal':
        return `${baseClasses} mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600`;
      default:
        return `${baseClasses} mb-4`;
    }
  };

  // Check if section should be hidden based on user settings
  const isHidden = userSettings?.hiddenSections?.includes(section.sectionName);
  if (isHidden) return null;

  return (
    <div className={getContainerClassName()}>
      <Card className={section.displayType === 'sidebar' ? 'border-l-4 border-l-blue-500' : ''}>
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded -ml-1">
                <div className="flex items-center space-x-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <IconComponent className={`h-5 w-5 text-${config.color}-500`} />
                  <CardTitle className="text-lg">{config.label}</CardTitle>
                </div>
              </CollapsibleTrigger>
              
              <div className="flex items-center space-x-1">
                <Badge 
                  variant="outline" 
                  className={`text-${config.color}-600 border-${config.color}-200`}
                >
                  {section.displayType}
                </Badge>
                {section.priority && (
                  <Badge variant="secondary" className="text-xs">
                    Priority: {section.priority}
                  </Badge>
                )}
                
                {showControls && (
                  <>
                    {section.displayType !== 'sidebar' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleExpanded}
                        className="h-8 w-8"
                      >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="h-8 w-8"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent className={isExpanded ? 'px-6 pb-6' : 'px-6 pb-6'}>
              {renderSectionContent()}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
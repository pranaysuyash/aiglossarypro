import { AlertTriangle, BookOpen, Code, FileText, Play, Target, TestTube } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeBlock from '../interactive/CodeBlock';
import InteractiveQuiz from '../interactive/InteractiveQuiz';
import MermaidDiagram from '../interactive/MermaidDiagram';
import SimulationPlayer from '../interactive/SimulationPlayer';
import EnhancedTable from '../ui/enhanced-table';
import { OptimizedImage } from '../ui/optimized-image';
import VideoPlayer from '../ui/video-player';

interface SectionItem {
  id: number;
  label: string;
  content: string;
  contentType:
    | 'markdown'
    | 'mermaid'
    | 'image'
    | 'json'
    | 'interactive'
    | 'code'
    | 'table'
    | 'video';
  displayOrder: number;
  metadata?: Record<string, any>;
  isAiGenerated: boolean;
  verificationStatus: 'unverified' | 'verified' | 'flagged' | 'expert_reviewed';
}

interface Section {
  id: number;
  name: string;
  displayOrder: number;
  isCompleted: boolean;
  items: SectionItem[];
}

interface SectionContentRendererProps {
  sections: Section[];
  onInteraction?: (type: string, data: any) => void;
  displayMode?: 'accordion' | 'tabs' | 'cards' | 'sidebar' | 'metadata';
  className?: string | undefined;
}

export default function SectionContentRenderer({
  sections,
  onInteraction,
  displayMode = 'accordion',
  className = '',
}: SectionContentRendererProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id.toString() || '');

  // Section type configurations for icons and styling
  const getSectionConfig = (sectionName: string) => {
    const name = sectionName.toLowerCase();

    if (name.includes('introduction') || name.includes('definition')) {
      return { icon: BookOpen, color: 'blue', priority: 'high' };
    }
    if (name.includes('implementation') || name.includes('code')) {
      return { icon: Code, color: 'purple', priority: 'high' };
    }
    if (name.includes('applications') || name.includes('use case')) {
      return { icon: Target, color: 'green', priority: 'high' };
    }
    if (name.includes('prerequisites') || name.includes('requirement')) {
      return { icon: AlertTriangle, color: 'orange', priority: 'medium' };
    }
    if (name.includes('interactive') || name.includes('quiz')) {
      return { icon: Play, color: 'pink', priority: 'high' };
    }
    if (name.includes('example') || name.includes('case study')) {
      return { icon: TestTube, color: 'teal', priority: 'medium' };
    }

    return { icon: FileText, color: 'gray', priority: 'low' };
  };

  const renderSectionItem = (item: SectionItem) => {
    const handleInteraction = (type: string, data?: any) => {
      if (onInteraction) {
        onInteraction(type, { itemId: item.id, ...data });
      }
    };

    switch (item.contentType) {
      case 'markdown':
        return (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{item.content}</ReactMarkdown>
          </div>
        );

      case 'code':
        return (
          <CodeBlock
            code={item.content}
            language={item.metadata?.language || 'text'}
            title={item.label}
            showLineNumbers
            className="mb-4"
          />
        );

      case 'mermaid':
        return <MermaidDiagram diagram={item.content} title={item.label} className="mb-4" />;

      case 'interactive':
        try {
          const interactiveData = JSON.parse(item.content);
          if (interactiveData.type === 'quiz') {
            return (
              <InteractiveQuiz
                questions={interactiveData.questions || []}
                title={item.label}
                onComplete={result => handleInteraction('quiz_completed', result)}
                className="mb-4"
              />
            );
          } else if (interactiveData.type === 'simulation') {
            return (
              <SimulationPlayer
                config={{
                  title: item.label,
                  description: item.metadata?.description,
                  ...interactiveData.config,
                }}
                onStepChange={(step, index) =>
                  handleInteraction('simulation_step', { step, index })
                }
                className="mb-4"
              />
            );
          }
        } catch (error: any) {
          console.error('Failed to parse interactive content:', error);
        }
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Interactive element: {item.label}</p>
            <pre className="text-xs mt-2 text-gray-500">{item.content}</pre>
          </div>
        );

      case 'json':
        try {
          const jsonData = JSON.parse(item.content);
          return (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">{item.label}</h4>
              <pre className="text-sm overflow-x-auto">{JSON.stringify(jsonData, null, 2)}</pre>
            </div>
          );
        } catch (_error) {
          return (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">{item.label}</h4>
              <p className="text-sm">{item.content}</p>
            </div>
          );
        }

      case 'image':
        return (
          <div className="mb-4">
            <h4 className="font-medium mb-2">{item.label}</h4>
            <OptimizedImage
              src={item.content}
              alt={item.label}
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        );

      case 'table':
        try {
          const tableData = JSON.parse(item.content);
          const { columns, data, ...tableProps } = tableData;

          return (
            <EnhancedTable
              columns={columns}
              data={data}
              title={item.label}
              description={item.metadata?.description}
              searchable={item.metadata?.searchable !== false}
              exportable={item.metadata?.exportable !== false}
              pagination={item.metadata?.pagination !== false}
              pageSize={item.metadata?.pageSize || 10}
              className="mb-4"
              {...tableProps}
            />
          );
        } catch (error: any) {
          console.error('Failed to parse table content:', error);
          return (
            <div className="p-4 border-2 border-dashed border-red-300 dark:border-red-600 rounded-lg">
              <p className="text-red-600 dark:text-red-400">Error: Invalid table data format</p>
              <p className="text-xs mt-2 text-gray-500">
                Expected JSON with 'columns' and 'data' properties
              </p>
            </div>
          );
        }

      case 'video':
        return (
          <VideoPlayer
            src={item.content}
            title={item.label}
            description={item.metadata?.description}
            poster={item.metadata?.poster}
            autoplay={item.metadata?.autoplay || false}
            controls={item.metadata?.controls !== false}
            loop={item.metadata?.loop || false}
            muted={item.metadata?.muted || false}
            subtitles={item.metadata?.subtitles || []}
            className="mb-4"
          />
        );

      default:
        return (
          <div className="prose dark:prose-invert max-w-none">
            <h4 className="font-medium mb-2">{item.label}</h4>
            <p>{item.content}</p>
          </div>
        );
    }
  };

  const renderSection = (section: Section) => {
    const config = getSectionConfig(section.name);
    const IconComponent = config.icon;

    return (
      <div key={section.id} className="mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <IconComponent className={`h-5 w-5 text-${config.color}-500`} />
          <h3 className="text-lg font-semibold">{section.name}</h3>
          <Badge variant="outline" className="text-xs">
            {section.items.length} items
          </Badge>
          {section.isCompleted && (
            <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
              Completed
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {section.items
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(item => (
              <div key={item.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{item.label}</h4>
                  <div className="flex items-center space-x-2">
                    {item.isAiGenerated && (
                      <Badge variant="secondary" className="text-xs">
                        AI Generated
                      </Badge>
                    )}
                    <Badge
                      variant={item.verificationStatus === 'verified' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {item.verificationStatus}
                    </Badge>
                  </div>
                </div>
                {renderSectionItem(item)}
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderAccordionMode = () => (
    <Accordion type="multiple" className="w-full">
      {sections
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(section => {
          const config = getSectionConfig(section.name);
          const IconComponent = config.icon;

          return (
            <AccordionItem key={section.id} value={section.id.toString()}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center space-x-2">
                  <IconComponent className={`h-4 w-4 text-${config.color}-500`} />
                  <span>{section.name}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {section.items.length}
                  </Badge>
                  {section.isCompleted && (
                    <Badge variant="default" className="bg-green-100 text-green-700 text-xs ml-1">
                      ✓
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">{renderSection(section)}</div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
    </Accordion>
  );

  const renderTabsMode = () => {
    const prioritySections = sections
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter(section => {
        const config = getSectionConfig(section.name);
        return config.priority === 'high';
      })
      .slice(0, 6); // Limit to 6 tabs for UI

    return (
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {prioritySections.map(section => {
            const config = getSectionConfig(section.name);
            const IconComponent = config.icon;

            return (
              <TabsTrigger
                key={section.id}
                value={section.id.toString()}
                className="flex items-center space-x-1"
              >
                <IconComponent className="h-3 w-3" />
                <span className="hidden sm:inline truncate">{section.name.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {prioritySections.map(section => (
          <TabsContent key={section.id} value={section.id.toString()}>
            <Card>
              <CardContent className="pt-6">{renderSection(section)}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  const renderCardsMode = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {sections
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(section => {
          const config = getSectionConfig(section.name);
          const IconComponent = config.icon;

          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <IconComponent className={`h-5 w-5 text-${config.color}-500`} />
                  <span>{section.name}</span>
                  {section.isCompleted && (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      ✓
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>{renderSection(section)}</CardContent>
            </Card>
          );
        })}
    </div>
  );

  const renderSidebarMode = () => {
    const mainSections = sections
      .filter(section => {
        const config = getSectionConfig(section.name);
        return config.priority === 'high';
      })
      .slice(0, 3);

    const sidebarSections = sections.filter(section => !mainSections.includes(section));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {mainSections.map(section => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {(() => {
                      const config = getSectionConfig(section.name);
                      const IconComponent = config.icon;
                      return <IconComponent className={`h-5 w-5 text-${config.color}-500`} />;
                    })()}
                    <span>{section.name}</span>
                    {section.isCompleted && (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        ✓
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>{renderSection(section)}</CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Additional Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sidebarSections.map(section => {
                  const config = getSectionConfig(section.name);
                  const IconComponent = config.icon;

                  return (
                    <div
                      key={section.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <IconComponent className={`h-4 w-4 text-${config.color}-500`} />
                        <span className="font-medium text-sm">{section.name}</span>
                        {section.isCompleted && (
                          <Badge variant="outline" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {section.items.length} items
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderMetadataMode = () => {
    const metadataSections = sections.filter(
      section =>
        section.name.toLowerCase().includes('metadata') ||
        section.name.toLowerCase().includes('reference') ||
        section.name.toLowerCase().includes('glossary') ||
        section.name.toLowerCase().includes('tags')
    );

    const contentSections = sections.filter(section => !metadataSections.includes(section));

    return (
      <div className="space-y-6">
        {/* Metadata Overview */}
        {metadataSections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Metadata & References</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metadataSections.map(section => {
                  const config = getSectionConfig(section.name);
                  const IconComponent = config.icon;

                  return (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <IconComponent className={`h-4 w-4 text-${config.color}-500`} />
                        <h4 className="font-medium">{section.name}</h4>
                        {section.isCompleted && (
                          <Badge variant="outline" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {section.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            {item.label}
                          </div>
                        ))}
                        {section.items.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{section.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 gap-4">
          {contentSections.map(section => {
            const config = getSectionConfig(section.name);
            const IconComponent = config.icon;

            return (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <IconComponent className={`h-4 w-4 text-${config.color}-500`} />
                      <span className="text-base">{section.name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {section.items.length} items
                      </Badge>
                      {section.isCompleted && (
                        <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {section.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      {renderSectionItem(item)}
                    </div>
                  ))}
                  {section.items.length > 2 && (
                    <Button variant="outline" size="sm" className="mt-2">
                      View {section.items.length - 2} more items
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (!sections || sections.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No sections available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sections are being generated for this term. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Content Sections</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{sections.length} sections</Badge>
            <Badge variant="secondary">
              {sections.filter(s => s.isCompleted).length} completed
            </Badge>
          </div>
        </div>

        {/* Display mode selector */}
        <div className="flex items-center space-x-2 mb-4 flex-wrap gap-2">
          <Button
            variant={displayMode === 'accordion' ? 'default' : 'outline'}
            size="sm"
            onClick={() => (displayMode = 'accordion')}
          >
            Accordion
          </Button>
          <Button
            variant={displayMode === 'tabs' ? 'default' : 'outline'}
            size="sm"
            onClick={() => (displayMode = 'tabs')}
          >
            Tabs
          </Button>
          <Button
            variant={displayMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => (displayMode = 'cards')}
          >
            Cards
          </Button>
          <Button
            variant={displayMode === 'sidebar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => (displayMode = 'sidebar')}
          >
            Sidebar
          </Button>
          <Button
            variant={displayMode === 'metadata' ? 'default' : 'outline'}
            size="sm"
            onClick={() => (displayMode = 'metadata')}
          >
            Metadata
          </Button>
        </div>
      </div>

      {displayMode === 'accordion' && renderAccordionMode()}
      {displayMode === 'tabs' && renderTabsMode()}
      {displayMode === 'cards' && renderCardsMode()}
      {displayMode === 'sidebar' && renderSidebarMode()}
      {displayMode === 'metadata' && renderMetadataMode()}
    </div>
  );
}

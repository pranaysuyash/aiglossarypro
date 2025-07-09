import { Filter, Grid3x3, List, Maximize, Settings, Sidebar as SidebarIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { IEnhancedUserSettings, ITermSection } from '@/interfaces/interfaces';
import SectionDisplay from './SectionDisplay';

interface SectionLayoutManagerProps {
  sections: ITermSection[];
  userSettings?: IEnhancedUserSettings;
  onInteraction?: (sectionId: string, interactionType: string, data?: any) => void;
  className?: string;
}

type LayoutType = 'grid' | 'list' | 'sidebar' | 'tabbed';
type FilterType = 'all' | 'card' | 'sidebar' | 'main' | 'modal' | 'metadata';

export default function SectionLayoutManager({
  sections,
  userSettings,
  onInteraction,
  className = '',
}: SectionLayoutManagerProps) {
  const [layoutType, setLayoutType] = useState<LayoutType>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'type'>('priority');

  // Filter sections based on user preferences and current filter
  const filteredSections = sections
    .filter((section) => {
      // Filter by display type
      if (filterType !== 'all' && section.displayType !== filterType) {
        return false;
      }

      // Filter by user hidden sections
      if (userSettings?.hiddenSections?.includes(section.sectionName)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'name':
          return a.sectionName.localeCompare(b.sectionName);
        case 'type':
          return a.displayType.localeCompare(b.displayType);
        default:
          return 0;
      }
    });

  // Group sections by display type
  const groupedSections = filteredSections.reduce(
    (groups, section) => {
      const type = section.displayType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(section);
      return groups;
    },
    {} as Record<string, ITermSection[]>
  );

  const handleSectionInteraction = (sectionId: string, interactionType: string, data?: any) => {
    if (onInteraction) {
      onInteraction(sectionId, interactionType, data);
    }
  };

  const toggleSectionExpansion = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const renderControls = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Layout:</span>
          <div className="flex items-center space-x-1">
            <Button
              variant={layoutType === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayoutType('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={layoutType === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayoutType('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={layoutType === 'sidebar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayoutType('sidebar')}
            >
              <SidebarIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={layoutType === 'tabbed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayoutType('tabbed')}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="modal">Modal</SelectItem>
              <SelectItem value="metadata">Metadata</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm">Sort:</span>
          <Select
            value={sortBy}
            onValueChange={(value: 'priority' | 'name' | 'type') => setSortBy(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant="outline">{filteredSections.length} sections</Badge>
        {Object.keys(groupedSections).map((type) => (
          <Badge key={type} variant="secondary" className="text-xs">
            {type}: {groupedSections[type].length}
          </Badge>
        ))}
      </div>
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-4">
      {filteredSections.map((section) => (
        <SectionDisplay
          key={section.id}
          section={section}
          userSettings={userSettings}
          onInteraction={(type, data) => handleSectionInteraction(section.id, type, data)}
          isExpanded={expandedSections.has(section.sectionName)}
          onToggleExpand={toggleSectionExpansion}
        />
      ))}
    </div>
  );

  const renderGridLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredSections.map((section) => (
        <SectionDisplay
          key={section.id}
          section={section}
          userSettings={userSettings}
          onInteraction={(type, data) => handleSectionInteraction(section.id, type, data)}
          isExpanded={expandedSections.has(section.sectionName)}
          onToggleExpand={toggleSectionExpansion}
        />
      ))}
    </div>
  );

  const renderSidebarLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-2">
        {groupedSections.sidebar?.map((section) => (
          <SectionDisplay
            key={section.id}
            section={section}
            userSettings={userSettings}
            onInteraction={(type, data) => handleSectionInteraction(section.id, type, data)}
            showControls={false}
          />
        )) || (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No sidebar sections</p>
          </div>
        )}
      </div>
      <div className="lg:col-span-3 space-y-4">
        {['main', 'card', 'modal', 'metadata'].map((type) =>
          groupedSections[type]?.map((section) => (
            <SectionDisplay
              key={section.id}
              section={section}
              userSettings={userSettings}
              onInteraction={(type, data) => handleSectionInteraction(section.id, type, data)}
              isExpanded={expandedSections.has(section.sectionName)}
              onToggleExpand={toggleSectionExpansion}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderTabbedLayout = () => {
    const tabTypes = Object.keys(groupedSections);
    if (tabTypes.length === 0) return <div>No sections available</div>;

    return (
      <Tabs defaultValue={tabTypes[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabTypes.map((type) => (
            <TabsTrigger key={type} value={type} className="capitalize">
              {type} ({groupedSections[type].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {tabTypes.map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {groupedSections[type].map((section) => (
              <SectionDisplay
                key={section.id}
                section={section}
                userSettings={userSettings}
                onInteraction={(type, data) => handleSectionInteraction(section.id, type, data)}
                isExpanded={expandedSections.has(section.sectionName)}
                onToggleExpand={toggleSectionExpansion}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  const renderContent = () => {
    switch (layoutType) {
      case 'grid':
        return renderGridLayout();
      case 'sidebar':
        return renderSidebarLayout();
      case 'tabbed':
        return renderTabbedLayout();
      default:
        return renderListLayout();
    }
  };

  if (!sections || sections.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No sections available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {renderControls()}
      {renderContent()}
    </div>
  );
}

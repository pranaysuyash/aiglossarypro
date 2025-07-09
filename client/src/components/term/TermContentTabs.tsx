import { BookOpen, Brain, Lightbulb, Settings, Star, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TAB_LABELS } from '@/constants/messages';
import type {
  IEnhancedTerm,
  IEnhancedUserSettings,
  IInteractiveElement,
  ITerm,
  ITermSection,
} from '@/interfaces/interfaces';

interface TermContentTabsProps {
  term: IEnhancedTerm | ITerm;
  isEnhanced: boolean;
  isAuthenticated: boolean;
  activeTab: string;
  sections: ITermSection[];
  interactiveElements: IInteractiveElement[];
  relationships: ITerm[];
  userSettings?: IEnhancedUserSettings;
  learned?: boolean;
  learnedLoading: boolean;
  termId?: string;
  onTabChange: (tab: string) => void;
  onSectionInteraction: (sectionId: string, interactionType: string, data?: any) => void;
  onInteractiveElementInteraction: (elementId: string, type: string, data?: any) => void;
  onAIImprovementApplied: () => void;
  overviewComponent: React.ReactNode;
  sectionsComponent: React.ReactNode;
  interactiveComponent: React.ReactNode;
  relationshipsComponent: React.ReactNode;
  aiToolsComponent: React.ReactNode;
  progressComponent: React.ReactNode;
}

export default function TermContentTabs({
  activeTab,
  isAuthenticated,
  termId,
  learnedLoading,
  onTabChange,
  overviewComponent,
  sectionsComponent,
  interactiveComponent,
  relationshipsComponent,
  aiToolsComponent,
  progressComponent,
}: TermContentTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
        <TabsTrigger value="overview" className="flex items-center space-x-1">
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">{TAB_LABELS.OVERVIEW}</span>
        </TabsTrigger>
        <TabsTrigger value="sections" className="flex items-center space-x-1">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">{TAB_LABELS.SECTIONS}</span>
        </TabsTrigger>
        <TabsTrigger value="interactive" className="flex items-center space-x-1">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">{TAB_LABELS.INTERACTIVE}</span>
        </TabsTrigger>
        <TabsTrigger value="relationships" className="flex items-center space-x-1">
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">{TAB_LABELS.RELATED}</span>
        </TabsTrigger>
        {isAuthenticated && (
          <TabsTrigger value="ai-tools" className="flex items-center space-x-1">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">{TAB_LABELS.AI_TOOLS}</span>
          </TabsTrigger>
        )}
        <TabsTrigger value="progress" className="flex items-center space-x-1">
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">{TAB_LABELS.PROGRESS}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {overviewComponent}
      </TabsContent>

      <TabsContent value="sections" className="mt-6">
        {sectionsComponent}
      </TabsContent>

      <TabsContent value="interactive" className="mt-6">
        {interactiveComponent}
      </TabsContent>

      <TabsContent value="relationships" className="mt-6">
        {relationshipsComponent}
      </TabsContent>

      {isAuthenticated && (
        <TabsContent value="ai-tools" className="mt-6">
          {aiToolsComponent}
        </TabsContent>
      )}

      <TabsContent value="progress" className="mt-6">
        {!learnedLoading && termId && progressComponent}
      </TabsContent>
    </Tabs>
  );
}

import type { ISection, IUserProgress } from '@shared/types';
import { BookOpen, Check, Clock, Target } from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SectionNavigatorProps {
  sections: ISection[];
  userProgress: IUserProgress[];
  currentSectionId?: number;
  onSectionClick: (sectionId: number) => void;
  className?: string;
}

export const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  sections,
  userProgress,
  currentSectionId,
  onSectionClick,
  className = '',
}) => {
  // Create progress map for quick lookup
  const progressMap = new Map(userProgress.map((p) => [p.sectionId, p]));

  // Calculate overall progress
  const completedSections = userProgress.filter(
    (p) => p.status === 'completed' || p.status === 'mastered'
  ).length;
  const totalSections = sections.length;
  const overallProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  const getStatusIcon = (sectionId: number) => {
    const progress = progressMap.get(sectionId);
    if (!progress) return <Clock className="h-4 w-4 text-gray-400" />;

    switch (progress.status) {
      case 'completed':
      case 'mastered':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (sectionId: number) => {
    const progress = progressMap.get(sectionId);
    if (!progress) return 'bg-gray-100 text-gray-600';

    switch (progress.status) {
      case 'completed':
      case 'mastered':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className={`sticky top-4 h-fit ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Overall Progress Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900">Learning Progress</h3>
              <Badge variant="outline" className="text-xs">
                {completedSections}/{totalSections}
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <p className="text-xs text-gray-500">{Math.round(overallProgress)}% Complete</p>
          </div>

          {/* Section List */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            <h4 className="font-medium text-xs text-gray-700 uppercase tracking-wide mb-2">
              Sections
            </h4>
            {sections
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((section) => {
                const progress = progressMap.get(section.id);
                const isActive = currentSectionId === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionClick(section.id)}
                    className={`
                      w-full text-left p-2 rounded-md text-sm transition-colors
                      flex items-center space-x-2 group
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">{getStatusIcon(section.id)}</div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{section.name}</p>
                      {progress &&
                        progress.completionPercentage > 0 &&
                        progress.status !== 'completed' && (
                          <div className="mt-1">
                            <Progress value={progress.completionPercentage} className="h-1" />
                          </div>
                        )}
                    </div>

                    <div className="flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getStatusColor(section.id)}`}
                      >
                        {section.displayOrder}
                      </Badge>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Learning Stats */}
          <div className="pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1 text-green-600">
                <Target className="h-3 w-3" />
                <span>{completedSections} Done</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <BookOpen className="h-3 w-3" />
                <span>{userProgress.filter((p) => p.status === 'in_progress').length} Active</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

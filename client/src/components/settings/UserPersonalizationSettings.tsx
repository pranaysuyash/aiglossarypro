import {
  BookOpen,
  Brain,
  Code,
  EyeOff,
  Heart,
  Palette,
  RotateCcw,
  Save,
  Settings,
  Star,
  TestTube,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import type { IEnhancedUserSettings } from '@/interfaces/interfaces';
import { apiRequest } from '@/lib/queryClient';

interface UserPersonalizationSettingsProps {
  currentSettings?: IEnhancedUserSettings;
  onSettingsChange?: (settings: IEnhancedUserSettings) => void;
  availableCategories?: string[];
  availableApplications?: string[];
  availableSections?: string[];
  className?: string | undefined;
}

const defaultSections = [
  'introduction',
  'definition',
  'prerequisites',
  'key-concepts',
  'examples',
  'implementation',
  'applications',
  'case-studies',
  'mathematical-foundation',
  'algorithms',
  'best-practices',
  'common-mistakes',
  'related-concepts',
  'further-reading',
];

export default function UserPersonalizationSettings({
  currentSettings,
  onSettingsChange,
  availableCategories = [],
  availableApplications = [],
  availableSections = defaultSections,
  className = '',
}: UserPersonalizationSettingsProps) {
  const [settings, setSettings] = useState<Partial<IEnhancedUserSettings>>({
    experienceLevel: 'intermediate',
    preferredSections: [],
    hiddenSections: [],
    showMathematicalDetails: true,
    showCodeExamples: true,
    showInteractiveElements: true,
    favoriteCategories: [],
    favoriteApplications: [],
    compactMode: false,
    darkMode: false,
    ...currentSettings,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (currentSettings) {
      setSettings({ ...currentSettings });
    }
  }, [currentSettings]);

  const handleSettingChange = (key: keyof IEnhancedUserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const toggleArrayItem = (key: keyof IEnhancedUserSettings, item: string) => {
    const currentArray = (settings[key] as string[]) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];

    handleSettingChange(key, newArray);
  };

  const handleSaveSettings = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save settings',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiRequest('PUT', '/api/user/settings', settings);
      const updatedSettings = await response.json();

      if (onSettingsChange) {
        onSettingsChange(updatedSettings);
      }

      setHasChanges(false);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully',
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      experienceLevel: 'intermediate',
      preferredSections: [],
      hiddenSections: [],
      showMathematicalDetails: true,
      showCodeExamples: true,
      showInteractiveElements: true,
      favoriteCategories: [],
      favoriteApplications: [],
      compactMode: false,
      darkMode: false,
    });
    setHasChanges(true);
  };

  const renderExperienceLevel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Experience Level</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select your AI/ML experience level</Label>
          <Select
            value={settings.experienceLevel}
            onValueChange={value => handleSettingChange('experienceLevel', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Beginner - New to AI/ML concepts</span>
                </div>
              </SelectItem>
              <SelectItem value="intermediate">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Intermediate - Some knowledge and experience</span>
                </div>
              </SelectItem>
              <SelectItem value="advanced">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Advanced - Strong understanding and practice</span>
                </div>
              </SelectItem>
              <SelectItem value="expert">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Expert - Professional level expertise</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This helps us customize the complexity of explanations and suggest appropriate content.
        </p>
      </CardContent>
    </Card>
  );

  const renderContentPreferences = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>Content Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <Label htmlFor="math-details">Mathematical Details</Label>
            </div>
            <Switch
              id="math-details"
              checked={settings.showMathematicalDetails}
              onCheckedChange={checked => handleSettingChange('showMathematicalDetails', checked)}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
            Show mathematical formulations and equations
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-blue-500" />
              <Label htmlFor="code-examples">Code Examples</Label>
            </div>
            <Switch
              id="code-examples"
              checked={settings.showCodeExamples}
              onCheckedChange={checked => handleSettingChange('showCodeExamples', checked)}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
            Display programming code and implementation examples
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TestTube className="h-4 w-4 text-green-500" />
              <Label htmlFor="interactive-elements">Interactive Elements</Label>
            </div>
            <Switch
              id="interactive-elements"
              checked={settings.showInteractiveElements}
              onCheckedChange={checked => handleSettingChange('showInteractiveElements', checked)}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
            Enable quizzes, diagrams, and interactive demonstrations
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSectionPreferences = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Section Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <Label>Preferred Sections</Label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Sections you want to see first and highlighted
          </p>
          <ScrollArea className="h-32 border rounded p-3">
            <div className="grid grid-cols-2 gap-2">
              {availableSections.map(section => (
                <div key={section} className="flex items-center space-x-2">
                  <Switch
                    id={`preferred-${section}`}
                    checked={(settings.preferredSections || []).includes(section)}
                    onCheckedChange={() => toggleArrayItem('preferredSections', section)}
                  />
                  <Label htmlFor={`preferred-${section}`} className="text-sm capitalize">
                    {section.replace(/-/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <div>
          <div className="flex items-center space-x-2 mb-3">
            <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-300" />
            <Label>Hidden Sections</Label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Sections you want to hide by default
          </p>
          <ScrollArea className="h-32 border rounded p-3">
            <div className="grid grid-cols-2 gap-2">
              {availableSections.map(section => (
                <div key={section} className="flex items-center space-x-2">
                  <Switch
                    id={`hidden-${section}`}
                    checked={(settings.hiddenSections || []).includes(section)}
                    onCheckedChange={() => toggleArrayItem('hiddenSections', section)}
                  />
                  <Label htmlFor={`hidden-${section}`} className="text-sm capitalize">
                    {section.replace(/-/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );

  const renderPersonalization = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>Favorite Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Select categories you're most interested in
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableCategories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Switch
                  id={`fav-cat-${category}`}
                  checked={(settings.favoriteCategories || []).includes(category)}
                  onCheckedChange={() => toggleArrayItem('favoriteCategories', category)}
                />
                <Label htmlFor={`fav-cat-${category}`} className="text-sm">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-green-500" />
            <span>Favorite Applications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Select application domains you work with or are interested in
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableApplications.map(application => (
              <div key={application} className="flex items-center space-x-2">
                <Switch
                  id={`fav-app-${application}`}
                  checked={(settings.favoriteApplications || []).includes(application)}
                  onCheckedChange={() => toggleArrayItem('favoriteApplications', application)}
                />
                <Label htmlFor={`fav-app-${application}`} className="text-sm">
                  {application}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUIPreferences = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>UI Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="compact-mode">Compact Mode</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Show more content in less space
            </p>
          </div>
          <Switch
            id="compact-mode"
            checked={settings.compactMode}
            onCheckedChange={checked => handleSettingChange('compactMode', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use dark theme for better viewing in low light
            </p>
          </div>
          <Switch
            id="dark-mode"
            checked={settings.darkMode}
            onCheckedChange={checked => handleSettingChange('darkMode', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Personalization Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">Customize your learning experience</p>
        </div>

        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
            >
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleResetSettings}
            className="flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-1"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Settings</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="experience" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="personalization">Interests</TabsTrigger>
          <TabsTrigger value="ui">Interface</TabsTrigger>
        </TabsList>

        <TabsContent value="experience" className="space-y-6">
          {renderExperienceLevel()}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {renderContentPreferences()}
          {renderSectionPreferences()}
        </TabsContent>

        <TabsContent value="personalization" className="space-y-6">
          {renderPersonalization()}
        </TabsContent>

        <TabsContent value="ui" className="space-y-6">
          {renderUIPreferences()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

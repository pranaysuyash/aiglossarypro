import { AlertCircle, Edit, Eye, EyeOff, History, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContentVersion {
  id: string;
  content: string;
  editedAt: Date;
  editedBy: string;
  isAiGenerated: boolean;
  qualityScore?: number;
}

interface InlineContentEditorProps {
  termId: string;
  termName: string;
  sectionName: string;
  sectionLabel: string;
  content: string;
  isAiGenerated: boolean;
  qualityScore?: number;
  metadata?: any;
  onSave: (termId: string, content: string) => void;
  onRegenerate: (termId: string) => void;
}

export function InlineContentEditor({
  termId,
  termName,
  sectionName,
  sectionLabel,
  content: initialContent,
  isAiGenerated = false,
  qualityScore,
  metadata,
  onSave,
  onRegenerate,
  className,
}: InlineContentEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(initialContent);
    setOriginalContent(initialContent);
    setHasChanges(false);
  }, [initialContent]);

  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(content.length, content.length);
    }, 100);
  };

  const handleCancel = () => {
    setContent(originalContent);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(termId, content);
      setOriginalContent(content);
      setIsEditing(false);
      setHasChanges(false);

      // Add to version history
      const newVersion: ContentVersion = {
        id: Date.now().toString(),
        content: originalContent,
        editedAt: new Date(),
        editedBy: 'Admin',
        isAiGenerated: false,
        qualityScore,
      };
      setVersions([newVersion, ...versions.slice(0, 9)]); // Keep last 10 versions

      toast({ title: 'Success', description: 'Content saved successfully' });
    } catch (error: Error | unknown) {
      console.error('Error saving content:', error);
      toast({ title: 'Error', description: 'Failed to save content', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      const confirmed = window.confirm(
        'Are you sure you want to regenerate this content? Current content will be replaced.'
      );
      if (confirmed) {
        await onRegenerate(termId);
      }
    }
  };

  const handleRevertToVersion = (version: ContentVersion) => {
    setContent(version.content);
    setHasChanges(true);
    setShowVersionHistory(false);
    toast({ title: 'Info', description: 'Reverted to previous version. Click Save to apply.' });
  };

  const getQualityBadgeColor = (score?: number) => {
    if (!score) {return 'default';}
    if (score >= 8) {return 'green';}
    if (score >= 6) {return 'yellow';}
    if (score >= 4) {return 'orange';}
    return 'red';
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <Card className={cn('relative', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{sectionLabel}</CardTitle>
            <div className="flex items-center gap-2">
              {isAiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  AI Generated
                </Badge>
              )}
              {qualityScore && (
                <Badge variant={getQualityBadgeColor(qualityScore) as any} className="text-xs">
                  Quality: {qualityScore}/10
                </Badge>
              )}
              {hasChanges && (
                <Badge variant="destructive" className="text-xs">
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  disabled={versions.length === 0}
                >
                  <History className="w-4 h-4" />
                </Button>
                {onRegenerate && (
                  <Button variant="ghost" size="sm" onClick={handleRegenerate}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
              </>
            )}

            {isEditing && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showVersionHistory && versions.length > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Version History</h4>
            <div className="space-y-1">
              {versions.map(version => (
                <div key={version.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(version.editedAt).toLocaleString()}
                    {version.isAiGenerated && ' (AI)'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleRevertToVersion(version)}>
                    Revert
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Edit Content (Markdown)</label>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={e => {
                  setContent(e.target.value);
                  autoResizeTextarea();
                }}
                onInput={autoResizeTextarea}
                className="min-h-[300px] font-mono text-sm resize-none"
                placeholder="Enter content in Markdown format..."
              />
              <p className="text-xs text-muted-foreground">
                Supports Markdown formatting. Use **bold**, *italic*, # headers, - lists, etc.
              </p>
            </div>

            {showPreview && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview</label>
                <div className="min-h-[300px] p-4 border rounded-lg bg-background overflow-auto">
                  {content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No content to preview</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <p>No content available for this section.</p>
              </div>
            )}
          </div>
        )}

        {metadata && Object.keys(metadata).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-muted-foreground">Metadata</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

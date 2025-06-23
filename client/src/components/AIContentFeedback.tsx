import React, { useState } from 'react';
import { AlertTriangle, Flag, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';

interface AIContentFeedbackProps {
  termId: string;
  termName: string;
  isAiGenerated: boolean;
  verificationStatus?: 'unverified' | 'verified' | 'flagged' | 'needs_review' | 'expert_reviewed';
  section?: string; // Which part of the content (definition, characteristics, etc.)
  onFeedbackSubmitted?: () => void;
  className?: string;
}

interface FeedbackFormData {
  feedbackType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function AIContentFeedback({
  termId,
  termName,
  isAiGenerated,
  verificationStatus = 'unverified',
  section,
  onFeedbackSubmitted,
  className = ""
}: AIContentFeedbackProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackFormData>({
    feedbackType: '',
    description: '',
    severity: 'medium'
  });
  const { toast } = useToast();

  const feedbackTypes = [
    { value: 'incorrect', label: 'Factually Incorrect', description: 'Contains false or inaccurate information' },
    { value: 'incomplete', label: 'Incomplete', description: 'Missing important information or context' },
    { value: 'misleading', label: 'Misleading', description: 'Could lead to misunderstanding' },
    { value: 'outdated', label: 'Outdated', description: 'Information is no longer current' },
    { value: 'other', label: 'Other Issue', description: 'Different type of problem' }
  ];

  const getVerificationBadge = () => {
    const statusConfig = {
      unverified: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Unverified' },
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Verified' },
      flagged: { color: 'bg-red-100 text-red-800', icon: Flag, label: 'Flagged' },
      needs_review: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Needs Review' },
      expert_reviewed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Expert Reviewed' }
    };

    const config = statusConfig[verificationStatus];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const submitFeedback = async () => {
    if (!feedbackData.feedbackType || !feedbackData.description.trim()) {
      toast({
        title: "Incomplete Form",
        description: "Please select a feedback type and provide a description.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termId,
          feedbackType: feedbackData.feedbackType,
          section,
          description: feedbackData.description,
          severity: feedbackData.severity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for helping improve our AI-generated content. Your feedback will be reviewed by our team.",
        });
        
        setShowFeedbackForm(false);
        setFeedbackData({
          feedbackType: '',
          description: '',
          severity: 'medium'
        });
        
        onFeedbackSubmitted?.();
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to submit feedback',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show feedback option for verified content unless it's flagged
  if (!isAiGenerated || (verificationStatus === 'verified' || verificationStatus === 'expert_reviewed')) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* AI Content Indicator */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              AI Generated
            </Badge>
            {getVerificationBadge()}
          </div>
          <span className="text-sm text-blue-700">
            This content was generated using AI and may require verification.
          </span>
        </div>
        
        {!showFeedbackForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFeedbackForm(true)}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            <Flag className="w-4 h-4 mr-1" />
            Report Issue
          </Button>
        )}
      </div>

      {/* Feedback Form */}
      {showFeedbackForm && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
              Report Content Issue
            </CardTitle>
            <CardDescription>
              Help us improve the quality of AI-generated content for "{termName}"
              {section && ` (${section} section)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Feedback Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type of Issue</label>
              <Select value={feedbackData.feedbackType} onValueChange={(value) => 
                setFeedbackData(prev => ({ ...prev, feedbackType: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of issue" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={feedbackData.severity} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                setFeedbackData(prev => ({ ...prev, severity: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor issue</SelectItem>
                  <SelectItem value="medium">Medium - Noticeable problem</SelectItem>
                  <SelectItem value="high">High - Significant error</SelectItem>
                  <SelectItem value="critical">Critical - Major inaccuracy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please describe the issue in detail. What is incorrect or problematic? How should it be corrected?"
                value={feedbackData.description}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Provide specific details to help our experts review and correct the content.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitFeedback}
                disabled={isSubmitting || !feedbackData.feedbackType || !feedbackData.description.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer for AI content */}
      {isAiGenerated && verificationStatus === 'unverified' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          <strong>AI-Generated Content:</strong> This information was created by artificial intelligence and has not been verified by experts. 
          Please use with caution and consider consulting additional sources for critical applications.
        </div>
      )}
    </div>
  );
}

export default AIContentFeedback; 
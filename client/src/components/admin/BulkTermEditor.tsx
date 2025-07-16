import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bot, CheckCircle, RefreshCw, Save, Wand2, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface BulkEditTerm {
  id: string;
  name: string;
  shortDefinition: string;
  definition: string;
  category: string;
  subcategory?: string;
  characteristics?: string[];
  applications?: Array<{ name: string; description: string }>;
  mathFormulation?: string;
  relatedTerms?: string[];
  aiGenerated: boolean;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  qualityScore?: number;
  selected: boolean;
  modified: boolean;
  originalData: any;
}

interface BulkOperation {
  type: 'category' | 'verification' | 'ai_improve' | 'quality_check' | 'batch_update';
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
}

interface Props {
  terms: any[];
  onTermsUpdated: () => void;
}

export function BulkTermEditor({ terms: initialTerms, onTermsUpdated }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [terms, setTerms] = useState<BulkEditTerm[]>(
    initialTerms.map(term => ({
      ...term,
      selected: false,
      modified: false,
      originalData: { ...term },
    }))
  );

  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Mutation for saving bulk changes
  const saveBulkChangesMutation = useMutation({
    mutationFn: async (updatedTerms: BulkEditTerm[]) => {
      const changes = updatedTerms
        .filter(term => term.modified)
        .map(term => ({
          id: term.id,
          name: term.name,
          shortDefinition: term.shortDefinition,
          definition: term.definition,
          category: term.category,
          subcategory: term.subcategory,
          characteristics: term.characteristics,
          applications: term.applications,
          mathFormulation: term.mathFormulation,
          relatedTerms: term.relatedTerms,
          verificationStatus: term.verificationStatus,
        }));

      const response = await fetch('/api/admin/terms/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });

      if (!response.ok) {throw new Error('Failed to save bulk changes');}
      return response.json();
    },
    onSuccess: data => {
      // Reset modified flags
      setTerms(prev =>
        prev.map(term => ({
          ...term,
          modified: false,
          originalData: { ...term },
        }))
      );

      queryClient.invalidateQueries({ queryKey: ['admin-terms'] });
      onTermsUpdated();
      toast({
        title: 'Success',
        description: `Updated ${data.updatedCount} terms successfully`,
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error?.message : 'Failed to save changes',
        variant: 'destructive',
      });
    },
  });

  // Mutation for AI improvements
  const aiImproveMutation = useMutation({
    mutationFn: async (termIds: string[]) => {
      setBulkOperationInProgress(true);
      setBulkOperation('AI Improvement');
      setProgress(0);

      const results = [];
      for (let i = 0; i < termIds.length; i++) {
        const termId = termIds[i];
        setProgress(((i + 1) / termIds.length) * 100);

        const response = await fetch(`/api/ai/improve-definition/${termId}`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ termId, improvement: data.data });
        }

        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return results;
    },
    onSuccess: results => {
      // Apply AI improvements to terms
      setTerms(prev =>
        prev.map(term => {
          const improvement = results.find(r => r.termId === term.id);
          if (improvement) {
            return {
              ...term,
              shortDefinition: improvement.improvement.shortDefinition || term.shortDefinition,
              definition: improvement.improvement.definition || term.definition,
              characteristics: improvement.improvement.characteristics || term.characteristics,
              applications: improvement.improvement.applications || term.applications,
              mathFormulation: improvement.improvement.mathFormulation || term.mathFormulation,
              modified: true,
            };
          }
          return term;
        })
      );

      setBulkOperationInProgress(false);
      setBulkOperation(null);
      setProgress(0);

      toast({
        title: 'AI Improvements Applied',
        description: `Generated improvements for ${results.length} terms. Review and save changes.`,
      });
    },
    onError: error => {
      setBulkOperationInProgress(false);
      setBulkOperation(null);
      setProgress(0);

      toast({
        title: 'Error',
        description: error instanceof Error ? error?.message : 'Failed to generate AI improvements',
        variant: 'destructive',
      });
    },
  });

  const filteredTerms = terms.filter(term => {
    const matchesSearch =
      !searchFilter ||
      term.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      term.shortDefinition.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesCategory = !categoryFilter || term.category === categoryFilter;
    const matchesStatus = !statusFilter || term.verificationStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedTerms = filteredTerms.filter(term => term.selected);
  const modifiedTerms = terms.filter(term => term.modified);

  const handleSelectAll = useCallback((checked: boolean) => {
    setTerms(prev =>
      prev.map(term => ({
        ...term,
        selected: checked,
      }))
    );
  }, []);

  const handleSelectTerm = useCallback((termId: string, checked: boolean) => {
    setTerms(prev =>
      prev.map(term => (term.id === termId ? { ...term, selected: checked } : term))
    );
  }, []);

  const handleTermChange = useCallback((termId: string, field: string, value: any) => {
    setTerms(prev =>
      prev.map(term =>
        term.id === termId
          ? {
              ...term,
              [field]: value,
              modified: true,
            }
          : term
      )
    );
  }, []);

  const handleBulkCategoryChange = useCallback(
    (category: string) => {
      const selectedIds = selectedTerms.map(term => term.id);
      setTerms(prev =>
        prev.map(term =>
          selectedIds.includes(term.id) ? { ...term, category, modified: true } : term
        )
      );

      toast({
        title: 'Bulk Update',
        description: `Category updated for ${selectedTerms.length} terms`,
      });
    },
    [selectedTerms, toast]
  );

  const handleBulkVerificationChange = useCallback(
    (status: 'verified' | 'unverified' | 'flagged') => {
      const selectedIds = selectedTerms.map(term => term.id);
      setTerms(prev =>
        prev.map(term =>
          selectedIds.includes(term.id)
            ? { ...term, verificationStatus: status, modified: true }
            : term
        )
      );

      toast({
        title: 'Bulk Update',
        description: `Verification status updated for ${selectedTerms.length} terms`,
      });
    },
    [selectedTerms, toast]
  );

  const handleAIImprovement = useCallback(() => {
    if (selectedTerms.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select terms to improve',
        variant: 'destructive',
      });
      return;
    }

    const termIds = selectedTerms.map(term => term.id);
    aiImproveMutation.mutate(termIds);
  }, [selectedTerms, aiImproveMutation, toast]);

  const handleSaveChanges = useCallback(() => {
    if (modifiedTerms.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes to save',
        variant: 'destructive',
      });
      return;
    }

    saveBulkChangesMutation.mutate(terms);
  }, [modifiedTerms, terms, saveBulkChangesMutation, toast]);

  const handleDiscardChanges = useCallback(() => {
    setTerms(prev =>
      prev.map(term => ({
        ...term.originalData,
        selected: term.selected,
        modified: false,
        originalData: term.originalData,
      }))
    );

    toast({
      title: 'Changes Discarded',
      description: 'All modifications have been reverted',
    });
  }, [toast]);

  const bulkOperations: BulkOperation[] = [
    {
      type: 'ai_improve',
      description: 'Improve with AI',
      icon: <Wand2 className="w-4 h-4" />,
      action: async () => {
        await handleAIImprovement();
      },
    },
    {
      type: 'verification',
      description: 'Mark as Verified',
      icon: <CheckCircle className="w-4 h-4" />,
      action: async () => {
        handleBulkVerificationChange('verified');
      },
    },
    {
      type: 'verification',
      description: 'Mark as Unverified',
      icon: <AlertCircle className="w-4 h-4" />,
      action: async () => {
        handleBulkVerificationChange('unverified');
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'unverified':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [...new Set(terms.map(term => term.category))].filter(Boolean);
  const statuses = ['verified', 'unverified', 'flagged'];

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Term Editor</h2>
          <p className="text-gray-600">
            Edit multiple terms efficiently with AI assistance and bulk operations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {modifiedTerms.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleDiscardChanges}
                disabled={saveBulkChangesMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Discard Changes ({modifiedTerms.length})
              </Button>
              <Button onClick={handleSaveChanges} disabled={saveBulkChangesMutation.isPending}>
                {saveBulkChangesMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes ({modifiedTerms.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress indicator for bulk operations */}
      {bulkOperationInProgress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{bulkOperation} in progress...</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Bulk Editor</TabsTrigger>
          <TabsTrigger value="operations">Bulk Operations</TabsTrigger>
          <TabsTrigger value="preview">Preview Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search Terms</Label>
                  <Input
                    id="search"
                    placeholder="Search by name or definition..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selection info and bulk actions */}
          {selectedTerms.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedTerms.length} term(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={handleBulkCategoryChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Change Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {bulkOperations.map((operation, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => operation.action()}
                        disabled={bulkOperationInProgress}
                      >
                        {operation.icon}
                        <span className="ml-2">{operation.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms table */}
          <Card>
            <CardHeader>
              <CardTitle>Terms ({filteredTerms.length})</CardTitle>
              <CardDescription>
                Click on cells to edit. Modified terms are highlighted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            selectedTerms.length === filteredTerms.length &&
                            filteredTerms.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Short Definition</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerms.map(term => (
                      <TableRow key={term.id} className={term.modified ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={term.selected}
                            onCheckedChange={checked => handleSelectTerm(term.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={term.name}
                            onChange={e => handleTermChange(term.id, 'name', e.target.value)}
                            className="border-0 bg-transparent p-0 h-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={term.shortDefinition}
                            onChange={e =>
                              handleTermChange(term.id, 'shortDefinition', e.target.value)
                            }
                            className="border-0 bg-transparent p-0 h-auto resize-none"
                            rows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={term.category}
                            onValueChange={value => handleTermChange(term.id, 'category', value)}
                          >
                            <SelectTrigger className="border-0 bg-transparent p-0 h-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={term.verificationStatus}
                            onValueChange={value =>
                              handleTermChange(term.id, 'verificationStatus', value)
                            }
                          >
                            <SelectTrigger className="border-0 bg-transparent p-0 h-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {term.aiGenerated && (
                            <Badge variant="secondary">
                              <Bot className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bulkOperations.map((operation, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    {operation.icon}
                    <span className="ml-2">{operation.description}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => operation.action()}
                    disabled={selectedTerms.length === 0 || bulkOperationInProgress}
                    className="w-full"
                  >
                    Apply to {selectedTerms.length} selected terms
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Changes ({modifiedTerms.length})</CardTitle>
              <CardDescription>Review your changes before saving</CardDescription>
            </CardHeader>
            <CardContent>
              {modifiedTerms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No pending changes</div>
              ) : (
                <div className="space-y-4">
                  {modifiedTerms.map(term => (
                    <div key={term.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{term.name}</h3>
                        <Badge variant="outline">Modified</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="font-medium">Original</Label>
                          <div className="space-y-1">
                            <div>
                              <strong>Category:</strong> {term.originalData.category}
                            </div>
                            <div>
                              <strong>Status:</strong> {term.originalData.verificationStatus}
                            </div>
                            <div>
                              <strong>Short Def:</strong> {term.originalData.shortDefinition}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="font-medium">Modified</Label>
                          <div className="space-y-1">
                            <div>
                              <strong>Category:</strong> {term.category}
                            </div>
                            <div>
                              <strong>Status:</strong> {term.verificationStatus}
                            </div>
                            <div>
                              <strong>Short Def:</strong> {term.shortDefinition}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface Term {
  id: string;
  name: string;
  shortDefinition: string;
  definition: string;
  category: string;
  subcategory?: string;
  aiGenerated: boolean;
  verificationStatus: "verified" | "unverified" | "flagged";
  qualityScore: number;
  createdAt: string;
  updatedAt: string;
  reviewCount?: number;
  averageRating?: number;
}

export default function ContentModerationDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch terms with filters
  const { data: termsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/terms", searchTerm, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(statusFilter !== "all" && { verificationStatus: statusFilter }),
        limit: "100",
      });
      const response = await fetch(`/api/admin/terms?${params}`);
      if (!response.ok) throw new Error("Failed to fetch terms");
      return response.json();
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ["/api/admin/terms/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/terms/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: showAnalytics,
  });

  // Update term mutation
  const updateTermMutation = useMutation({
    mutationFn: async (term: Partial<Term> & { id: string }) => {
      const response = await fetch("/api/admin/terms/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: [term] }),
      });
      if (!response.ok) throw new Error("Failed to update term");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/terms"] });
      toast({
        title: "Term updated",
        description: "The term has been updated successfully.",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk verify mutation
  const bulkVerifyMutation = useMutation({
    mutationFn: async ({ termIds, verified }: { termIds: string[]; verified: boolean }) => {
      const response = await fetch("/api/admin/terms/bulk-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termIds, verified }),
      });
      if (!response.ok) throw new Error("Failed to verify terms");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/terms"] });
      toast({
        title: "Terms updated",
        description: `${selectedTerms.length} terms have been updated.`,
      });
      setSelectedTerms([]);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quality analysis mutation
  const analyzeQualityMutation = useMutation({
    mutationFn: async (termIds: string[]) => {
      const response = await fetch("/api/admin/terms/quality-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termIds }),
      });
      if (!response.ok) throw new Error("Failed to analyze quality");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/terms"] });
      toast({
        title: "Quality analysis complete",
        description: `Analyzed ${data.data.length} terms.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditTerm = (term: Term) => {
    setEditingTerm(term);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingTerm) {
      updateTermMutation.mutate(editingTerm);
    }
  };

  const handleBulkVerify = (verified: boolean) => {
    if (selectedTerms.length > 0) {
      bulkVerifyMutation.mutate({ termIds: selectedTerms, verified });
    }
  };

  const handleQualityAnalysis = () => {
    if (selectedTerms.length > 0) {
      analyzeQualityMutation.mutate(selectedTerms);
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams({
      format: "csv",
      ...(categoryFilter !== "all" && { category: categoryFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
    });
    
    window.open(`/api/admin/terms/export?${params}`, "_blank");
  };

  const toggleTermSelection = (termId: string) => {
    setSelectedTerms((prev) =>
      prev.includes(termId)
        ? prev.filter((id) => id !== termId)
        : [...prev, termId]
    );
  };

  const selectAllTerms = () => {
    if (selectedTerms.length === terms.length) {
      setSelectedTerms([]);
    } else {
      setSelectedTerms(terms.map((term: Term) => term.id));
    }
  };

  const terms = termsData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {showAnalytics && analyticsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Content Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analyticsData.data.overview.totalTerms}
                </div>
                <div className="text-sm text-gray-500">Total Terms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.data.overview.verified}
                </div>
                <div className="text-sm text-gray-500">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.data.overview.aiGenerated}
                </div>
                <div className="text-sm text-gray-500">AI Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analyticsData.data.overview.avgQualityScore}%
                </div>
                <div className="text-sm text-gray-500">Avg Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Management
              </CardTitle>
              <CardDescription>
                Review, edit, and moderate glossary terms
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <BarChart className="h-4 w-4 mr-2" />
                {showAnalytics ? "Hide" : "Show"} Analytics
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Search Terms</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or definition..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Verification Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTerms.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-sm">
                {selectedTerms.length} term(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkVerify(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Verified
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkVerify(false)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Mark Unverified
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleQualityAnalysis}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Quality
                </Button>
              </div>
            </div>
          )}

          {/* Terms Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTerms.length === terms.length && terms.length > 0}
                      onCheckedChange={selectAllTerms}
                    />
                  </TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading terms...
                    </TableCell>
                  </TableRow>
                ) : terms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No terms found
                    </TableCell>
                  </TableRow>
                ) : (
                  terms.map((term: Term) => (
                    <TableRow key={term.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTerms.includes(term.id)}
                          onCheckedChange={() => toggleTermSelection(term.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{term.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {term.shortDefinition}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{term.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            term.verificationStatus === "verified"
                              ? "default"
                              : term.verificationStatus === "flagged"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {term.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div
                            className={`h-2 w-12 bg-gray-200 rounded-full overflow-hidden`}
                          >
                            <div
                              className={`h-full ${
                                term.qualityScore >= 80
                                  ? "bg-green-500"
                                  : term.qualityScore >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${term.qualityScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{term.qualityScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {term.aiGenerated ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Sparkles className="h-3 w-3" />
                            AI
                          </Badge>
                        ) : (
                          <Badge variant="outline">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(term.updatedAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTerm(term)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Term Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Term</DialogTitle>
            <DialogDescription>
              Make changes to the term details
            </DialogDescription>
          </DialogHeader>
          {editingTerm && (
            <div className="space-y-4">
              <div>
                <Label>Term Name</Label>
                <Input
                  value={editingTerm.name}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Short Definition</Label>
                <Input
                  value={editingTerm.shortDefinition}
                  onChange={(e) =>
                    setEditingTerm({
                      ...editingTerm,
                      shortDefinition: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Full Definition</Label>
                <Textarea
                  value={editingTerm.definition}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, definition: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={editingTerm.category}
                    onChange={(e) =>
                      setEditingTerm({ ...editingTerm, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Verification Status</Label>
                  <Select
                    value={editingTerm.verificationStatus}
                    onValueChange={(value: any) =>
                      setEditingTerm({
                        ...editingTerm,
                        verificationStatus: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileInput } from "@/components/ui/file-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FileSpreadsheet, CheckCircle, UploadCloud } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { IImportResult } from "@/interfaces/interfaces";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<IImportResult | null>(null);

  // Check if user is admin
  const isAdmin = user?.email === "admin@example.com";

  // Get stats about the glossary
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && isAdmin,
  });

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setImportResult(null);
    } else {
      setFile(null);
    }
  };

  // Handle Excel import
  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.termsImported} terms and ${result.categoriesImported} categories`,
        });
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/terms"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      } else {
        toast({
          title: "Import failed",
          description: result.errors?.[0] || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle clearing all data (with confirmation)
  const handleClearData = async () => {
    if (!window.confirm("Are you sure you want to clear ALL glossary data? This cannot be undone.")) {
      return;
    }

    try {
      await apiRequest("DELETE", "/api/admin/clear-data", null);
      toast({
        title: "Data cleared",
        description: "All glossary data has been cleared successfully",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries();
      setImportResult(null);
    } catch (error) {
      toast({
        title: "Error clearing data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              Please sign in to access this page.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => window.location.href = "/api/login"}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unauthorized</AlertTitle>
              <AlertDescription>
                You don't have permission to access the admin area.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="import">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Data Import</TabsTrigger>
          <TabsTrigger value="stats">Glossary Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Excel Data</CardTitle>
              <CardDescription>
                Upload an Excel file containing AI/ML terminology. 
                The file should have columns for term names, definitions, categories, and subcategories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileInput
                label="Excel File"
                accept=".xlsx,.xls"
                icon={<FileSpreadsheet className="h-5 w-5 text-primary-600" />}
                helperText="Select an Excel file (.xlsx or .xls) up to 10MB"
                onFilesSelected={handleFileSelect}
              />
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-r-transparent"></span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Import Excel Data
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={handleClearData}
                  disabled={importing || statsLoading || (stats && stats.totalTerms === 0)}
                >
                  Clear All Data
                </Button>
              </div>
              
              {importResult && (
                <Alert variant={importResult.success ? "default" : "destructive"}>
                  {importResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {importResult.success ? "Import Successful" : "Import Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {importResult.success ? (
                      <>
                        Successfully imported {importResult.termsImported} terms and {importResult.categoriesImported} categories.
                      </>
                    ) : (
                      <ul className="list-disc pl-5 mt-2">
                        {importResult.errors?.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Glossary Statistics</CardTitle>
              <CardDescription>
                Overview of the current glossary data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Terms</div>
                    <div className="text-2xl font-bold">{stats.totalTerms}</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Categories</div>
                    <div className="text-2xl font-bold">{stats.totalCategories}</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Term Views</div>
                    <div className="text-2xl font-bold">{stats.totalViews}</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg sm:col-span-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Database Last Updated</div>
                    <div className="text-lg">{stats.lastUpdated || "Never"}</div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Data</AlertTitle>
                  <AlertDescription>
                    There is no glossary data available. Upload an Excel file to get started.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

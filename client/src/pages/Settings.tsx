import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Laptop, 
  Eye, 
  EyeOff, 
  AlertCircle,
  HardDriveDownload,
  Trash2,
  CheckCircle,
  Settings as SettingsIcon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

interface UserSettings {
  preferences?: {
    emailNotifications?: boolean;
    progressTracking?: boolean;
    shareActivity?: boolean;
  };
  firstName?: string;
  lastName?: string;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Get user settings from the server
  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });
  
  // User preferences state (with defaults)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    progressTracking: true,
    shareActivity: false,
    ...settings?.preferences
  });
  
  // Function to handle preference changes
  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences((prev: typeof preferences) => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaveSuccess(false);
  };
  
  // Save preferences to the server
  const savePreferences = async () => {
    try {
      await apiRequest("PUT", "/api/settings", { preferences });
      setSaveSuccess(true);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your preferences",
        variant: "destructive",
      });
    }
  };
  
  // Export user data
  const exportUserData = async () => {
    try {
      const response = await fetch("/api/user/export", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to export data");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-ml-glossary-data.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Data exported",
        description: "Your data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was a problem exporting your data",
        variant: "destructive",
      });
    }
  };
  
  // Delete user data (with confirmation)
  const deleteUserData = async () => {
    if (!window.confirm("Are you sure you want to delete all your data? This includes your favorites, learning progress, and activity history. This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", "/api/user/data", null);
      toast({
        title: "Data deleted",
        description: "Your data has been deleted successfully",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/terms/recently-viewed"] });
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "There was a problem deleting your data",
        variant: "destructive",
      });
    }
  };
  
  // Calculate user initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((part: string) => part[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || "U";

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              Please sign in to access your settings.
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageBreadcrumb 
        items={[
          { label: "Home", href: "/" },
          { label: "Settings", isCurrentPage: true }
        ]}
        className="mb-6"
      />
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account" className="flex items-center">
            <User className="mr-2 h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <Sun className="mr-2 h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center">
            <Eye className="mr-2 h-4 w-4" /> Privacy
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  {(user as any)?.profileImageUrl && (
                    <AvatarImage 
                      src={(user as any).profileImageUrl} 
                      alt={(user as any).firstName || "User"}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-xl bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">
                    {user?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  Account information is managed through your authentication provider.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Notification & Learning Preferences</CardTitle>
              <CardDescription>
                Customize how you receive notifications and track your learning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                      </div>
                      <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive occasional emails about new terms and features
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.emailNotifications}
                      onCheckedChange={() => handlePreferenceChange('emailNotifications')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="progress-tracking" className="text-base">Progress Tracking</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Track which terms you've learned and show progress indicators
                      </p>
                    </div>
                    <Switch
                      id="progress-tracking"
                      checked={preferences.progressTracking}
                      onCheckedChange={() => handlePreferenceChange('progressTracking')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-activity" className="text-base">Share Learning Activity</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Anonymously share your learning data to improve recommendations
                      </p>
                    </div>
                    <Switch
                      id="share-activity"
                      checked={preferences.shareActivity}
                      onCheckedChange={() => handlePreferenceChange('shareActivity')}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {saveSuccess && (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Settings saved</span>
                </div>
              )}
              <Button onClick={savePreferences} disabled={settingsLoading}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the glossary looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Select your preferred theme mode
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex flex-col items-center justify-center h-24"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-8 w-8 mb-2" />
                      <span>Light</span>
                    </Button>
                    
                    <Button 
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex flex-col items-center justify-center h-24"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-8 w-8 mb-2" />
                      <span>Dark</span>
                    </Button>
                    
                    <Button 
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex flex-col items-center justify-center h-24"
                      onClick={() => setTheme("system")}
                    >
                      <Laptop className="h-8 w-8 mb-2" />
                      <span>System</span>
                    </Button>

                    <Button 
                      variant={theme === "high-contrast" ? "default" : "outline"}
                      className="flex flex-col items-center justify-center h-24"
                      onClick={() => setTheme("high-contrast")}
                    >
                      <SettingsIcon className="h-8 w-8 mb-2" />
                      <span>High Contrast</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Export Your Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Download a copy of all your data including favorites and learning progress
                  </p>
                </div>
                <Button variant="outline" onClick={exportUserData}>
                  <HardDriveDownload className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Delete Your Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Permanently delete all your data from our systems
                  </p>
                </div>
                <Button variant="destructive" onClick={deleteUserData}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Data
                </Button>
              </div>
              
              <Alert>
                <EyeOff className="h-4 w-4" />
                <AlertTitle>Privacy Statement</AlertTitle>
                <AlertDescription>
                  We only collect data necessary to provide you with features like progress tracking and recommendations. 
                  Your data is never shared with third parties.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

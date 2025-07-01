import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Edit3, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Redirect if not authenticated (this should be handled by the router, but double-check)
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please sign in to view your profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userObj = user as any;
  const initials = userObj?.firstName && userObj?.lastName 
    ? `${userObj.firstName[0]}${userObj.lastName[0]}`
    : userObj?.email?.substring(0, 2).toUpperCase() || "ML";

  const handleEdit = () => {
    setFormData({
      firstName: userObj?.firstName || "",
      lastName: userObj?.lastName || "",
      email: userObj?.email || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
    });
  };

  const handleSave = async () => {
    try {
      // This would typically make an API call to update the user profile
      // For now, we'll just show a success message
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} variant="outline">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Summary */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  {userObj?.profileImageUrl && (
                    <AvatarImage 
                      src={userObj.profileImageUrl} 
                      alt={userObj.firstName || "User"}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="mt-4">
                {userObj?.firstName && userObj?.lastName 
                  ? `${userObj.firstName} ${userObj.lastName}`
                  : userObj?.email || "User"
                }
              </CardTitle>
              <CardDescription>
                {userObj?.role && (
                  <Badge variant="secondary" className="mt-2">
                    {userObj.role}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{userObj?.email}</span>
                </div>
                {userObj?.createdAt && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(userObj.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="Enter your first name"
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        placeholder="Enter your last name"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        First Name
                      </Label>
                      <p className="mt-1 text-sm">
                        {userObj?.firstName || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Last Name
                      </Label>
                      <p className="mt-1 text-sm">
                        {userObj?.lastName || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Email Address
                    </Label>
                    <p className="mt-1 text-sm">
                      {userObj?.email || "Not provided"}
                    </p>
                  </div>
                  {userObj?.role && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Account Type
                      </Label>
                      <p className="mt-1 text-sm">
                        {userObj.role}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about new terms and updates
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium">Privacy Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage your privacy and data sharing preferences
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium">Change Password</h4>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
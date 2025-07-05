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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Mail,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt?: string;
  subscription?: {
    status: string;
    plan: string;
    expiresAt?: string;
  };
  activity?: {
    totalSearches: number;
    totalViews: number;
    lastActive?: string;
  };
}

export default function UserManagementDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);

  // Fetch users
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/users", page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User details have been updated successfully.",
      });
      setShowPromoteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch user activity
  const fetchUserActivity = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity`);
      if (!response.ok) throw new Error("Failed to fetch user activity");
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching user activity:", error);
      return null;
    }
  };

  const handlePromoteUser = async (user: User, isAdmin: boolean) => {
    setSelectedUser(user);
    setShowPromoteDialog(true);
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    
    // Fetch additional activity data
    const activity = await fetchUserActivity(user.id);
    if (activity) {
      setSelectedUser({ ...user, activity });
    }
  };

  const confirmPromoteUser = async () => {
    if (!selectedUser) return;
    
    await updateUserMutation.mutateAsync({
      userId: selectedUser.id,
      updates: {
        isAdmin: !selectedUser.isAdmin,
      },
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const users = usersData?.data || [];
  const totalPages = Math.ceil((usersData?.total || 0) / 20);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, permissions, and subscriptions
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.isAdmin && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          {user.isPremium && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                          {!user.isAdmin && !user.isPremium && (
                            <Badge variant="outline">Free</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.subscription ? (
                          <div className="text-sm">
                            <div className="font-medium capitalize">
                              {user.subscription.plan}
                            </div>
                            {user.subscription.expiresAt && (
                              <div className="text-gray-500">
                                Expires {format(new Date(user.subscription.expiresAt), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No subscription</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLoginAt
                            ? format(new Date(user.lastLoginAt), "MMM d, yyyy")
                            : "Never"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Activity className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${user.email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePromoteUser(user, !user.isAdmin)}
                            >
                              {user.isAdmin ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Make Admin
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, usersData?.total || 0)} of{" "}
                {usersData?.total || 0} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <div className="font-medium">{selectedUser.email}</div>
                </div>
                <div>
                  <Label>Name</Label>
                  <div className="font-medium">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : "Not provided"}
                  </div>
                </div>
                <div>
                  <Label>Joined</Label>
                  <div className="font-medium">
                    {format(new Date(selectedUser.createdAt), "MMMM d, yyyy")}
                  </div>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <div className="font-medium">
                    {selectedUser.lastLoginAt
                      ? format(new Date(selectedUser.lastLoginAt), "MMMM d, yyyy")
                      : "Never"}
                  </div>
                </div>
              </div>

              {selectedUser.activity && (
                <div>
                  <Label>Activity Summary</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Total Searches:</span>
                      <span className="font-medium">{selectedUser.activity.totalSearches || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Term Views:</span>
                      <span className="font-medium">{selectedUser.activity.totalViews || 0}</span>
                    </div>
                    {selectedUser.activity.lastActive && (
                      <div className="flex justify-between">
                        <span>Last Active:</span>
                        <span className="font-medium">
                          {format(new Date(selectedUser.activity.lastActive), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {selectedUser.isAdmin && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin User
                  </Badge>
                )}
                {selectedUser.isPremium && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Premium User
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Promote/Demote Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.isAdmin ? "Remove Admin Privileges" : "Grant Admin Privileges"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.isAdmin
                ? "Are you sure you want to remove admin privileges from this user?"
                : "Are you sure you want to grant admin privileges to this user?"}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="font-medium">{selectedUser.email}</div>
              <div className="text-sm text-gray-500">
                {selectedUser.firstName} {selectedUser.lastName}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPromoteUser}>
              {selectedUser?.isAdmin ? "Remove Admin" : "Make Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
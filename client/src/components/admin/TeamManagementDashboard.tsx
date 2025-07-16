import {
  Calendar,
  CheckCircle,
  Crown,
  Mail,
  MoreVertical,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: Date;
  lastActive: Date;
  permissions: string[];
}

interface TeamInvite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  sentAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

export function TeamManagementDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'settings'>('members');
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'admin' | 'member'>('member');

  // Mock data - would come from API
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      email: 'owner@company.com',
      name: 'Team Owner',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01'),
      lastActive: new Date(),
      permissions: ['all'],
    },
    {
      id: '2',
      email: 'admin@company.com',
      name: 'Team Admin',
      role: 'admin',
      status: 'active',
      joinedAt: new Date('2024-01-15'),
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      permissions: ['read', 'write', 'invite'],
    },
    {
      id: '3',
      email: 'member@company.com',
      name: 'Team Member',
      role: 'member',
      status: 'active',
      joinedAt: new Date('2024-02-01'),
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      permissions: ['read'],
    },
  ]);

  const [pendingInvites] = useState<TeamInvite[]>([
    {
      id: '1',
      email: 'newmember@company.com',
      role: 'member',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'pending',
    },
  ]);

  const handleInviteMember = () => {
    if (!newInviteEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to send an invitation.',
        variant: 'destructive',
      });
      return;
    }

    // Would make API call here
    toast({
      title: 'Invitation Sent',
      description: `Team invitation sent to ${newInviteEmail}`,
    });

    setNewInviteEmail('');
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    // Would make API call here
    toast({
      title: 'Member Removed',
      description: `${memberName} has been removed from the team.`,
    });
  };

  const handleRevokeInvite = (inviteId: string, email: string) => {
    // Would make API call here
    toast({
      title: 'Invitation Revoked',
      description: `Invitation to ${email} has been revoked.`,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage team members, roles, and permissions for your organization
          </p>
        </div>
        <Button onClick={() => setActiveTab('members')} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{teamMembers.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{pendingInvites.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending Invites</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-8">
          {[
            { key: 'members', label: 'Members', icon: Users },
            { key: 'invites', label: 'Invitations', icon: Mail },
            { key: 'settings', label: 'Settings', icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Invite New Member */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Invite New Member</span>
              </CardTitle>
              <CardDescription>
                Send an invitation to add a new team member to your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="member@company.com"
                    value={newInviteEmail}
                    onChange={e => setNewInviteEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select
                    value={newInviteRole}
                    onValueChange={(value: 'admin' | 'member') => setNewInviteRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleInviteMember} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage existing team members and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{member.joinedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {member.lastActive.toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              disabled={member.role === 'owner'}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'invites' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Manage pending team invitations and resend if needed</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvites.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No pending invitations
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All team invitations have been accepted or expired.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map(invite => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(invite.role)}
                          <span className="capitalize">{invite.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>{invite.sentAt.toLocaleDateString()}</TableCell>
                      <TableCell>{invite.expiresAt.toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(invite.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleRevokeInvite(invite.id, invite.email)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Revoke Invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Configure team-wide settings and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Default Role for New Members</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    The default role assigned to new team members when they accept invitations
                  </p>
                  <Select defaultValue="member">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-medium">Invitation Expiry</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    How long team invitations remain valid before expiring
                  </p>
                  <Select defaultValue="7">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TeamManagementDashboard;

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserList } from "@/components/UserList";
import { UserDetailModal } from "@/components/UserDetailModal";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_kyc_verified: boolean;
  is_email_verified: boolean;
  blockchain_address: string | null;
  tourist_id_token: string | null;
  tourist_id_transaction_hash: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total_users: number;
  by_role: {
    admin: number;
    tourist: number;
    guide: number;
    super_admin: number;
  };
  by_verification: {
    verified: number;
    unverified: number;
  };
  by_status: {
    active: number;
    inactive: number;
  };
  blockchain_ids_issued: number;
}

export default function UserManagementPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<string>("all");

  const { authenticatedFetch } = useAuthenticatedFetch();
  const { status: sessionStatus } = useSession();

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch("/api/users/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
      toast.error("Failed to load user statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchStats();
    }
  }, [sessionStatus, refreshTrigger]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading || sessionStatus === "loading") {
    return <div className="p-6">Loading user management...</div>;
  }

  if (sessionStatus === "unauthenticated") {
    return <div className="p-6">Please log in to access user management.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage tourist registrations and issue blockchain-based tourist
              IDs (KYC verification happens automatically)
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <div className="text-xs text-muted-foreground mt-2">
                <span className="text-green-600">
                  {stats.by_role.tourist} Tourists
                </span>{" "}
                •
                <span className="text-blue-600 ml-1">
                  {stats.by_role.guide} Guides
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.by_verification.verified}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.by_verification.unverified} without blockchain ID
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.by_status.active}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.by_status.inactive} inactive
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <Select value={currentFilter} onValueChange={setCurrentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active Users</SelectItem>
              <SelectItem value="inactive">Inactive Users</SelectItem>
              <SelectItem value="tourist">Tourists Only</SelectItem>
              <SelectItem value="guide">Guides Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <UserList
        onUserSelect={handleUserSelect}
        filter={currentFilter}
        key={refreshTrigger}
      />

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}

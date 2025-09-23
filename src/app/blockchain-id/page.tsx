"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Shield, User, AlertCircle, IdCard, Search, Clock } from "lucide-react";

interface Itinerary {
  id: number;
  user_id: number;
  itinerary_type: string;
  title: string;
  description: string;
  destination_city: string;
  destination_state: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  total_duration_days: number;
  estimated_budget: number;
  number_of_travelers: number;
  purpose_of_visit: string;
  status: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  preferred_language: string;
  special_requirements: string;
  created_at: number;
  updated_at: number;
  submitted_at: number | null;
  approved_at: number | null;
}

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
  itineraries?: Itinerary[];
}

interface BlockchainIDForm {
  itinerary_id: number | null;
  validity_days: number;
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

export default function BlockchainIDIssuancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<BlockchainIDForm>({
    itinerary_id: null,
    validity_days: 30,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingItineraries, setLoadingItineraries] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();
  const { status: sessionStatus } = useSession();

  const fetchUserStats = async () => {
    try {
      const response = await authenticatedFetch("/api/users/stats");
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const fetchEligibleUsers = async () => {
    try {
      setLoading(true);

      // Fetch verified users who don't have blockchain IDs
      const response = await authenticatedFetch(
        "/api/users/list?is_verified_filter=true&limit=100"
      );

      if (response.ok) {
        const data = await response.json();
        // Filter users who don't have blockchain IDs yet
        const eligibleUsers = (data.users || []).filter(
          (user: User) => !user.blockchain_address && !user.tourist_id_token
        );
        setUsers(eligibleUsers);
      }
    } catch (error) {
      console.error("Error fetching eligible users:", error);
      toast.error("Failed to load eligible users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchUserStats();
      fetchEligibleUsers();
    }
  }, [sessionStatus]);

  const handleIssueBlockchainID = async (user: User) => {
    setSelectedUser(user);
    setFormData({
      itinerary_id: null,
      validity_days: 30,
    });
    setIsModalOpen(true);

    // Fetch user itineraries if not already loaded
    if (!user.itineraries) {
      setLoadingItineraries(true);
      try {
        const response = await authenticatedFetch(
          `/api/users/${user.id}/itineraries`
        );

        if (response.ok) {
          const itineraries = await response.json();
          const updatedUser = { ...user, itineraries };
          setSelectedUser(updatedUser);

          // Also update the user in the users list
          setUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === user.id ? updatedUser : u))
          );
        } else {
          toast.error("Failed to load user itineraries");
        }
      } catch (error) {
        console.error("Error fetching user itineraries:", error);
        toast.error("Failed to load user itineraries");
      } finally {
        setLoadingItineraries(false);
      }
    }
  };

  const handleSubmitBlockchainID = async () => {
    if (!selectedUser || !formData.itinerary_id) {
      toast.error("Please select an itinerary");
      return;
    }

    try {
      setIsSubmitting(true);

      const requestBody = {
        ...formData,
        user_id: selectedUser.id,
      };

      const response = await authenticatedFetch(
        `/api/users/${selectedUser.id}/blockchain-id`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success("Blockchain ID issued successfully!");

        // Show blockchain details
        if (result.blockchain_address) {
          toast.success(`Address: ${result.blockchain_address}`, {
            duration: 10000,
          });
        }

        // Show transaction link if available
        if (result.tourist_id_transaction_hash) {
          const txHash = result.tourist_id_transaction_hash.startsWith("0x")
            ? result.tourist_id_transaction_hash
            : "0x" + result.tourist_id_transaction_hash;
          toast.success(
            `Transaction: https://amoy.polygonscan.com/tx/${txHash}`,
            {
              duration: 15000,
            }
          );
        }

        setIsModalOpen(false);
        setSelectedUser(null);
        fetchUserStats(); // Refresh stats
        fetchEligibleUsers(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to issue blockchain ID");
      }
    } catch (error) {
      console.error("Error issuing blockchain ID:", error);
      toast.error("Failed to issue blockchain ID");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading || sessionStatus === "loading") {
    return <div className="p-6">Loading eligible users...</div>;
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="p-6">Please log in to access blockchain ID issuance.</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blockchain ID Issuance</h1>
          <p className="text-muted-foreground">
            Issue blockchain IDs to verified users with active itineraries
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_users || "..."}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.by_verification.verified || 0} verified,{" "}
              {stats?.by_verification.unverified || 0} unverified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Blockchain IDs Issued
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.blockchain_ids_issued || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total IDs created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eligible Users
            </CardTitle>
            <IdCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Verified users without blockchain IDs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ready to Issue
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredUsers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              After applying search filters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Eligible Users for Blockchain ID</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.is_kyc_verified && (
                            <Badge className="bg-green-100 text-green-800">
                              KYC Verified
                            </Badge>
                          )}
                          {user.is_email_verified && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Email Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleIssueBlockchainID(user)}>
                          <Shield className="w-4 h-4 mr-2" />
                          Issue Blockchain ID
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Issue Blockchain ID Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Issue Blockchain ID</span>
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">User Information</h4>
                <p>
                  <strong>Name:</strong> {selectedUser.first_name}{" "}
                  {selectedUser.last_name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p>
                  <strong>User ID:</strong> {selectedUser.id}
                </p>
              </div>

              {/* Itinerary ID Input */}
              {/* Itinerary Selection */}
              <div className="space-y-2">
                <Label htmlFor="itinerary">Select Itinerary</Label>
                {loadingItineraries ? (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading itineraries...
                    </span>
                  </div>
                ) : selectedUser.itineraries &&
                  selectedUser.itineraries.length > 0 ? (
                  <Select
                    value={formData.itinerary_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        itinerary_id: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an active itinerary" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedUser.itineraries
                        ?.filter((it) => it.status === "active")
                        .map((itinerary) => (
                          <SelectItem
                            key={itinerary.id}
                            value={itinerary.id.toString()}
                          >
                            <div>
                              <p className="font-medium">{itinerary.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  itinerary.start_date
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {new Date(
                                  itinerary.end_date
                                ).toLocaleDateString()}{" "}
                                ({itinerary.total_duration_days} days)
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">No active itineraries found</p>
                    <p className="text-sm">
                      This user doesn't have any active itineraries yet.
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Select an active itinerary to link with the blockchain ID.
                </p>
              </div>
              {/* Validity Period */}
              <div className="space-y-2">
                <Label htmlFor="validity">Validity Period (Days)</Label>
                <Input
                  id="validity"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.validity_days}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validity_days: parseInt(e.target.value) || 30,
                    }))
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Number of days the blockchain ID will be valid
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <h4 className="font-semibold mb-1">
                      Blockchain ID Issuance Process
                    </h4>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • Verify the user has an active itinerary before issuing
                      </li>
                      <li>
                        • Enter the exact itinerary ID from the itineraries
                        management section
                      </li>
                      <li>
                        • Once issued, the ID cannot be revoked or modified
                      </li>
                      <li>• The user will receive their tourist ID token</li>
                      <li>
                        • The blockchain address will be generated automatically
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitBlockchainID}
                  disabled={isSubmitting || !formData.itinerary_id}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Issuing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Issue Blockchain ID
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

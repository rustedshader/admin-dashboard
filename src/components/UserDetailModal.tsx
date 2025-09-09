"use client";

import { useState } from "react";
import { useAuthenticatedFetch, useSessionValidation } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  User,
  Settings,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onUserUpdate,
}: UserDetailModalProps) {
  const { authenticatedFetch } = useAuthenticatedFetch();
  useSessionValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!user) return null;

  const handleVerifyUser = async () => {
    setActionLoading("verify");
    try {
      const response = await authenticatedFetch(
        `/api/users/${user.id}/verify`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("User verified successfully");
        onUserUpdate();
        onClose();
      } else {
        toast.error("Failed to verify user");
      }
    } catch (error) {
      toast.error("Error verifying user");
      console.error("Verification error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssueBlockchainId = async () => {
    setActionLoading("blockchain");
    try {
      const response = await authenticatedFetch(
        `/api/users/${user.id}/blockchain-id`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Blockchain ID issued successfully");
        onUserUpdate();
        onClose();
      } else {
        toast.error("Failed to issue blockchain ID");
      }
    } catch (error) {
      toast.error("Error issuing blockchain ID");
      console.error("Blockchain ID error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async () => {
    setActionLoading("status");
    try {
      const response = await authenticatedFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !user.is_active,
        }),
      });

      if (response.ok) {
        toast.success(
          `User ${user.is_active ? "blocked" : "activated"} successfully`
        );
        onUserUpdate();
        onClose();
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      toast.error("Error updating user status");
      console.error("Status update error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Blocked
        </Badge>
      );
    }
    if (user.is_kyc_verified) {
      return (
        <Badge variant="default">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>
              User Details - {user.first_name} {user.last_name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Overview</span>
                {getStatusBadge(user)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                    {user.is_email_verified ? (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Role:</span>
                    <Badge
                      variant={
                        user.role.toLowerCase() === "admin"
                          ? "default"
                          : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                    <span className="text-sm">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Updated:</span>
                    <span className="text-sm">
                      {formatDate(user.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">User ID:</span>
                    <span className="text-sm font-mono">{user.id}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="verification" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain ID</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="verification" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>KYC Verification Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {user.is_kyc_verified ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-yellow-600" />
                        )}
                        <div>
                          <h4 className="font-medium">
                            {user.is_kyc_verified
                              ? "KYC Verified"
                              : "KYC Pending"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {user.is_kyc_verified
                              ? "User has completed KYC verification"
                              : "User KYC verification is pending admin approval"}
                          </p>
                        </div>
                      </div>
                      {!user.is_kyc_verified && (
                        <Button
                          onClick={handleVerifyUser}
                          disabled={actionLoading === "verify"}
                        >
                          {actionLoading === "verify" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Verify User
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {user.is_email_verified ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                        <div>
                          <h4 className="font-medium">
                            {user.is_email_verified
                              ? "Email Verified"
                              : "Email Not Verified"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Email verification status
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blockchain" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Blockchain Identity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {user.blockchain_address ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {user.blockchain_address
                              ? "Blockchain ID Issued"
                              : "No Blockchain ID"}
                          </h4>
                          {user.blockchain_address ? (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Address:</span>
                              </p>
                              <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                                {user.blockchain_address}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Tourist blockchain ID has not been issued
                            </p>
                          )}
                        </div>
                      </div>
                      {!user.blockchain_address && user.is_kyc_verified && (
                        <Button
                          onClick={handleIssueBlockchainId}
                          disabled={actionLoading === "blockchain"}
                        >
                          {actionLoading === "blockchain" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Issue ID
                        </Button>
                      )}
                    </div>

                    {user.tourist_id_token && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Tourist ID Token</h4>
                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                          {user.tourist_id_token}
                        </p>
                      </div>
                    )}

                    {user.tourist_id_transaction_hash && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Transaction Hash</h4>
                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                          {user.tourist_id_transaction_hash}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>User Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Account Status</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.is_active
                            ? "Account is active"
                            : "Account is blocked"}
                        </p>
                      </div>
                      <Button
                        variant={user.is_active ? "destructive" : "default"}
                        onClick={handleToggleUserStatus}
                        disabled={actionLoading === "status"}
                      >
                        {actionLoading === "status" && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {user.is_active ? "Block User" : "Activate User"}
                      </Button>
                    </div>

                    {!user.is_kyc_verified && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Manual Verification</h4>
                          <p className="text-sm text-muted-foreground">
                            Manually verify user's KYC documents
                          </p>
                        </div>
                        <Button
                          onClick={handleVerifyUser}
                          disabled={actionLoading === "verify"}
                        >
                          {actionLoading === "verify" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Verify KYC
                        </Button>
                      </div>
                    )}

                    {user.is_kyc_verified && !user.blockchain_address && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Issue Tourist ID</h4>
                          <p className="text-sm text-muted-foreground">
                            Issue blockchain-based tourist identification
                          </p>
                        </div>
                        <Button
                          onClick={handleIssueBlockchainId}
                          disabled={actionLoading === "blockchain"}
                        >
                          {actionLoading === "blockchain" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Issue Blockchain ID
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

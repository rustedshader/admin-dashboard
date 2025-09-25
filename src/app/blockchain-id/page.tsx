"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Shield,
  User,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  TrendingUp,
  Eye,
  Filter,
} from "lucide-react";

// Types based on OpenAPI specification
interface BlockchainApplication {
  id: number;
  application_number: string;
  user_id: number;
  itinerary_id: number;
  status: "pending" | "issued" | "rejected";
  applied_at: string;
  issued_at?: string | null;
  rejected_at?: string | null;
  processed_by_admin?: number | null;
  admin_notes?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
}

interface BlockchainStatistics {
  total_applications: number;
  pending_applications: number;
  issued_ids: number;
  rejected_applications: number;
  applications_today: number;
  issued_today: number;
}

interface ApplicationListResponse {
  applications: BlockchainApplication[];
  total_count: number;
  page: number;
  page_size: number;
}

interface SearchQuery {
  query?: string;
  status?: "pending" | "issued" | "rejected";
  date_from?: string;
  date_to?: string;
}

interface IssueRequest {
  application_id: number;
  validity_days: number;
  admin_notes?: string;
}

export default function BlockchainIDManagement() {
  const [applications, setApplications] = useState<BlockchainApplication[]>([]);
  const [statistics, setStatistics] = useState<BlockchainStatistics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedApplication, setSelectedApplication] =
    useState<BlockchainApplication | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    validity_days: 365,
    admin_notes: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { authenticatedFetch } = useAuthenticatedFetch();
  const { status: sessionStatus } = useSession();

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await authenticatedFetch(
        "/api/blockchain-id/statistics"
      );
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Fetch applications
  const fetchApplications = async (page = 1, status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "20",
      });

      if (status && status !== "all") {
        params.append("status", status);
      }

      const response = await authenticatedFetch(
        `/api/blockchain-id/applications?${params}`
      );
      if (response.ok) {
        const data: ApplicationListResponse = await response.json();
        setApplications(data.applications);
        setTotalPages(Math.ceil(data.total_count / data.page_size));
      } else {
        toast.error("Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  // Search applications
  const searchApplications = async (query: SearchQuery, page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "20",
      });

      const response = await authenticatedFetch(
        `/api/blockchain-id/applications/search?${params}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
        }
      );

      if (response.ok) {
        const data: ApplicationListResponse = await response.json();
        setApplications(data.applications);
        setTotalPages(Math.ceil(data.total_count / data.page_size));
      } else {
        toast.error("Failed to search applications");
      }
    } catch (error) {
      console.error("Error searching applications:", error);
      toast.error("Failed to search applications");
    } finally {
      setLoading(false);
    }
  };

  // Issue blockchain ID
  const handleIssueID = async () => {
    if (!selectedApplication) return;

    try {
      setIsSubmitting(true);
      const response = await authenticatedFetch(
        `/api/blockchain-id/applications/${selectedApplication.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            application_id: selectedApplication.id,
            validity_days: issueForm.validity_days,
            admin_notes: issueForm.admin_notes,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Blockchain ID issued successfully!");
        setIsIssueModalOpen(false);
        setSelectedApplication(null);
        fetchApplications(
          currentPage,
          statusFilter === "all" ? undefined : statusFilter
        );
        fetchStatistics();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to issue blockchain ID");
      }
    } catch (error) {
      console.error("Error issuing blockchain ID:", error);
      toast.error("Failed to issue blockchain ID");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject application
  const handleRejectApplication = async () => {
    if (!selectedApplication || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setIsSubmitting(true);
      const params = new URLSearchParams({
        admin_notes: rejectReason,
      });

      const response = await authenticatedFetch(
        `/api/blockchain-id/applications/${selectedApplication.id}?${params}`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Application rejected successfully!");
        setIsRejectModalOpen(false);
        setSelectedApplication(null);
        setRejectReason("");
        fetchApplications(
          currentPage,
          statusFilter === "all" ? undefined : statusFilter
        );
        fetchStatistics();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to reject application");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (
      searchQuery.query ||
      searchQuery.status ||
      searchQuery.date_from ||
      searchQuery.date_to
    ) {
      searchApplications(searchQuery, 1);
      setCurrentPage(1);
    } else {
      fetchApplications(1, statusFilter === "all" ? undefined : statusFilter);
      setCurrentPage(1);
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    if (searchQuery.query || searchQuery.date_from || searchQuery.date_to) {
      searchApplications(
        {
          ...searchQuery,
          status: status === "all" ? undefined : (status as any),
        },
        1
      );
    } else {
      fetchApplications(1, status === "all" ? undefined : status);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "issued":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Issued
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchStatistics();
      fetchApplications();
    }
  }, [sessionStatus]);

  if (loading && applications.length === 0) {
    return <div className="p-6">Loading blockchain ID applications...</div>;
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="p-6">
        Please log in to access blockchain ID management.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blockchain ID Management</h1>
          <p className="text-muted-foreground">
            Manage blockchain ID applications and issuance
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.total_applications}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.pending_applications}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issued IDs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.issued_ids}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.rejected_applications}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applied Today
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.applications_today}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Issued Today
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.issued_today}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search Applications</Label>
              <Input
                id="search"
                placeholder="Search by application number, user info..."
                value={searchQuery.query || ""}
                onChange={(e) =>
                  setSearchQuery((prev) => ({ ...prev, query: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_from">From Date</Label>
              <Input
                id="date_from"
                type="date"
                value={searchQuery.date_from || ""}
                onChange={(e) =>
                  setSearchQuery((prev) => ({
                    ...prev,
                    date_from: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="date_to">To Date</Label>
              <Input
                id="date_to"
                type="date"
                value={searchQuery.date_to || ""}
                onChange={(e) =>
                  setSearchQuery((prev) => ({
                    ...prev,
                    date_to: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain ID Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application #</TableHead>
                  <TableHead>User Details</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {application.application_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {application.user_name || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {application.user_email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {application.user_phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(application.applied_at)}</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      {application.issued_at &&
                        formatDate(application.issued_at)}
                      {application.rejected_at &&
                        formatDate(application.rejected_at)}
                      {!application.issued_at &&
                        !application.rejected_at &&
                        "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {application.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(application);
                                setIsIssueModalOpen(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Issue
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedApplication(application);
                                setIsRejectModalOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {application.admin_notes && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast.info(application.admin_notes, {
                                duration: 5000,
                              });
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => {
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  if (
                    searchQuery.query ||
                    searchQuery.date_from ||
                    searchQuery.date_to
                  ) {
                    searchApplications(searchQuery, newPage);
                  } else {
                    fetchApplications(
                      newPage,
                      statusFilter === "all" ? undefined : statusFilter
                    );
                  }
                }}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  if (
                    searchQuery.query ||
                    searchQuery.date_from ||
                    searchQuery.date_to
                  ) {
                    searchApplications(searchQuery, newPage);
                  } else {
                    fetchApplications(
                      newPage,
                      statusFilter === "all" ? undefined : statusFilter
                    );
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue ID Modal */}
      <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Blockchain ID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApplication && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Application Details</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Application #:</span>{" "}
                    {selectedApplication.application_number}
                  </div>
                  <div>
                    <span className="font-medium">User:</span>{" "}
                    {selectedApplication.user_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedApplication.user_email}
                  </div>
                  <div>
                    <span className="font-medium">Applied:</span>{" "}
                    {formatDate(selectedApplication.applied_at)}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="validity_days">Validity (Days)</Label>
              <Input
                id="validity_days"
                type="number"
                min="1"
                max="3650"
                value={issueForm.validity_days}
                onChange={(e) =>
                  setIssueForm((prev) => ({
                    ...prev,
                    validity_days: parseInt(e.target.value) || 365,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin_notes"
                placeholder="Add any notes for this issuance..."
                value={issueForm.admin_notes}
                onChange={(e) =>
                  setIssueForm((prev) => ({
                    ...prev,
                    admin_notes: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsIssueModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleIssueID} disabled={isSubmitting}>
              {isSubmitting ? "Issuing..." : "Issue Blockchain ID"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Application Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApplication && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Application Details</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Application #:</span>{" "}
                    {selectedApplication.application_number}
                  </div>
                  <div>
                    <span className="font-medium">User:</span>{" "}
                    {selectedApplication.user_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedApplication.user_email}
                  </div>
                  <div>
                    <span className="font-medium">Applied:</span>{" "}
                    {formatDate(selectedApplication.applied_at)}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reject_reason">Reason for Rejection *</Label>
              <Textarea
                id="reject_reason"
                placeholder="Please provide a detailed reason for rejecting this application..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectApplication}
              disabled={isSubmitting || !rejectReason.trim()}
            >
              {isSubmitting ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

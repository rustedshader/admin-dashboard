"use client";

import { useState } from "react";
import { UserList } from "@/components/UserList";
import { UserDetailModal } from "@/components/UserDetailModal";

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

export default function UserManagementPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    // Trigger a refresh of the user list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage tourist registrations, verify KYC documents, and issue
          blockchain-based tourist IDs
        </p>
      </div>

      <UserList
        onUserSelect={handleUserSelect}
        key={refreshTrigger} // Force re-render when data changes
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

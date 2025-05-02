import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Assuming shadcn/ui

interface DeleteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your entire tenant account and remove all associated data from our servers.
            This includes:
            <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
              <li>All user accounts within the tenant</li>
              <li>All tickets and related data</li>
              <li>All service catalog configurations (categories, services, forms)</li>
              <li>All portal and branding settings</li>
              <li>All other tenant-specific data</li>
            </ul>
            <strong className="mt-4 block text-red-600">You will lose access immediately upon confirmation.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-red-600 hover:bg-red-700 text-white" // Destructive styling
          >
            Yes, Delete My Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTenantModal;

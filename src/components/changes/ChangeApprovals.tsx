import React, { useState, useEffect } from 'react';
import { Change } from '../../types/database';
import { Button } from '../ui/Button';
import { getButtonColorClass } from '../ui/ButtonVariants';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { 
  getChangeApprovals, 
  createChangeApproval, 
  updateChangeApproval 
} from '../../services/changeService';
import { fetchUsers } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface ChangeApprovalsProps {
  change: Change;
  canEdit: boolean;
  onRefresh: () => void;
}

interface Approval {
  id: string;
  change_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  created_at: string;
  updated_at: string;
}

const ChangeApprovals: React.FC<ChangeApprovalsProps> = ({
  change,
  canEdit,
  onRefresh
}) => {
  const { userDetails } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if current user is an approver
  const userApproval = approvals.find(approval => approval.approver_id === userDetails?.id);
  // Use the canEdit prop passed from parent component
  const canApprove = canEdit && 
                     change.status === 'approval' && 
                     (!userApproval || userApproval.status === 'pending');
  
  useEffect(() => {
    fetchApprovals();
  }, [change.id]);
  
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [approvalsData, usersData] = await Promise.all([
        getChangeApprovals(change.id),
        userDetails?.tenant_id ? fetchUsers(userDetails.tenant_id) : []
      ]);
      
      setApprovals(approvalsData);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching approvals:', err);
      setError(err.message || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async () => {
    if (!userDetails?.id) return;
    
    try {
      setIsSubmitting(true);
      
      if (userApproval) {
        // Update existing approval
        await updateChangeApproval(userApproval.id, {
          status: 'approved',
          comments: comment || null
        });
      } else {
        // Create new approval
        await createChangeApproval({
          change_id: change.id,
          approver_id: userDetails.id,
          status: 'approved',
          comments: comment || null
        });
      }
      
      // Refresh approvals and change
      await fetchApprovals();
      onRefresh();
      setComment('');
    } catch (err: any) {
      console.error('Error approving change:', err);
      setError(err.message || 'Failed to approve change');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReject = async () => {
    if (!userDetails?.id) return;
    
    try {
      setIsSubmitting(true);
      
      if (userApproval) {
        // Update existing approval
        await updateChangeApproval(userApproval.id, {
          status: 'rejected',
          comments: comment || null
        });
      } else {
        // Create new approval
        await createChangeApproval({
          change_id: change.id,
          approver_id: userDetails.id,
          status: 'rejected',
          comments: comment || null
        });
      }
      
      // Refresh approvals and change
      await fetchApprovals();
      onRefresh();
      setComment('');
    } catch (err: any) {
      console.error('Error rejecting change:', err);
      setError(err.message || 'Failed to reject change');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Approval Status */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Approval Status</h3>
        </div>
        <div className="p-6">
          {change.status !== 'approval' && change.status !== 'scheduled' && 
           change.status !== 'implementation' && change.status !== 'review' && 
           change.status !== 'closed' ? (
            <p className="text-gray-500">
              This change is not yet in the approval stage. Current status: <span className="font-medium capitalize">{change.status.replace('_', ' ')}</span>
            </p>
          ) : approvals.length === 0 ? (
            <p className="text-gray-500">No approvals have been requested yet.</p>
          ) : (
            <div className="space-y-6">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approver
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvals.map(approval => {
                      const approver = users.find(user => user.id === approval.approver_id);
                      return (
                        <tr key={approval.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {approver ? `${approver.first_name} ${approver.last_name}` : 'Unknown User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: getStatusBadgeColor(approval.status).split(' ')[0],
                                color: getStatusBadgeColor(approval.status).split(' ')[1]
                              }}
                            >
                              {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(approval.updated_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {approval.comments || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Approval Actions */}
      {canApprove && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Your Approval</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Comments (optional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Add any comments about your decision"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className={`mr-2 ${getButtonColorClass('success')}`}
                >
                  {isSubmitting ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                  )}
                  Approve
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className={`mr-2 ${getButtonColorClass('danger')}`}
                >
                  {isSubmitting ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <XCircleIcon className="h-5 w-5 mr-1" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeApprovals;

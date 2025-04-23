import React, { useState, useEffect } from 'react';
import { getTicketComments, createTicketComment, updateTicketComment, deleteTicketComment } from '../../services/commentService';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { TicketComment } from '../../types/database';

interface TicketCommentsProps {
  ticketId: string;
}

interface CommentWithUser extends TicketComment {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

const TicketComments: React.FC<TicketCommentsProps> = ({ ticketId }) => {
  const { userDetails } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInternalComments, setShowInternalComments] = useState(true);
  const [showInvisibleComments, setShowInvisibleComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  // Check if user can see internal comments
  const canViewInternal = userDetails && (
    userDetails.role === 'admin' ||
    userDetails.role === 'manager' ||
    userDetails.role === 'technician'
  );

  // Check if user can manage comments
  const canManageComments = userDetails && (
    userDetails.role === 'admin' ||
    userDetails.role === 'manager'
  );

  useEffect(() => {
    if (ticketId) {
      fetchComments();
    }
  }, [ticketId, showInternalComments, showInvisibleComments]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { comments } = await getTicketComments(ticketId, {
        includeInternal: showInternalComments,
        includeInvisible: showInvisibleComments,
      });
      // Cast the comments to CommentWithUser[] as we know the API returns the user data
      setComments(comments as unknown as CommentWithUser[]);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const comment = await createTicketComment({
        ticket_id: ticketId,
        content: newComment,
        is_internal: isInternal,
        is_visible: isVisible,
      });
      
      setComments(prev => [comment as unknown as CommentWithUser, ...prev]);
      setNewComment('');
      setIsInternal(false);
      setIsVisible(true);
    } catch (err: any) {
      console.error('Error creating comment:', err);
      setError(err.message || 'Failed to create comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: CommentWithUser) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
    setIsInternal(comment.is_internal);
    setIsVisible(comment.is_visible);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editedContent.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedComment = await updateTicketComment(commentId, {
        content: editedContent,
        is_internal: isInternal,
        is_visible: isVisible,
      });
      
      setComments(prev => prev.map(c => 
        c.id === commentId ? updatedComment as unknown as CommentWithUser : c
      ));
      setEditingCommentId(null);
    } catch (err: any) {
      console.error('Error updating comment:', err);
      setError(err.message || 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await deleteTicketComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError(err.message || 'Failed to delete comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatUserName = (user: CommentWithUser['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  return (
    <div className="space-y-4 border-t-2 border-primary pt-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Comments & Work Notes</h3>
        {canViewInternal && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showInternalComments}
                onChange={(e) => setShowInternalComments(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Show internal comments</span>
            </label>
            {canManageComments && (
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInvisibleComments}
                  onChange={(e) => setShowInvisibleComments(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Show invisible comments</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="bg-white p-4 rounded-md border border-gray-200">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4">
            {canViewInternal && (
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Internal comment</span>
              </label>
            )}
            {canManageComments && (
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Visible</span>
              </label>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className={`p-4 rounded-md border ${
                comment.is_internal ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
              } ${!comment.is_visible ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      {formatUserName(comment.user).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {formatUserName(comment.user)}
                      {comment.is_internal && (
                        <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          Internal
                        </span>
                      )}
                      {!comment.is_visible && (
                        <span className="ml-2 text-xs font-normal text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                      {comment.created_at !== comment.updated_at && ' (edited)'}
                    </p>
                  </div>
                </div>
                
                {/* Edit/Delete buttons */}
                {(userDetails?.id === comment.user.id || canManageComments) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditComment(comment)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              {/* Comment content */}
              {editingCommentId === comment.id ? (
                <div className="mt-3">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-4">
                      {canViewInternal && (
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>Internal</span>
                        </label>
                      )}
                      {canManageComments && (
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(e) => setIsVisible(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>Visible</span>
                        </label>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={isSubmitting || !editedContent.trim()}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-center py-4 text-gray-500">No comments yet</p>
        )}
      </div>
    </div>
  );
};

export default TicketComments;

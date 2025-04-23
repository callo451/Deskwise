import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getKnowledgeBaseArticleById, 
  recordArticleView, 
  submitArticleFeedback,
  getLinkedTickets
} from '../services/knowledgeBaseService';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  UserIcon, 
  FolderIcon, 
  TagIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  TicketIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

const KnowledgeBaseArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  
  const [article, setArticle] = useState<any | null>(null);
  const [linkedTickets, setLinkedTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);
  
  const fetchArticle = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const articleData = await getKnowledgeBaseArticleById(id);
      setArticle(articleData);
      
      // Record view
      await recordArticleView(id);
      
      // Get linked tickets if user is technician or above
      if (userDetails && ['technician', 'manager', 'admin'].includes(userDetails.role)) {
        const tickets = await getLinkedTickets(id);
        setLinkedTickets(tickets);
      }
    } catch (err: any) {
      console.error('Error fetching article:', err);
      setError(err.message || 'Failed to fetch article');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFeedback = async (helpful: boolean) => {
    if (!id) return;
    
    try {
      await submitArticleFeedback(id, { helpful });
      setFeedbackSubmitted(true);
      
      if (!helpful) {
        setShowCommentForm(true);
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
    }
  };
  
  const submitComment = async () => {
    if (!id || !feedbackComment.trim()) return;
    
    try {
      await submitArticleFeedback(id, { helpful: false, comment: feedbackComment });
      setFeedbackComment('');
      setShowCommentForm(false);
    } catch (err: any) {
      console.error('Error submitting feedback comment:', err);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Article not found'}
        </div>
        <div className="mt-4">
          <Link to="/knowledge-base" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/knowledge-base" className="text-blue-600 hover:text-blue-800 flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Knowledge Base
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{article.title}</h1>
            
            {userDetails && ['technician', 'manager', 'admin'].includes(userDetails.role) && (
              <Link to={`/knowledge-base/edit/${article.id}`}>
                <Button variant="outline" size="sm" className="flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6 gap-4">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>Updated {formatDate(article.updated_at)}</span>
            </div>
            
            {article.created_by_user && (
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                <span>
                  {article.created_by_user.first_name} {article.created_by_user.last_name}
                </span>
              </div>
            )}
            
            {article.category && (
              <div className="flex items-center">
                <FolderIcon className="h-4 w-4 mr-1" />
                <span>{article.category.name}</span>
              </div>
            )}
            
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 mr-1" />
                <span>{article.tags.join(', ')}</span>
              </div>
            )}
          </div>
          
          <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: article.content }} />
          
          {linkedTickets.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Related Tickets</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="divide-y divide-gray-200">
                  {linkedTickets.map(ticket => (
                    <li key={ticket.id} className="py-3">
                      <Link 
                        to={`/tickets/${ticket.id}`}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <TicketIcon className="h-5 w-5 mr-2" />
                        <span className="font-medium">{ticket.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Was this article helpful?</h3>
            
            {feedbackSubmitted ? (
              <div className="bg-green-50 text-green-700 p-3 rounded-md">
                Thank you for your feedback!
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => handleFeedback(true)}
                >
                  <HandThumbUpIcon className="h-5 w-5 mr-2" />
                  Yes, it helped
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => handleFeedback(false)}
                >
                  <HandThumbDownIcon className="h-5 w-5 mr-2" />
                  No, it didn't help
                </Button>
              </div>
            )}
            
            {showCommentForm && (
              <div className="mt-4">
                <label htmlFor="feedback-comment" className="block text-sm font-medium text-gray-700 mb-1">
                  How can we improve this article?
                </label>
                <textarea
                  id="feedback-comment"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 text-sm"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Please provide your suggestions..."
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <Button size="sm" onClick={submitComment}>Submit Feedback</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseArticlePage;

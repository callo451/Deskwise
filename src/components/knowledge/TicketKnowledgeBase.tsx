import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  searchKnowledgeBase, 
  getLinkedArticles, 
  linkArticleToTicket, 
  unlinkArticleFromTicket 
} from '../../services/knowledgeBaseService';
import { 
  MagnifyingGlassIcon, 
  BookOpenIcon, 
  LinkIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface TicketKnowledgeBaseProps {
  ticketId: string;
}

const TicketKnowledgeBase: React.FC<TicketKnowledgeBaseProps> = ({ ticketId }) => {
  const [linkedArticles, setLinkedArticles] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  useEffect(() => {
    fetchLinkedArticles();
  }, [ticketId]);
  
  const fetchLinkedArticles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const articles = await getLinkedArticles(ticketId);
      setLinkedArticles(articles);
    } catch (err: any) {
      console.error('Error fetching linked articles:', err);
      setError(err.message || 'Failed to fetch linked articles');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const results = await searchKnowledgeBase(searchQuery, { is_published: true });
      // Filter out already linked articles
      const filteredResults = results.filter(
        result => !linkedArticles.some(article => article.id === result.id)
      );
      setSearchResults(filteredResults);
    } catch (err: any) {
      console.error('Error searching knowledge base:', err);
      setError(err.message || 'Failed to search knowledge base');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleLinkArticle = async (articleId: string) => {
    try {
      await linkArticleToTicket(ticketId, articleId);
      
      // Update the UI
      const linkedArticle = searchResults.find(article => article.id === articleId);
      if (linkedArticle) {
        setLinkedArticles([...linkedArticles, linkedArticle]);
        setSearchResults(searchResults.filter(article => article.id !== articleId));
      }
    } catch (err: any) {
      console.error('Error linking article:', err);
      setError(err.message || 'Failed to link article');
    }
  };
  
  const handleUnlinkArticle = async (articleId: string) => {
    try {
      await unlinkArticleFromTicket(ticketId, articleId);
      
      // Update the UI
      setLinkedArticles(linkedArticles.filter(article => article.id !== articleId));
    } catch (err: any) {
      console.error('Error unlinking article:', err);
      setError(err.message || 'Failed to unlink article');
    }
  };
  
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchResults([]);
      setSearchQuery('');
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <BookOpenIcon className="h-5 w-5 mr-2 text-gray-500" />
          Knowledge Base Articles
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSearch}
          className="flex items-center"
        >
          {showSearch ? (
            <>
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4 mr-1" />
              Link Article
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {showSearch && (
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search knowledge base..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button type="submit" size="sm" className="ml-2" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
          
          {searchResults.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(article => (
                <div 
                  key={article.id} 
                  className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center"
                >
                  <div className="flex-grow">
                    <h4 className="text-sm font-medium text-gray-900">{article.title}</h4>
                    {article.category && (
                      <p className="text-xs text-gray-500">{article.category.name}</p>
                    )}
                  </div>
                  <div className="flex items-center ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkArticle(article.id)}
                      className="flex items-center"
                    >
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Link
                    </Button>
                    <Link
                      to={`/knowledge-base/article/${article.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No matching articles found
            </div>
          ) : null}
        </div>
      )}
      
      <div className="px-4 py-5 sm:p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : linkedArticles.length === 0 ? (
          <div className="text-center py-6">
            <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No knowledge base articles linked to this ticket</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {linkedArticles.map(article => (
              <li key={article.id} className="py-3">
                <div className="flex justify-between items-center">
                  <div className="flex-grow">
                    <Link 
                      to={`/knowledge-base/article/${article.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {article.title}
                    </Link>
                    {article.category && (
                      <p className="text-xs text-gray-500 mt-1">{article.category.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnlinkArticle(article.id)}
                    className="text-gray-400 hover:text-red-600 ml-4"
                    title="Unlink article"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TicketKnowledgeBase;

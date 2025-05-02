import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchPortal } from '../services/searchService';
import { MagnifyingGlassIcon, DocumentTextIcon, TicketIcon } from '@heroicons/react/24/outline';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<{ articles: any[], tickets: any[] }>({ articles: [], tickets: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'tickets'>('all');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      setIsLoading(true);
      try {
        const searchResults = await searchPortal(query, 50); // Get more results for the full page
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const totalResults = results.articles.length + results.tickets.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-600">
          {isLoading ? (
            'Searching...'
          ) : (
            <>
              {totalResults} results for <span className="font-medium">"{query}"</span>
            </>
          )}
        </p>
      </div>

      {/* Search form */}
      <div className="mb-8">
        <form className="flex items-center max-w-2xl">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              defaultValue={query}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search knowledge base and tickets..."
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white px-6 py-3 rounded-r-md font-medium hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            All Results ({totalResults})
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`${
              activeTab === 'articles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Knowledge Base ({results.articles.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`${
              activeTab === 'tickets'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Tickets ({results.tickets.length})
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-gray-500">
            We couldn't find anything matching "{query}". Try adjusting your search terms.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Knowledge Base Articles */}
          {(activeTab === 'all' || activeTab === 'articles') && results.articles.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-500" />
                Knowledge Base Articles
              </h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {results.articles.map((article) => (
                    <li key={article.id}>
                      <Link
                        to={`/knowledge-base/articles/${article.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-indigo-600 truncate">
                              {article.title}
                            </h3>
                            {article.category && (
                              <div className="ml-2 flex-shrink-0 flex">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {article.category.name}
                                </span>
                              </div>
                            )}
                          </div>
                          {article.summary && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tickets */}
          {(activeTab === 'all' || activeTab === 'tickets') && results.tickets.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <TicketIcon className="h-6 w-6 mr-2 text-indigo-500" />
                Your Tickets
              </h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {results.tickets.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-indigo-600 truncate">
                              {ticket.title}
                            </h3>
                            <div className="ml-2 flex-shrink-0 flex space-x-2">
                              {ticket.status && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {ticket.status.name}
                                </span>
                              )}
                              {ticket.priority && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                  {ticket.priority.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {ticket.description && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                              {ticket.description}
                            </p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchPortal } from '../../services/searchService';
import { getPortalSettings } from '../../services/portalSettingsService';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  articles: any[];
  tickets: any[];
}

const PortalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#4f46e5');
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch portal settings to get the primary and secondary colors
  useEffect(() => {
    const fetchPortalSettings = async () => {
      try {
        const settings = await getPortalSettings();
        if (settings) {
          setPrimaryColor(settings.primary_color);
          setSecondaryColor(settings.secondary_color);
        }
      } catch (error) {
        console.error('Error fetching portal settings:', error);
      }
    };
    
    fetchPortalSettings();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const searchResults = await searchPortal(query);
          setResults(searchResults);
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto -mt-8 mb-12 relative z-20" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="backdrop-blur-md bg-white/80 border border-white/20 rounded-full shadow-lg flex items-center">
          <div className="pl-5 pr-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search knowledge base and tickets..."
            className="w-full py-4 px-2 bg-transparent border-none focus:outline-none text-gray-800"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="pr-3"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </button>
          )}
          <button
            type="submit"
            className="text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-shadow"
            style={{ background: primaryColor }}
          >
            Search
          </button>
        </div>
      </form>

      {isOpen && results && (query.length >= 2) && (
        <div className="absolute w-full mt-2 backdrop-blur-md bg-white/90 border border-white/20 rounded-2xl shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div>
              {results.articles.length === 0 && results.tickets.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              ) : (
                <div>
                  {results.articles.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Knowledge Base Articles
                      </h3>
                      <ul className="divide-y divide-gray-200">
                        {results.articles.map((article) => (
                          <li key={article.id} className="py-2">
                            <Link
                              to={`/knowledge-base/articles/${article.id}`}
                              className="block hover:bg-white/50 p-2 rounded-lg transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="font-medium" style={{ color: primaryColor }}>
                                {article.title}
                              </div>
                              {article.summary && (
                                <p className="text-sm text-gray-600 line-clamp-1">
                                  {article.summary}
                                </p>
                              )}
                              {article.category && (
                                <span className="text-xs text-gray-500 mt-1">
                                  {article.category.name}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.tickets.length > 0 && (
                    <div className="p-4 border-t border-gray-200/50">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Your Tickets
                      </h3>
                      <ul className="divide-y divide-gray-200">
                        {results.tickets.map((ticket) => (
                          <li key={ticket.id} className="py-2">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="block hover:bg-white/50 p-2 rounded-lg transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="font-medium" style={{ color: primaryColor }}>
                                {ticket.title}
                              </div>
                              {ticket.description && (
                                <p className="text-sm text-gray-600 line-clamp-1">
                                  {ticket.description}
                                </p>
                              )}
                              <div className="flex items-center mt-1 space-x-2">
                                {ticket.status && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                    {ticket.status.name}
                                  </span>
                                )}
                                {ticket.priority && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                    {ticket.priority.name}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50/50 border-t border-gray-200/50 text-center">
                    <Link
                      to={`/search?q=${encodeURIComponent(query)}`}
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                      onClick={() => setIsOpen(false)}
                    >
                      View all results
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortalSearch;

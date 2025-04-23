import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getKnowledgeBaseArticles, getKnowledgeBaseCategories } from '../services/knowledgeBaseService';
import { 
  MagnifyingGlassIcon, 
  BookOpenIcon, 
  FolderIcon,
  TagIcon,
  ChevronRightIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

const KnowledgeBasePage: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [articlesData, categoriesData] = await Promise.all([
        getKnowledgeBaseArticles({
          category_id: selectedCategory || undefined,
          // Don't filter by is_published to show all articles
          search_query: searchQuery || undefined,
        }),
        getKnowledgeBaseCategories(),
      ]);
      
      setArticles(articlesData.articles);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error fetching knowledge base data:', err);
      setError(err.message || 'Failed to fetch knowledge base data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <Button asChild>
          <Link to="/knowledge-base/new">Create Article</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search knowledge base..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button type="submit" className="w-full mt-2">Search</Button>
            </form>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">Categories</h3>
                <Link 
                  to="/knowledge-base/categories"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  Manage
                </Link>
              </div>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={`flex items-center w-full text-left px-2 py-1.5 rounded-md ${
                      selectedCategory === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <BookOpenIcon className="h-5 w-5 mr-2" />
                    <span>All Articles</span>
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`flex items-center w-full text-left px-2 py-1.5 rounded-md ${
                        selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category.icon ? (
                        <span className="mr-2">{category.icon}</span>
                      ) : (
                        <FolderIcon className="h-5 w-5 mr-2" />
                      )}
                      <span>{category.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6 mx-auto"></div>
                <div className="h-32 bg-gray-200 rounded mb-6"></div>
                <div className="h-32 bg-gray-200 rounded mb-6"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No articles found</h3>
              <p className="text-gray-500">
                {searchQuery
                  ? `No articles match your search for "${searchQuery}"`
                  : selectedCategory
                  ? "No articles in this category"
                  : "No articles have been published yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/knowledge-base/article/${article.id}`}
                  className="block bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h2>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    {article.category && (
                      <div className="flex items-center mr-4">
                        <FolderIcon className="h-4 w-4 mr-1" />
                        <span>{article.category.name}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      <span>
                        {article.tags && article.tags.length > 0
                          ? article.tags.join(', ')
                          : 'No tags'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.content.replace(/<[^>]*>?/gm, '').substring(0, 200)}...
                  </p>
                  <div className="flex items-center text-blue-600 font-medium">
                    Read more
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;

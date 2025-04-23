import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getKnowledgeBaseArticleById, 
  createKnowledgeBaseArticle, 
  updateKnowledgeBaseArticle,
  getKnowledgeBaseCategories
} from '../services/knowledgeBaseService';
import { 
  ArrowLeftIcon, 
  TagIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

const KnowledgeBaseEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [article, setArticle] = useState<any>({
    title: '',
    content: '',
    category_id: '',
    tags: [],
    is_published: false,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  
  useEffect(() => {
    fetchCategories();
    
    if (isEditMode && id) {
      fetchArticle(id);
    }
  }, [id]);
  
  const fetchCategories = async () => {
    try {
      const categoriesData = await getKnowledgeBaseCategories();
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };
  
  const fetchArticle = async (articleId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const articleData = await getKnowledgeBaseArticleById(articleId);
      setArticle({
        title: articleData.title,
        content: articleData.content,
        category_id: articleData.category_id || '',
        tags: articleData.tags || [],
        is_published: articleData.is_published,
      });
    } catch (err: any) {
      console.error('Error fetching article:', err);
      setError(err.message || 'Failed to fetch article');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setArticle(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setArticle(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const addTag = () => {
    if (tagInput.trim() && !article.tags.includes(tagInput.trim())) {
      setArticle(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove),
    }));
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      if (isEditMode && id) {
        await updateKnowledgeBaseArticle(id, article);
        navigate(`/knowledge-base/article/${id}`);
      } else {
        const newArticle = await createKnowledgeBaseArticle(article);
        navigate(`/knowledge-base/article/${newArticle.id}`);
      }
    } catch (err: any) {
      console.error('Error saving article:', err);
      setError(err.message || 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
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
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/knowledge-base" className="text-blue-600 hover:text-blue-800 flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Knowledge Base
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Article' : 'Create New Article'}
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                value={article.title}
                onChange={handleChange}
                placeholder="Article title"
              />
            </div>
            
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                value={article.category_id}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={15}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                value={article.content}
                onChange={handleChange}
                placeholder="Article content (supports HTML formatting)"
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                HTML formatting is supported. You can use tags like &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc.
              </p>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    id="tags"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 pr-10"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tags and press Enter"
                  />
                  <TagIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={addTag}
                >
                  Add
                </Button>
              </div>
              
              {article.tags && article.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <div
                      key={tag}
                      className="bg-blue-50 text-blue-700 text-sm px-2 py-1 rounded-md flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                name="is_published"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={article.is_published}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                Publish article (visible to all users)
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/knowledge-base')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-1" />
                {isSaving ? 'Saving...' : isEditMode ? 'Update Article' : 'Create Article'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KnowledgeBaseEditorPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getKnowledgeBaseCategories, 
  createKnowledgeBaseCategory, 
  updateKnowledgeBaseCategory 
} from '../services/knowledgeBaseService';
import { 
  FolderIcon, 
  PlusIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

const KnowledgeBaseCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '',
    parent_id: '',
    is_active: true,
  });
  
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    icon: '',
    parent_id: '',
    is_active: true,
  });
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const categoriesData = await getKnowledgeBaseCategories(true);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleNewCategoryCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleEditFormCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const startEditing = (category: any) => {
    setEditingCategory(category.id);
    setEditForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active,
    });
  };
  
  const cancelEditing = () => {
    setEditingCategory(null);
  };
  
  const saveCategory = async (id: string) => {
    try {
      await updateKnowledgeBaseCategory(id, editForm);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
    }
  };
  
  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createKnowledgeBaseCategory(newCategory);
      setNewCategory({
        name: '',
        description: '',
        icon: '',
        parent_id: '',
        is_active: true,
      });
      setShowNewCategoryForm(false);
      fetchCategories();
    } catch (err: any) {
      console.error('Error creating category:', err);
      setError(err.message || 'Failed to create category');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/knowledge-base" className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Knowledge Base
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Categories</h1>
        </div>
        
        <Button
          onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
          className="flex items-center"
        >
          {showNewCategoryForm ? (
            <>
              <XMarkIcon className="h-5 w-5 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5 mr-1" />
              New Category
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {showNewCategoryForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Category</h2>
          <form onSubmit={createCategory}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                  value={newCategory.name}
                  onChange={handleNewCategoryChange}
                />
              </div>
              
              <div>
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  id="parent_id"
                  name="parent_id"
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                  value={newCategory.parent_id}
                  onChange={handleNewCategoryChange}
                >
                  <option value="">None (Top Level)</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (emoji or icon name)
                </label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                  value={newCategory.icon}
                  onChange={handleNewCategoryChange}
                  placeholder="📚 or icon-name"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                  value={newCategory.description}
                  onChange={handleNewCategoryChange}
                />
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={newCategory.is_active}
                onChange={handleNewCategoryCheckboxChange}
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">Create Category</Button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-center">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
            <p className="text-gray-500">Create your first knowledge base category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    {editingCategory === category.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="name"
                            required
                            className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-1 text-sm"
                            value={editForm.name}
                            onChange={handleEditFormChange}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="description"
                            className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-1 text-sm"
                            value={editForm.description}
                            onChange={handleEditFormChange}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            name="parent_id"
                            className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-1 text-sm"
                            value={editForm.parent_id}
                            onChange={handleEditFormChange}
                          >
                            <option value="">None (Top Level)</option>
                            {categories
                              .filter(c => c.id !== category.id)
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))
                            }
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="is_active"
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                              checked={editForm.is_active}
                              onChange={handleEditFormCheckboxChange}
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                              Active
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => saveCategory(category.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {category.icon ? (
                              <span className="mr-2">{category.icon}</span>
                            ) : (
                              <FolderIcon className="h-5 w-5 mr-2 text-gray-400" />
                            )}
                            <span className="font-medium text-gray-900">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.parent_id ? (
                            categories.find(c => c.id === category.parent_id)?.name || '-'
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => startEditing(category)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseCategoriesPage;

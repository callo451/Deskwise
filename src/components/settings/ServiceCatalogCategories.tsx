import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowsUpDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';

interface ServiceCatalogCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ServiceCatalogCategories: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<ServiceCatalogCategory> | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    checkAuthAndFetchCategories();
  }, []);

  const checkAuthAndFetchCategories = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated and has proper role
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setAuthError('Authentication error: ' + userError.message);
        setIsLoading(false);
        return;
      }
      
      if (!userData?.user) {
        setAuthError('You must be logged in to access this page');
        setIsLoading(false);
        return;
      }

      // Get user role from the users table
      const { data: userDetails, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userData.user.id)
        .single();
      
      if (roleError) {
        setAuthError('Error fetching user role: ' + roleError.message);
        setIsLoading(false);
        return;
      }

      // Check if user has admin or manager role
      if (userDetails?.role !== 'admin' && userDetails?.role !== 'manager') {
        setAuthError('You must be an admin or manager to manage service catalog categories');
        setIsLoading(false);
        return;
      }

      // User is authenticated and has proper role, fetch categories
      await fetchCategories();
    } catch (error: any) {
      console.error('Error checking authentication:', error);
      setAuthError(`An unexpected error occurred: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_catalog_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching service catalog categories:', error);
    }
  };

  const handleOpenModal = (category?: ServiceCatalogCategory) => {
    if (category) {
      setCurrentCategory(category);
    } else {
      setCurrentCategory({
        name: '',
        description: '',
        icon: 'folder',
        color: '#3b82f6',
        image_url: null,
        is_active: true,
        sort_order: categories.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
  };

  const handleSave = async () => {
    if (!currentCategory || !currentCategory.name) {
      return;
    }

    try {
      // Check authentication status before saving
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        alert('You must be logged in to save service catalog categories');
        return;
      }

      // Get the user's tenant_id
      const { data: userDetails, error: userDetailsError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', userData.user.id)
        .single();
      
      if (userDetailsError) {
        alert('Error fetching user details: ' + userDetailsError.message);
        return;
      }

      // Ensure tenant_id is included
      if (!userDetails.tenant_id) {
        alert('Could not determine tenant ID for the user.');
        return;
      }

      // Add tenant_id to the category data
      const categoryData = {
        ...currentCategory,
        tenant_id: userDetails.tenant_id,
        description: currentCategory.description || null,
        icon: currentCategory.icon || null,
        color: currentCategory.color || null,
        image_url: currentCategory.image_url || null
      };

      if (currentCategory.id) {
        // Update existing category
        const { error } = await supabase
          .from('service_catalog_categories')
          .update(categoryData)
          .eq('id', currentCategory.id);
        
        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('service_catalog_categories')
          .insert([categoryData]);
        
        if (error) throw error;
      }
      
      await fetchCategories();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving service catalog category:', error);
      
      // Display a more helpful error message
      if (error.message && error.message.includes('row-level security policy')) {
        alert('Permission denied: You do not have the required role (admin or manager) to save service catalog categories');
      } else {
        alert(`Error saving service catalog category: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will not delete the service catalog items in this category, but they will become uncategorized.')) {
      try {
        const { error } = await supabase
          .from('service_catalog_categories')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchCategories();
      } catch (error: any) {
        console.error('Error deleting service catalog category:', error);
        alert(`Error deleting category: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;
    
    // If dropped outside a droppable area or in the same position
    if (!destination || (destination.index === source.index)) {
      return;
    }
    
    // Reorder the categories
    const reorderedCategories = Array.from(categories);
    const [movedCategory] = reorderedCategories.splice(source.index, 1);
    reorderedCategories.splice(destination.index, 0, movedCategory);
    
    // Update the sort_order for each category
    const updatedCategories = reorderedCategories.map((category, index) => ({
      ...category,
      sort_order: index + 1
    }));
    
    setCategories(updatedCategories);
    
    // Update the sort_order in the database
    try {
      for (const category of updatedCategories) {
        const { error } = await supabase
          .from('service_catalog_categories')
          .update({ sort_order: category.sort_order })
          .eq('id', category.id);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating category sort order:', error);
      // Refresh the categories to ensure we have the correct order
      fetchCategories();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    setIsUploading(true);
    try {
      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('service-catalog-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('service-catalog-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
         throw new Error('Could not get public URL for the uploaded image.');
      }
      
      // Update state
      setCurrentCategory(prev => prev ? { ...prev, image_url: urlData.publicUrl } : null);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Error uploading image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
       // Clear the file input value so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    // Optional: Add logic here to delete the image from Supabase storage if desired
    // const currentImageUrl = currentCategory?.image_url;
    // if (currentImageUrl) { ... supabase.storage.from(...).remove(...) ... }
    
    setCurrentCategory(prev => prev ? { ...prev, image_url: null } : null);
  };

  return (
    <div className="space-y-6">
      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{authError}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Categories</h3>
        <Button onClick={() => handleOpenModal()} variant="default" size="sm">
          <PlusIcon className="h-5 w-5 mr-1" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <p>Loading categories...</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No categories found. Add one to get started.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {categories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 ${snapshot.isDragging ? 'bg-gray-100 shadow-md ring-2 ring-indigo-500' : ''}`}
                      >
                        <div 
                          {...provided.dragHandleProps}
                          className="flex-shrink-0 w-8 text-gray-400 cursor-grab mr-2"
                          title="Drag to reorder"
                        >
                          <ArrowsUpDownIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-grow text-sm font-medium text-gray-900"> 
                          {category.name}
                        </div>
                        <div className="flex-shrink-0 flex justify-end space-x-2 ml-4"> 
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Category"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Category"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal for adding/editing categories */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {currentCategory?.id ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={currentCategory?.name || ''}
                    onChange={(e) => setCurrentCategory({ ...currentCategory!, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    rows={3}
                    value={currentCategory?.description || ''}
                    onChange={(e) => setCurrentCategory({ ...currentCategory!, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Image
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-shrink-0 h-20 w-20 rounded border border-gray-300 flex items-center justify-center text-gray-400 overflow-hidden">
                      {currentCategory?.image_url ? (
                        <img src={currentCategory.image_url} alt="Category Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs">No Image</span>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <input 
                        type="file"
                        id="category-image-upload"
                        className="hidden" // Hide default input, style the button
                        onChange={handleImageUpload}
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        disabled={isUploading}
                      />
                       <label 
                        htmlFor="category-image-upload"
                        className={`cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploading ? 'Uploading...' : 'Change Image'}
                      </label>
                      {currentCategory?.image_url && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                          disabled={isUploading}
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      className="h-10 w-10 rounded-md border border-gray-300"
                      value={currentCategory?.color || '#3b82f6'}
                      onChange={(e) => setCurrentCategory({ ...currentCategory!, color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="ml-2 w-full rounded-md border border-gray-300 px-3 py-2"
                      value={currentCategory?.color || '#3b82f6'}
                      onChange={(e) => setCurrentCategory({ ...currentCategory!, color: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={currentCategory?.is_active}
                    onChange={(e) => setCurrentCategory({ ...currentCategory!, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="is-active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!currentCategory?.name}
                className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalogCategories;

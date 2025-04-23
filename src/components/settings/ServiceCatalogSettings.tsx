import React, { useState, useEffect } from 'react';
import { getServiceCatalogItems, createServiceCatalogItem, updateServiceCatalogItem, deleteServiceCatalogItem } from '../../services/serviceCatalogService';
import { Button } from '../ui/Button';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ServiceCatalogItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  icon: string | null;
  form_fields: any[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

const ServiceCatalogSettings: React.FC = () => {
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ServiceCatalogItem> | null>(null);
  const [formFields, setFormFields] = useState<any[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await getServiceCatalogItems();
      setItems(data);
    } catch (error) {
      console.error('Error fetching service catalog items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item?: ServiceCatalogItem) => {
    if (item) {
      setCurrentItem(item);
      setFormFields(item.form_fields || []);
    } else {
      setCurrentItem({
        name: '',
        description: '',
        category_id: null,
        icon: 'question-mark-circle',
        is_active: true,
        sort_order: items.length + 1,
        form_fields: []
      });
      setFormFields([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setFormFields([]);
  };

  const handleSave = async () => {
    if (!currentItem || !currentItem.name) return;

    try {
      const itemWithFields = {
        ...currentItem,
        form_fields: formFields
      };

      if (currentItem.id) {
        await updateServiceCatalogItem(currentItem.id, itemWithFields);
      } else {
        await createServiceCatalogItem(itemWithFields);
      }
      
      fetchItems();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving service catalog item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service catalog item?')) {
      try {
        await deleteServiceCatalogItem(id);
        fetchItems();
      } catch (error) {
        console.error('Error deleting service catalog item:', error);
      }
    }
  };

  const handleAddField = () => {
    setFormFields([
      ...formFields,
      {
        id: `field_${Date.now()}`,
        type: 'text',
        label: 'New Field',
        placeholder: '',
        required: false,
        options: []
      }
    ]);
  };

  const handleUpdateField = (index: number, field: any) => {
    const updatedFields = [...formFields];
    updatedFields[index] = field;
    setFormFields(updatedFields);
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = [...formFields];
    updatedFields.splice(index, 1);
    setFormFields(updatedFields);
  };

  const renderFieldEditor = () => {
    return (
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Form Fields</h3>
          <Button 
            size="sm" 
            onClick={handleAddField}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>
        
        {formFields.length === 0 && (
          <p className="text-gray-500 text-sm">No form fields added yet. Add fields to customize the request form.</p>
        )}
        
        {formFields.map((field, index) => (
          <div key={field.id} className="mb-4 p-3 border rounded-md bg-gray-50">
            <div className="flex justify-between mb-2">
              <h4 className="font-medium">{field.label || 'Unnamed Field'}</h4>
              <button 
                onClick={() => handleRemoveField(index)}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Field Type
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  value={field.type}
                  onChange={(e) => handleUpdateField(index, { ...field, type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Text Area</option>
                  <option value="select">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="radio">Radio Buttons</option>
                  <option value="date">Date</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  value={field.label}
                  onChange={(e) => handleUpdateField(index, { ...field, label: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  value={field.placeholder || ''}
                  onChange={(e) => handleUpdateField(index, { ...field, placeholder: e.target.value })}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`required-${field.id}`}
                  checked={field.required}
                  onChange={(e) => handleUpdateField(index, { ...field, required: e.target.checked })}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor={`required-${field.id}`} className="ml-2 block text-sm text-gray-700">
                  Required Field
                </label>
              </div>
              
              {(field.type === 'select' || field.type === 'radio') && (
                <div className="col-span-2 mt-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Options (one per line)
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    rows={3}
                    value={(field.options || []).join('\n')}
                    onChange={(e) => handleUpdateField(index, { 
                      ...field, 
                      options: e.target.value.split('\n').filter(o => o.trim() !== '') 
                    })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Service Catalog</h2>
        <Button 
          onClick={() => handleOpenModal()}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Service
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 mb-4">No service catalog items found.</p>
          <Button 
            onClick={() => handleOpenModal()}
            className="flex items-center mx-auto"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Create First Service
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fields
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.icon && (
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center text-gray-500">
                          <span className="text-xl">{item.icon}</span>
                        </div>
                      )}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.category?.name || 'Uncategorized'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.form_fields ? item.form_fields.length : 0} fields
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="text-primary hover:text-primary-dark mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal for adding/editing service catalog items */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">
                {currentItem?.id ? 'Edit Service' : 'Add New Service'}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={currentItem?.name || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem!, name: e.target.value })}
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
                    value={currentItem?.description || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem!, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={currentItem?.icon || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem!, icon: e.target.value })}
                    placeholder="Icon name or emoji"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={currentItem?.is_active}
                    onChange={(e) => setCurrentItem({ ...currentItem!, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="is-active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
                
                {renderFieldEditor()}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!currentItem?.name}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalogSettings;

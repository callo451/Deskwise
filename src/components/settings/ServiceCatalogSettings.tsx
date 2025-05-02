import React, { useState, useEffect, Fragment } from 'react';
import { getServiceCatalogItems, createServiceCatalogItem, updateServiceCatalogItem, deleteServiceCatalogItem, getServiceCatalogCategories } from '../../services/serviceCatalogService';
import { Button } from '../ui/Button';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  UserCircleIcon, 
  ComputerDesktopIcon, 
  CogIcon, 
  QuestionMarkCircleIcon,
  BuildingOfficeIcon,
  PrinterIcon,
  PhoneIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { supabase } from '../../lib/supabase';
import { FormFieldDesigner } from '../form-builder/FormFieldDesigner';
import { FormDesign, FormField, FormSection } from '../../types/formBuilder';
import ServiceCatalogCategories from './ServiceCatalogCategories';

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

interface ServiceCatalogItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  icon: string | null;
  form_fields: FormField[] | null;
  form_sections?: FormSection[] | null;
  form_routing?: any[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

const availableIcons = [
  { name: 'question-mark-circle', Component: QuestionMarkCircleIcon, label: 'Question Mark' },
  { name: 'user-circle', Component: UserCircleIcon, label: 'User' },
  { name: 'computer-desktop', Component: ComputerDesktopIcon, label: 'Desktop' },
  { name: 'cog', Component: CogIcon, label: 'Settings' },
  { name: 'building-office', Component: BuildingOfficeIcon, label: 'Office' },
  { name: 'printer', Component: PrinterIcon, label: 'Printer' },
  { name: 'phone', Component: PhoneIcon, label: 'Phone' },
  { name: 'shield-check', Component: ShieldCheckIcon, label: 'Security' },
  { name: 'wrench-screwdriver', Component: WrenchScrewdriverIcon, label: 'Tools/Support' },
  { name: 'clipboard-document-list', Component: ClipboardDocumentListIcon, label: 'Request/List' },
  // Add more icons as needed
];

const ServiceCatalogSettings: React.FC = () => {
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ServiceCatalogItem> | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('categories');
  const [categories, setCategories] = useState<ServiceCatalogCategory[]>([]);
  const [formDesign, setFormDesign] = useState<FormDesign>({ 
    sections: [], 
    fields: {}, 
    routing: [] 
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);
  
  // Switch tabs
  const handleTabChange = (tab: 'items' | 'categories') => {
    setActiveTab(tab);
  };

  const checkAuthAndFetchData = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated and has proper role
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setAuthError('Authentication error: ' + userError.message);
        return;
      }
      
      if (!userData?.user) {
        setAuthError('You must be logged in to access this page');
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
        return;
      }

      setUserRole(userDetails?.role || null);
      
      // Check if user has admin or manager role
      if (userDetails?.role !== 'admin' && userDetails?.role !== 'manager') {
        setAuthError('You must be an admin or manager to manage service catalog items');
        return;
      }

      // User is authenticated and has proper role, fetch data
      await Promise.all([
        fetchItems(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchItems = async () => {
    try {
      // Use the dedicated service function which calls the RPC
      const data = await getServiceCatalogItems();
      // Ensure the data includes category information if needed by the table display
      // Note: The RPC function 'get_service_catalog_items' needs to return the category join
      // If it doesn't, the service or RPC needs modification. Assuming it does for now.
      setItems(data);
    } catch (error) {
      console.error('Error fetching service catalog items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getServiceCatalogCategories(); 
      setCategories(data as ServiceCatalogCategory[]); // Explicit type assertion if needed
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  // Convert between FormDesign and the existing formFields format
  useEffect(() => {
    if (isModalOpen && currentItem) {
      // Convert existing form fields to FormDesign format
      if (currentItem.form_fields && currentItem.form_fields.length > 0) {
        const fieldsRecord: Record<string, FormField> = {};
        
        // If we have sections, use them
        if (currentItem.form_sections && currentItem.form_sections.length > 0) {
          // Convert sections and update field IDs
          const sections = currentItem.form_sections.map(section => ({
            id: section.id,
            title: section.title,
            description: section.description,
            collapsed: section.collapsed,
            fieldIds: section.fieldIds || [] // Use fieldIds property
          }));
          
          // Add fields to the record
          currentItem.form_fields.forEach(field => {
            fieldsRecord[field.id] = field;
          });
          
          setFormDesign({
            sections,
            fields: fieldsRecord,
            routing: currentItem.form_routing || []
          });
        } else {
          // Create a default section
          const defaultSection: FormSection = {
            id: `section_${Date.now()}`,
            title: 'General Information',
            description: 'Please provide the following information',
            fieldIds: [],
            collapsed: false
          };
          
          // Add fields to the record and update with sectionId
          currentItem.form_fields.forEach(field => {
            const updatedField = {
              ...field,
              sectionId: defaultSection.id
            };
            fieldsRecord[field.id] = updatedField;
            defaultSection.fieldIds.push(field.id);
          });
          
          setFormDesign({
            sections: [defaultSection],
            fields: fieldsRecord,
            routing: []
          });
        }
      } else {
        // Create an empty form design
        const defaultSection: FormSection = {
          id: `section_${Date.now()}`,
          title: 'General Information',
          description: 'Please provide the following information',
          fieldIds: [],
          collapsed: false
        };
        
        setFormDesign({
          sections: [defaultSection],
          fields: {},
          routing: []
        });
      }
    }
  }, [isModalOpen, currentItem]);

  const handleOpenModal = (item?: ServiceCatalogItem) => {
    if (item) {
      setCurrentItem(item);
      
      // Set form fields from the item
      if (item.form_fields) {
        setFormFields(item.form_fields);
      } else {
        setFormFields([]);
      }
    } else {
      setCurrentItem({
        name: '',
        description: '',
        category_id: null,
        is_active: true,
        sort_order: items.length + 1,
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
    console.log('Save button clicked');
    if (!currentItem || !currentItem.name) {
      console.log('No current item or name is empty');
      return;
    }

    try {
      // Check authentication status before saving
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        alert('You must be logged in to save service catalog items');
        return;
      }

      // Convert form design to legacy format for API compatibility
      const formFieldsData = formDesign.sections.length > 0 
        ? convertSectionsToLegacyFormat(formDesign) 
        : formFields;

      const itemData = {
        ...currentItem,
        form_fields: formFieldsData,
        form_sections: formDesign.sections,
        form_routing: formDesign.routing
      };

      if (currentItem.id) {
        await updateServiceCatalogItem(currentItem.id, itemData);
      } else {
        await createServiceCatalogItem(itemData);
      }
      
      await fetchItems();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving service catalog item:', error);
      
      // Display a more helpful error message
      if (error.message && error.message.includes('row-level security policy')) {
        alert('Permission denied: You do not have the required role (admin or manager) to save service catalog items');
      } else {
        alert(`Error saving service catalog item: ${error.message || 'Unknown error'}`);
      }
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

  const handleFormDesignChange = (newDesign: FormDesign) => {
    setFormDesign(newDesign);
  };
  
  // Convert FormDesign to legacy format for API compatibility
  const convertSectionsToLegacyFormat = (design: FormDesign): FormField[] => {
    const allFields: FormField[] = [];
    
    design.sections.forEach(section => {
      // Use fieldIds instead of fields
      section.fieldIds.forEach(fieldId => {
        if (design.fields[fieldId]) {
          allFields.push(design.fields[fieldId]);
        }
      });
    });
    
    return allFields;
  };

  const renderFieldEditor = () => {
    return (
      <div className="mt-6 border-t pt-4">
        <FormFieldDesigner
          initialDesign={formDesign}
          onChange={handleFormDesignChange}
        />
      </div>
    );
  };

  return (
    <div>
      {authError && (
        <div className="mb-6 p-4 border border-red-300 bg-red-50 rounded-md flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Authentication Error</h3>
            <p className="text-red-700">{authError}</p>
            {userRole && userRole !== 'admin' && userRole !== 'manager' && (
              <p className="mt-2 text-sm text-red-700">
                Your current role is <strong>{userRole}</strong>. You need admin or manager role to manage service catalog items.
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="mb-6">
        {/* Subtabs - with card-like styling */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {/* Subtab Navigation */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => handleTabChange('categories')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Categories
              </button>
              <button
                onClick={() => handleTabChange('items')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Service Items
              </button>
            </nav>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'categories' ? (
            <div>
              <ServiceCatalogCategories />
            </div>
          ) : (
            <div className="mt-6">
              {/* Header with Add Button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Service Items</h3> {/* Match Categories heading style */}
                <Button 
                  size="sm" // Match Categories button size
                  onClick={() => {
                    setCurrentItem(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add
                </Button>
              </div>

              {/* Items List (replaces table) */}
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-2">
                  {items.map(item => {
                    const IconComponent = availableIcons.find(icon => icon.name === item.icon)?.Component || QuestionMarkCircleIcon;
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {/* Icon Container */}
                          <div className="p-2 rounded-lg" style={{ backgroundColor: '#3b82f6' }}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          {/* Item Name */}
                          <span className="text-gray-800 font-medium">{item.name}</span>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="text-gray-500 hover:text-primary transition-colors p-1 rounded hover:bg-primary-lightest"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-500 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-100"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      No service items created yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for adding/editing service catalog items */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {currentItem?.id ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    Category
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={currentItem?.category_id || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem!, category_id: e.target.value || null })}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
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
                
                {/* Icon Selection Listbox */}
                <div className="col-span-6 sm:col-span-3">
                  <Listbox 
                    value={currentItem?.icon || ''} 
                    onChange={(value) => setCurrentItem({ ...currentItem!, icon: value || null })}
                  >
                    {({ open }) => (
                      <>
                        <Listbox.Label className="block text-sm font-medium text-gray-700">Icon</Listbox.Label>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
                            <span className="flex items-center">
                              {currentItem?.icon ? (
                                React.createElement(availableIcons.find(i => i.name === currentItem.icon)?.Component || Fragment, { className: 'h-5 w-5 mr-2 text-gray-500' })
                              ) : (
                                <span className="h-5 w-5 mr-2"></span> // Placeholder space
                              )}
                              <span className="block truncate">
                                {availableIcons.find(i => i.name === currentItem?.icon)?.label || 'Select an Icon'}
                              </span>
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>

                          <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {availableIcons.map((iconInfo) => (
                                <Listbox.Option
                                  key={iconInfo.name}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-primary text-white' : 'text-gray-900'}`
                                  }
                                  value={iconInfo.name}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <div className="flex items-center">
                                        <iconInfo.Component
                                          className={`h-5 w-5 mr-2 ${active ? 'text-white' : 'text-gray-500'}`}
                                          aria-hidden="true"
                                        />
                                        <span className={`${selected ? 'font-semibold' : 'font-normal'} block truncate`}>
                                          {iconInfo.label}
                                        </span>
                                      </div>

                                      {selected ? (
                                        <span
                                          className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-white' : 'text-primary'}`}
                                        >
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </>
                    )}
                  </Listbox>
                </div>
                {/* End Icon Selection Listbox */}

                <div className="col-span-6 sm:col-span-3 flex items-end">
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={currentItem?.is_active ?? true} // Default to active for new items
                      onChange={(e) => setCurrentItem({ ...currentItem!, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Active</label>
                  </div>
                </div>

                {/* Form Fields Section */}
                <div className="col-span-6">
                  {renderFieldEditor()}
                </div>

              </div>
              
              <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    
    </div>
  );
};

export default ServiceCatalogSettings;

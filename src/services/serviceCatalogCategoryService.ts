import { supabase } from '../lib/supabase';

export interface ServiceCatalogCategory {
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

/**
 * Get all service catalog categories
 */
export const getServiceCatalogCategories = async (): Promise<ServiceCatalogCategory[]> => {
  const { data, error } = await supabase
    .from('service_catalog_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching service catalog categories:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Get a single service catalog category by ID
 */
export const getServiceCatalogCategory = async (id: string): Promise<ServiceCatalogCategory> => {
  const { data, error } = await supabase
    .from('service_catalog_categories')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching service catalog category with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Create a new service catalog category
 */
export const createServiceCatalogCategory = async (category: Partial<ServiceCatalogCategory>): Promise<ServiceCatalogCategory> => {
  const { data, error } = await supabase
    .from('service_catalog_categories')
    .insert([category])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating service catalog category:', error);
    throw error;
  }
  
  return data;
};

/**
 * Update an existing service catalog category
 */
export const updateServiceCatalogCategory = async (id: string, category: Partial<ServiceCatalogCategory>): Promise<ServiceCatalogCategory> => {
  const { data, error } = await supabase
    .from('service_catalog_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating service catalog category with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Delete a service catalog category
 */
export const deleteServiceCatalogCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('service_catalog_categories')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting service catalog category with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get service catalog items by category
 */
export const getServiceCatalogItemsByCategory = async (): Promise<Record<string, any[]>> => {
  // First get all categories
  const categories = await getServiceCatalogCategories();
  
  // Then get all items
  const { data: items, error } = await supabase
    .from('service_catalog_items')
    .select('*, category:category_id(id, name)')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching service catalog items by category:', error);
    throw error;
  }
  
  // Group items by category
  const itemsByCategory: Record<string, any[]> = {};
  
  // Initialize with empty arrays for all categories
  categories.forEach(category => {
    itemsByCategory[category.id] = [];
  });
  
  // Add uncategorized group
  itemsByCategory['uncategorized'] = [];
  
  // Group items
  (items || []).forEach(item => {
    if (item.category_id && itemsByCategory[item.category_id]) {
      itemsByCategory[item.category_id].push(item);
    } else {
      itemsByCategory['uncategorized'].push(item);
    }
  });
  
  return itemsByCategory;
};

-- Create service_catalog_categories table
CREATE TABLE IF NOT EXISTS public.service_catalog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for service_catalog_categories
ALTER TABLE public.service_catalog_categories ENABLE ROW LEVEL SECURITY;

-- Policy for selecting categories (all authenticated users can view)
CREATE POLICY select_service_catalog_categories ON public.service_catalog_categories
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_tenants WHERE tenant_id = service_catalog_categories.tenant_id
        )
    );

-- Policy for inserting categories (only admins and managers)
CREATE POLICY insert_service_catalog_categories ON public.service_catalog_categories
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT users.id FROM public.users
            JOIN public.user_tenants ON users.id = user_tenants.user_id
            WHERE user_tenants.tenant_id = service_catalog_categories.tenant_id
            AND users.role IN ('admin', 'manager')
        )
    );

-- Policy for updating categories (only admins and managers)
CREATE POLICY update_service_catalog_categories ON public.service_catalog_categories
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT users.id FROM public.users
            JOIN public.user_tenants ON users.id = user_tenants.user_id
            WHERE user_tenants.tenant_id = service_catalog_categories.tenant_id
            AND users.role IN ('admin', 'manager')
        )
    );

-- Policy for deleting categories (only admins and managers)
CREATE POLICY delete_service_catalog_categories ON public.service_catalog_categories
    FOR DELETE USING (
        auth.uid() IN (
            SELECT users.id FROM public.users
            JOIN public.user_tenants ON users.id = user_tenants.user_id
            WHERE user_tenants.tenant_id = service_catalog_categories.tenant_id
            AND users.role IN ('admin', 'manager')
        )
    );

-- Add category_id to service_catalog_items if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'service_catalog_items' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.service_catalog_items ADD COLUMN category_id UUID REFERENCES public.service_catalog_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on category_id
CREATE INDEX IF NOT EXISTS idx_service_catalog_items_category_id ON public.service_catalog_items(category_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_catalog_categories_updated_at
BEFORE UPDATE ON public.service_catalog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

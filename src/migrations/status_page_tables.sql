-- Create status_service_groups table
CREATE TABLE IF NOT EXISTS status_service_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create status_services table
CREATE TABLE IF NOT EXISTS status_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  current_status TEXT NOT NULL CHECK (current_status IN ('operational', 'degraded', 'outage', 'maintenance')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  group_id UUID REFERENCES status_service_groups(id) ON DELETE SET NULL,
  is_monitored BOOLEAN NOT NULL DEFAULT FALSE,
  api_endpoint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_status_history table to track status changes
CREATE TABLE IF NOT EXISTS service_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES status_services(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'outage', 'maintenance')),
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create status_page_settings table for customization
CREATE TABLE IF NOT EXISTS status_page_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'System Status',
  description TEXT,
  show_uptime BOOLEAN NOT NULL DEFAULT TRUE,
  show_history BOOLEAN NOT NULL DEFAULT TRUE,
  show_timestamps BOOLEAN NOT NULL DEFAULT TRUE,
  refresh_interval INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_tenant_settings UNIQUE (tenant_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_status_services_tenant_id ON status_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_status_services_group_id ON status_services(group_id);
CREATE INDEX IF NOT EXISTS idx_service_status_history_service_id ON service_status_history(service_id);
CREATE INDEX IF NOT EXISTS idx_status_service_groups_tenant_id ON status_service_groups(tenant_id);

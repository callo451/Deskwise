# Status Page Implementation

## Overview

The Status Page is a fully functional and customizable IT Status Page that allows app administrators to display system uptime for designated services. Services can be added manually, and their uptime status can be updated. The system also supports API monitoring for automatic status updates.

## Features

- **Service Management**: Create, update, and delete services with status indicators (operational, degraded, outage, maintenance)
- **Service Grouping**: Organize services into logical groups for better presentation
- **Status History**: Track historical status changes for each service
- **API Monitoring**: Automatically monitor service endpoints for status updates
- **Customizable Display**: Configure how the status page appears to users
- **Real-time Updates**: Status changes are immediately reflected in the portal

## Technical Implementation

### Database Schema

The Status Page functionality is built on four main database tables:

1. **status_service_groups**
   - Stores service group information for organizing services
   - Fields: id, tenant_id, name, display_order, created_at, updated_at

2. **status_services**
   - Stores information about monitored services
   - Fields: id, tenant_id, name, description, current_status, last_updated, group_id, is_monitored, api_endpoint, created_at, updated_at

3. **service_status_history**
   - Tracks historical status changes for services
   - Fields: id, service_id, status, message, timestamp

4. **status_page_settings**
   - Stores tenant-specific settings for the status page
   - Fields: id, tenant_id, title, description, show_uptime, show_history, show_timestamps, refresh_interval, created_at, updated_at

### Components

1. **StatusPageSettings.tsx**
   - Admin interface for managing services, groups, and status page settings
   - Located at: `src/components/settings/StatusPageSettings.tsx`
   - Features:
     - Service management (add, update, delete)
     - Group management (add, delete)
     - Status page configuration

2. **StatusPage.tsx**
   - User-facing component that displays service statuses
   - Located at: `src/components/portal/StatusPage.tsx`
   - Features:
     - Displays overall system status
     - Groups services by category
     - Shows individual service statuses with visual indicators
     - Auto-refreshes at configurable intervals

3. **StatusPageSettingsPage.tsx**
   - Container page for the status page settings
   - Located at: `src/pages/StatusPageSettingsPage.tsx`
   - Integrates with the main settings layout

### Integration Points

1. **Self Service Portal**
   - The status page is integrated as a section in the Self Service Portal
   - Added to `SelfServicePortalPage.tsx` as a new section
   - Displays the current status of all monitored services

2. **Settings Navigation**
   - Added as a dedicated tab in the settings sidebar
   - Route: `/settings/status-page`
   - Accessible to admin and manager roles only

## API Monitoring

The Status Page includes functionality for automatic API monitoring:

1. **Configuration**:
   - Enable monitoring for a service in the admin interface
   - Specify an API endpoint URL to monitor

2. **Monitoring Process**:
   - The system periodically checks the specified endpoints
   - Updates service status based on the response:
     - 2xx status codes: operational
     - 4xx status codes: degraded
     - 5xx status codes: outage
     - No response: outage

3. **Status Updates**:
   - Status changes are recorded in the service_status_history table
   - The service's last_updated timestamp is updated
   - Changes are immediately reflected in the portal

## User Interface

### Admin Interface

The Status Page settings interface provides administrators with:

1. **Services Tab**:
   - Add new services with name, description, and initial status
   - Enable/disable API monitoring for services
   - Configure API endpoints for monitoring
   - View and manage existing services
   - Update service statuses manually

2. **Groups Tab**:
   - Create and manage service groups
   - Organize services into logical categories

3. **Settings Tab**:
   - Configure general status page settings
   - Set refresh intervals
   - Toggle display options

### User Interface

The user-facing Status Page displays:

1. **Overall System Status**:
   - Summary of the current system status
   - Visual indicator of the worst status across all services

2. **Service Groups**:
   - Services organized by their assigned groups
   - Each service shows its current status with a visual indicator

3. **Status Indicators**:
   - Green: Operational
   - Yellow: Degraded Performance
   - Red: Major Outage
   - Blue: Maintenance

## Future Enhancements

Potential future enhancements to the Status Page functionality:

1. **Incident Management**:
   - Create and manage incidents related to service outages
   - Provide detailed incident reports and updates

2. **Scheduled Maintenance**:
   - Schedule and announce upcoming maintenance windows
   - Automatically update service statuses during maintenance

3. **Status Subscriptions**:
   - Allow users to subscribe to status updates
   - Send notifications when service status changes

4. **Historical Uptime Reporting**:
   - Generate uptime reports for services
   - Display historical uptime percentages

5. **Advanced API Monitoring**:
   - Monitor specific API response patterns
   - Configure custom health check criteria

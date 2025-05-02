import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPortalSettings, PortalSettings } from '../services/portalSettingsService';
import {
  getActiveServiceCatalogItems,
  getServiceCatalogCategories,
  ServiceCatalogItem as Service,
  ServiceCategory
} from '../services/serviceCatalogService';
import { supabase } from '../lib/supabase';
import PortalSearch from '../components/portal/PortalSearch';
import StatusPage from '../components/portal/StatusPage';

// Import the same set of icons used in settings
import {
  UserCircleIcon, 
  ComputerDesktopIcon, 
  CogIcon, 
  QuestionMarkCircleIcon,
  BuildingOfficeIcon,
  PrinterIcon,
  PhoneIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  RectangleStackIcon // Default icon
} from '@heroicons/react/24/outline';

// Create a mapping from icon name string to component
const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  'question-mark-circle': QuestionMarkCircleIcon,
  'user-circle': UserCircleIcon,
  'computer-desktop': ComputerDesktopIcon,
  'cog': CogIcon,
  'building-office': BuildingOfficeIcon,
  'printer': PrinterIcon,
  'phone': PhoneIcon,
  'shield-check': ShieldCheckIcon,
  'wrench-screwdriver': WrenchScrewdriverIcon,
  'clipboard-document-list': ClipboardDocumentListIcon,
};

interface SectionConfig {
  id: string;
  order: number;
  visible: boolean;
}

const SelfServicePortalPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [settings, setSettings] = useState<PortalSettings>({
    id: '',
    tenant_id: '',
    title: 'IT Service Portal',
    subtitle: 'Find the IT services you need',
    logo_url: '',
    banner_image_url: '',
    primary_color: '#6366f1',
    secondary_color: '#4f46e5',
    custom_css: '',
    created_at: '',
    updated_at: '',
    welcome_message: '',
    footer_text: null
  });
  
  // Section configuration state
  const [sections, setSections] = useState<SectionConfig[]>([
    { id: 'hero', order: 1, visible: true },
    { id: 'search', order: 2, visible: true },
    { id: 'quickActions', order: 3, visible: true },
    { id: 'serviceCatalog', order: 4, visible: true },
    { id: 'statusPage', order: 5, visible: true }
  ]);

  const [serviceCatalogView, setServiceCatalogView] = useState<'categories' | 'services'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch portal settings
        const portalSettings = await getPortalSettings();
        if (portalSettings) {
          setSettings(portalSettings);
          document.documentElement.style.setProperty('--color-primary', portalSettings.primary_color);
          document.documentElement.style.setProperty('--color-primary-dark', portalSettings.secondary_color);
          
          // Apply custom CSS if provided
          if (portalSettings.custom_css) {
            const styleElement = document.createElement('style');
            styleElement.textContent = portalSettings.custom_css;
            document.head.appendChild(styleElement);
            
            // Cleanup function to remove the style element when component unmounts
            return () => {
              document.head.removeChild(styleElement);
            };
          }
        }
        
        // Fetch portal section configuration
        try {
          const { data: sectionData, error: sectionError } = await supabase
            .from('portal_section_config')
            .select('*');
          
          if (sectionError) {
            console.error('Error fetching section config:', sectionError);
          } else if (sectionData && sectionData.length > 0) {
            setSections(sectionData);
          }
        } catch (sectionFetchError) {
          console.error('Error fetching section configuration:', sectionFetchError);
          // Continue with default section config if there's an error
        }
        
        // Fetch categories using the service function
        const fetchedCategories = await getServiceCatalogCategories();
        setCategories(fetchedCategories);
        console.log('SelfServicePortalPage: Fetched Categories:', fetchedCategories);
        
        // Fetch active services using the service function
        const activeServices = await getActiveServiceCatalogItems();
        setServices(activeServices);
        console.log('SelfServicePortalPage: Fetched Active Services:', activeServices);
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Helper function to render sections based on their configuration
  const renderSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.visible) return null;
    
    switch (sectionId) {
      case 'hero':
        return (
          <header key="hero" className="relative overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 z-0">
              {settings.banner_image_url ? (
                <img 
                  src={settings.banner_image_url} 
                  alt="Background" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full opacity-90" style={{
                  background: `linear-gradient(to right, ${settings.primary_color}, ${settings.secondary_color})`
                }}></div>
              )}
            </div>
            <div className="absolute inset-0 z-0 bg-black bg-opacity-30"></div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
              <div className="flex flex-col items-center justify-center">
                {settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Company Logo" 
                    className="h-20 w-auto mb-6 filter drop-shadow-lg"
                  />
                )}
                <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-md">
                  {settings.title}
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
                  {settings.subtitle}
                </p>
                {settings.welcome_message && (
                  <p className="mt-4 text-lg text-white/80 max-w-3xl mx-auto drop-shadow">
                    {settings.welcome_message}
                  </p>
                )}
              </div>
            </div>
            
            {/* Curved bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-background" style={{ 
              clipPath: 'ellipse(75% 100% at 50% 100%)'
            }}></div>
          </header>
        );
        
      case 'search':
        return (
          <div key="search" className="max-w-lg mx-auto px-4 py-4 -mt-16 relative z-10">
            <PortalSearch />
          </div>
        );
        
      case 'quickActions':
        return (
          <div key="quickActions" className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 -mt-2 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div>
                <Link 
                  to="/tickets/new" 
                  className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl p-8 h-full hover:shadow-xl transition-all flex flex-col items-center text-center group"
                >
                  <div className="rounded-full p-4 mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: settings.primary_color }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold mb-3" style={{ color: settings.primary_color }}>Create New Ticket</h2>
                  <p className="text-muted-foreground">Submit a new support request directly</p>
                </Link>
              </div>

              <div>
                <Link 
                  to="/tickets" 
                  className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl p-8 h-full hover:shadow-xl transition-all flex flex-col items-center text-center group"
                >
                  <div className="rounded-full p-4 mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: settings.primary_color }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold mb-3" style={{ color: settings.primary_color }}>My Tickets</h2>
                  <p className="text-muted-foreground">View and manage your existing tickets</p>
                </Link>
              </div>

              <div>
                <Link 
                  to="/knowledge-base" 
                  className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl p-8 h-full hover:shadow-xl transition-all flex flex-col items-center text-center group"
                >
                  <div className="rounded-full p-4 mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: settings.primary_color }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold mb-3" style={{ color: settings.primary_color }}>Knowledge Base</h2>
                  <p className="text-muted-foreground">Browse articles and self-help resources</p>
                </Link>
              </div>
            </div>
          </div>
        );
        
      case 'statusPage':
        return (
          <div key="statusPage" className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10 mb-8">
            <div className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-8 py-6 border-b border-gray-200/20">
                <h2 className="text-2xl font-semibold" style={{ color: settings.primary_color }}>System Status</h2>
                <p className="text-muted-foreground">Current status of all our systems and services</p>
              </div>
              
              <div className="p-6">
                <StatusPage primaryColor={settings.primary_color} secondaryColor={settings.secondary_color} />
              </div>
            </div>
          </div>
        );
        
      case 'serviceCatalog':
        const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
        return (
          <div key="serviceCatalog" className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10 mb-8">
            <div className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-8 py-6 border-b border-gray-200/20">
                <h2 className="text-2xl font-semibold" style={{ color: settings.primary_color }}>
                  {serviceCatalogView === 'services' ? selectedCategory?.name || 'Services' : 'Service Catalog'}
                </h2>
                <p className="text-muted-foreground">
                  {serviceCatalogView === 'services' ? `Services available under ${selectedCategory?.name || 'this category'}` : 'Browse available categories'}
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: settings.primary_color }}></div>
                </div>
              ) : (
                <div className="p-8 space-y-12">
                  {serviceCatalogView === 'categories' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {categories.map(category => (
                        <div
                          key={category.id}
                          onClick={() => {
                            setServiceCatalogView('services');
                            setSelectedCategoryId(category.id);
                          }}
                          className="cursor-pointer bg-white/60 hover:bg-white/80 border border-gray-200 rounded-lg flex flex-col overflow-hidden shadow-sm hover:shadow-md transition duration-150 ease-in-out"
                        >
                          {category.image_url ? (
                            <img 
                              src={category.image_url}
                              alt={category.name}
                              className="w-full object-cover flex-grow min-h-0"
                            />
                          ) : (
                            <div className="flex-grow flex items-center justify-center p-4 bg-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-1/3 w-1/3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="p-2 bg-white/80 backdrop-blur-sm w-full flex-shrink-0">
                            <h3 className="text-sm font-medium text-gray-800 text-center truncate">
                              {category.name}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {/* Back Button and Category Title */}
                      <div className="flex items-center mb-4">
                        <button 
                          onClick={() => setServiceCatalogView('categories')}
                          className="text-sm font-medium text-gray-600 hover:text-primary mr-3 inline-flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                          Back to Categories
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {categories.find(c => c.id === selectedCategoryId)?.name || 'Services'}
                        </h2>
                      </div>
                      
                      {/* Service Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {services
                          .filter(service => service.category_id === selectedCategoryId)
                          .map(service => (
                            <Link 
                              key={service.id}
                              to={`/services/${service.id}/request`}
                              className="block hover:no-underline"
                            >
                              <div 
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col"
                              >
                                {/* Render Icon */} 
                                <div className="mb-3">
                                  {React.createElement(
                                    iconMap[service.icon || ''] || RectangleStackIcon, // Use map, default to RectangleStackIcon
                                    { className: "h-8 w-8", style: { color: settings.primary_color } } // Style the icon
                                  )}
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold mb-2" style={{ color: settings.primary_color }}>{service.name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">{service.description}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        {services.filter(service => service.category_id === selectedCategoryId).length === 0 && (
                          <p className="text-muted-foreground col-span-full text-center py-8">No services found in this category.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  
  return (
    <div className="min-h-screen">
      {/* Render sections in the order specified by the configuration */}
      {sortedSections.map(section => renderSection(section.id))}
      
      {/* Footer */}
      {settings.footer_text && (
        <footer className="bg-gray-100 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div dangerouslySetInnerHTML={{ __html: settings.footer_text }} />
          </div>
        </footer>
      )}
    </div>
  );
};

export default SelfServicePortalPage;

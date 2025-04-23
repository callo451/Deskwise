import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveServiceCatalogItems, getServiceCatalogCategories } from '../services/serviceCatalogService';
import { getPortalSettings } from '../services/portalSettingsService';
import { useAuth } from '../contexts/AuthContext';

interface PortalSettings {
  title: string;
  subtitle: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  banner_image_url: string | null;
  welcome_message: string | null;
}

const SelfServicePortalPage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<PortalSettings>({
    title: 'IT Service Portal',
    subtitle: 'Request services and track your tickets',
    logo_url: null,
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    banner_image_url: null,
    welcome_message: 'Welcome to the IT Service Portal. How can we help you today?'
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch portal settings
        const portalSettings = await getPortalSettings();
        if (portalSettings) {
          setSettings(portalSettings);
          // Apply branding
          document.documentElement.style.setProperty('--color-primary', portalSettings.primary_color);
          document.documentElement.style.setProperty('--color-primary-dark', portalSettings.secondary_color);
        }

        // Fetch categories and services
        const [categoriesData, servicesData] = await Promise.all([
          getServiceCatalogCategories(),
          getActiveServiceCatalogItems()
        ]);
        
        setCategories(categoriesData);
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching portal data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredServices = selectedCategory 
    ? services.filter(service => service.category_id === selectedCategory)
    : services;

  return (
    <div className="min-h-screen">
      {/* Hero Header with modern gradient */}
      <header className="relative overflow-hidden min-h-[400px]">
        <div className="absolute inset-0 z-0">
          {settings.banner_image_url ? (
            <img 
              src={settings.banner_image_url} 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 w-full h-full opacity-90"></div>
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
          </div>
        </div>
        
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-background" style={{ 
          clipPath: 'ellipse(75% 100% at 50% 100%)'
        }}></div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {/* Welcome message in glassmorphic card */}
        {settings.welcome_message && (
          <div className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl p-8 mb-12 shadow-lg">
            <p className="text-xl">{settings.welcome_message}</p>
          </div>
        )}

        {/* Quick actions with glassmorphic cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <Link 
              to="/tickets/new" 
              className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl p-8 h-full hover:shadow-xl transition-all flex flex-col items-center text-center group"
            >
              <div className="rounded-full p-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500">Create New Ticket</h2>
              <p className="text-muted-foreground">Submit a new support request directly</p>
            </Link>
          </div>

          <div>
            <Link 
              to="/tickets" 
              className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl p-8 h-full hover:shadow-xl transition-all flex flex-col items-center text-center group"
            >
              <div className="rounded-full p-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500">My Tickets</h2>
              <p className="text-muted-foreground">View and manage your existing tickets</p>
            </Link>
          </div>

          <div>
            <Link 
              to="/knowledge-base" 
              className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl p-8 h-full hover:shadow-xl transition-all flex flex-col items-center text-center group"
            >
              <div className="rounded-full p-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500">Knowledge Base</h2>
              <p className="text-muted-foreground">Browse articles and self-help resources</p>
            </Link>
          </div>
        </div>

        {/* Service Catalog with glassmorphic design */}
        <div className="backdrop-blur-md bg-white/70 border border-white/15 rounded-2xl overflow-hidden mb-8 shadow-lg">
          <div className="px-8 py-6 border-b border-gray-200/20">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500">Service Catalog</h2>
            <p className="text-muted-foreground">Browse available services and make requests</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Category filter */}
              {categories.length > 0 && (
                <div className="px-8 py-4 border-b border-gray-200/20 backdrop-blur-sm">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === null
                          ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white shadow-md'
                          : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === category.id
                            ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white shadow-md'
                            : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Services grid */}
              {filteredServices.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <p className="text-muted-foreground">No services available in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="backdrop-blur-md bg-white/70 border border-white/15 rounded-xl p-6 hover:shadow-xl transition-all flex flex-col h-full group">
                      <Link
                        to={`/services/${service.id}/request`}
                        className="flex flex-col flex-grow"
                      >
                        <div className="flex items-center mb-4">
                          {service.icon && (
                            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white mr-4 group-hover:scale-110 transition-transform">
                              <span className="text-xl">{service.icon}</span>
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500">{service.name}</h3>
                            {service.description && <p className="text-sm text-muted-foreground mt-1">{service.description}</p>}
                          </div>
                        </div>
                        {service.sla && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">SLA: </span>
                            {service.sla}
                          </div>
                        )}
                      </Link>
                      <div className="mt-auto pt-4 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {service.category?.name || 'Uncategorized'}
                        </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 font-medium">Request →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SelfServicePortalPage;

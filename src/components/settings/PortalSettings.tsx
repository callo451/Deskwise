import React, { useState, useEffect } from 'react';
import { getPortalSettings, updatePortalSettings, uploadPortalImage } from '../../services/portalSettingsService';
import { Button } from '../ui/Button';
import { ChromePicker } from 'react-color';

const PortalSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    title: 'IT Service Portal',
    subtitle: 'Request services and track your tickets',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    logo_url: null as string | null,
    banner_image_url: null as string | null,
    welcome_message: 'Welcome to the IT Service Portal. How can we help you today?',
    footer_text: null as string | null,
    custom_css: null as string | null,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [showSecondaryColorPicker, setShowSecondaryColorPicker] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getPortalSettings();
      if (data) {
        setSettings({
          title: data.title,
          subtitle: data.subtitle,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          logo_url: data.logo_url,
          banner_image_url: data.banner_image_url,
          welcome_message: data.welcome_message || '',
          footer_text: data.footer_text || '',
          custom_css: data.custom_css || '',
        });
        
        // Set previews if images exist
        if (data.logo_url) setLogoPreview(data.logo_url);
        if (data.banner_image_url) setBannerPreview(data.banner_image_url);
      }
    } catch (error) {
      console.error('Error fetching portal settings:', error);
      setErrorMessage('Failed to load portal settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  interface ColorResult {
    hex: string;
    rgb: { r: number; g: number; b: number; a?: number };
    hsl: { h: number; s: number; l: number; a?: number };
  }

  const handleColorChange = (color: ColorResult, type: 'primary' | 'secondary') => {
    setSettings(prev => ({
      ...prev,
      [type === 'primary' ? 'primary_color' : 'secondary_color']: color.hex
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setLogoFile(file);
          setLogoPreview(reader.result as string);
        } else {
          setBannerFile(file);
          setBannerPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Upload files if selected
      let updatedSettings = { ...settings };
      
      if (logoFile) {
        const logoUrl = await uploadPortalImage(logoFile, 'logo');
        updatedSettings.logo_url = logoUrl;
      }
      
      if (bannerFile) {
        const bannerUrl = await uploadPortalImage(bannerFile, 'banner');
        updatedSettings.banner_image_url = bannerUrl;
      }
      
      // Update settings
      await updatePortalSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccessMessage('Portal settings saved successfully');
      
      // Reset file inputs
      setLogoFile(null);
      setBannerFile(null);
    } catch (error) {
      console.error('Error saving portal settings:', error);
      setErrorMessage('Failed to save portal settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // Open the portal in a new tab/window
    window.open('/portal', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Portal Settings</h2>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handlePreview}
          >
            Preview Portal
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
      
      {successMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          {errorMessage}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">General Settings</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Portal Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={settings.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                Portal Subtitle
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={settings.subtitle}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {/* Welcome Message */}
          <div>
            <label htmlFor="welcome_message" className="block text-sm font-medium text-gray-700 mb-1">
              Welcome Message
            </label>
            <textarea
              id="welcome_message"
              name="welcome_message"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={settings.welcome_message || ''}
              onChange={handleInputChange}
            />
          </div>
          
          {/* Footer Text */}
          <div>
            <label htmlFor="footer_text" className="block text-sm font-medium text-gray-700 mb-1">
              Footer Text
            </label>
            <input
              type="text"
              id="footer_text"
              name="footer_text"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={settings.footer_text || ''}
              onChange={handleInputChange}
              placeholder="© 2025 Your Company Name"
            />
          </div>
        </div>
        
        {/* Branding */}
        <div className="px-6 py-4 border-t border-b border-gray-200">
          <h3 className="text-lg font-medium">Branding</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex items-center">
                <div
                  className="h-10 w-10 rounded-md cursor-pointer border border-gray-300"
                  style={{ backgroundColor: settings.primary_color }}
                  onClick={() => setShowPrimaryColorPicker(!showPrimaryColorPicker)}
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="ml-3 rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              {showPrimaryColorPicker && (
                <div className="absolute mt-2 z-10">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowPrimaryColorPicker(false)}
                  />
                  <ChromePicker
                    color={settings.primary_color}
                    onChange={(color: ColorResult) => handleColorChange(color, 'primary')}
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Color
              </label>
              <div className="flex items-center">
                <div
                  className="h-10 w-10 rounded-md cursor-pointer border border-gray-300"
                  style={{ backgroundColor: settings.secondary_color }}
                  onClick={() => setShowSecondaryColorPicker(!showSecondaryColorPicker)}
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="ml-3 rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              {showSecondaryColorPicker && (
                <div className="absolute mt-2 z-10">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowSecondaryColorPicker(false)}
                  />
                  <ChromePicker
                    color={settings.secondary_color}
                    onChange={(color: ColorResult) => handleColorChange(color, 'secondary')}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-20 w-auto object-contain border border-gray-200 rounded-md p-2"
                  />
                ) : (
                  <div className="h-20 w-40 border border-gray-200 rounded-md flex items-center justify-center text-gray-400">
                    No logo
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'logo')}
                />
                <label
                  htmlFor="logo"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                >
                  Upload Logo
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Recommended size: 200x50 pixels
                </p>
              </div>
            </div>
          </div>
          
          {/* Banner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Image
            </label>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner Preview"
                    className="h-24 w-auto object-cover border border-gray-200 rounded-md"
                  />
                ) : (
                  <div className="h-24 w-48 border border-gray-200 rounded-md flex items-center justify-center text-gray-400">
                    No banner
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="banner"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'banner')}
                />
                <label
                  htmlFor="banner"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                >
                  Upload Banner
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Recommended size: 1920x400 pixels
                </p>
              </div>
            </div>
          </div>
          
          {/* Custom CSS */}
          <div>
            <label htmlFor="custom_css" className="block text-sm font-medium text-gray-700 mb-1">
              Custom CSS
            </label>
            <textarea
              id="custom_css"
              name="custom_css"
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
              value={settings.custom_css || ''}
              onChange={handleInputChange}
              placeholder=".custom-class { color: #333; }"
            />
            <p className="mt-1 text-sm text-gray-500">
              Add custom CSS to further customize the appearance of your portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalSettings;

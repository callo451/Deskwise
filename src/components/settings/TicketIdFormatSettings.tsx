import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { 
  fetchTicketIdSettings, 
  updateTicketIdSettings,
  generateTicketIdPreview,
  TicketIdSettings
} from '../../services/ticketSettingsService';

const TicketIdFormatSettings: React.FC = () => {
  const { userDetails } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TicketIdSettings | null>(null);
  const [formData, setFormData] = useState({
    prefix: '',
    suffix: '',
    paddingLength: 4,
    nextNumber: 1
  });
  const [previewNumber, setPreviewNumber] = useState(1);

  useEffect(() => {
    if (userDetails?.tenant_id) {
      loadSettings();
    }
  }, [userDetails?.tenant_id]);

  const loadSettings = async () => {
    if (!userDetails?.tenant_id) return;
    
    setLoading(true);
    try {
      const data = await fetchTicketIdSettings(userDetails.tenant_id);
      if (data) {
        setSettings(data);
        setFormData({
          prefix: data.prefix,
          suffix: data.suffix,
          paddingLength: data.padding_length,
          nextNumber: data.next_number
        });
        setPreviewNumber(data.next_number);
      } else {
        // Set defaults if no settings found
        setFormData({
          prefix: 'TKT-',
          suffix: '',
          paddingLength: 4,
          nextNumber: 1
        });
      }
    } catch (error) {
      console.error('Error loading ticket ID settings:', error);
      toast.error('Failed to load ticket ID settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userDetails?.tenant_id) {
      toast.error('Tenant ID is missing');
      return;
    }
    
    setSaving(true);
    try {
      const updatedSettings = await updateTicketIdSettings(userDetails.tenant_id, {
        prefix: formData.prefix,
        suffix: formData.suffix,
        padding_length: formData.paddingLength,
        next_number: formData.nextNumber
      });
      
      setSettings(updatedSettings);
      toast.success('Ticket ID format settings saved successfully');
    } catch (error) {
      console.error('Error saving ticket ID settings:', error);
      toast.error('Failed to save ticket ID settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'paddingLength') {
      const paddingLength = parseInt(value);
      if (isNaN(paddingLength) || paddingLength < 1 || paddingLength > 10) return;
      setFormData({ ...formData, paddingLength });
    } else if (name === 'nextNumber') {
      const nextNumber = parseInt(value);
      if (isNaN(nextNumber) || nextNumber < 1) return;
      setFormData({ ...formData, nextNumber });
      setPreviewNumber(nextNumber);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePreviewNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPreviewNumber(value);
    }
  };

  const getPreview = () => {
    return generateTicketIdPreview({
      prefix: formData.prefix,
      suffix: formData.suffix,
      padding_length: formData.paddingLength
    }, previewNumber);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-6">Ticket ID Format Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 mb-1">
            Prefix
          </label>
          <input
            type="text"
            id="prefix"
            name="prefix"
            value={formData.prefix}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="e.g., TKT-"
          />
          <p className="mt-1 text-sm text-gray-500">
            Text that appears before the ticket number (e.g., "TKT-")
          </p>
        </div>
        
        <div>
          <label htmlFor="paddingLength" className="block text-sm font-medium text-gray-700 mb-1">
            Number Padding Length
          </label>
          <input
            type="number"
            id="paddingLength"
            name="paddingLength"
            value={formData.paddingLength}
            onChange={handleChange}
            min="1"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <p className="mt-1 text-sm text-gray-500">
            Number of digits to pad with leading zeros (e.g., 4 for "0001")
          </p>
        </div>
        
        <div>
          <label htmlFor="suffix" className="block text-sm font-medium text-gray-700 mb-1">
            Suffix
          </label>
          <input
            type="text"
            id="suffix"
            name="suffix"
            value={formData.suffix}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="e.g., -IT"
          />
          <p className="mt-1 text-sm text-gray-500">
            Text that appears after the ticket number (e.g., "-IT")
          </p>
        </div>
        
        <div>
          <label htmlFor="nextNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Next Ticket Number
          </label>
          <input
            type="number"
            id="nextNumber"
            name="nextNumber"
            value={formData.nextNumber}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <p className="mt-1 text-sm text-gray-500">
            The next number to be used for new tickets
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="number"
                value={previewNumber}
                onChange={handlePreviewNumberChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Preview number"
              />
            </div>
            <div className="flex-1">
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-mono">
                {getPreview()}
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Enter different numbers to see how the ticket ID will look
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketIdFormatSettings;

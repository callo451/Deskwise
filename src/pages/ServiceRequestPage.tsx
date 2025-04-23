import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceCatalogItem, createTicketFromService } from '../services/serviceCatalogService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const ServiceRequestPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      
      setIsLoading(true);
      try {
        const serviceData = await getServiceCatalogItem(serviceId);
        setService(serviceData);
        
        // Initialize form data with empty values
        if (serviceData.form_fields) {
          const initialData: Record<string, any> = {};
          serviceData.form_fields.forEach((field: any) => {
            initialData[field.id] = field.type === 'checkbox' ? false : '';
          });
          setFormData(initialData);
        }
      } catch (err: any) {
        console.error('Error fetching service:', err);
        setError(err.message || 'Failed to load service');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (service?.form_fields) {
      service.form_fields.forEach((field: any) => {
        if (field.required) {
          const value = formData[field.id];
          if (
            value === undefined || 
            value === null || 
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0)
          ) {
            errors[field.id] = 'This field is required';
          }
        }
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!user || !serviceId) {
      setError('User information or service ID is missing');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Add description field from the form data if it exists
      const description = formData.description || '';
      
      // Create ticket from service request
      const ticket = await createTicketFromService(
        serviceId,
        { ...formData, description },
        user.id
      );
      
      // Redirect to the ticket detail page
      navigate(`/tickets/${ticket.id}`, { 
        state: { 
          success: true, 
          message: 'Your service request has been submitted successfully.' 
        } 
      });
    } catch (err: any) {
      console.error('Error submitting service request:', err);
      setError(err.message || 'Failed to submit service request');
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field: any) => {
    const { id, type, label, placeholder, required, options } = field;
    const error = validationErrors[id];
    
    switch (type) {
      case 'text':
        return (
          <div key={id} className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id={id}
              className={`w-full rounded-md border ${
                error ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              placeholder={placeholder}
              value={formData[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'textarea':
        return (
          <div key={id} className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={id}
              className={`w-full rounded-md border ${
                error ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              placeholder={placeholder}
              rows={4}
              value={formData[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'select':
        return (
          <div key={id} className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={id}
              className={`w-full rounded-md border ${
                error ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              value={formData[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
            >
              <option value="">{placeholder || 'Select an option'}</option>
              {options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={id} className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={id}
                className={`h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary ${
                  error ? 'border-red-500' : ''
                }`}
                checked={formData[id] || false}
                onChange={(e) => handleInputChange(id, e.target.checked)}
              />
              <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'radio':
        return (
          <div key={id} className="mb-4">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
              </legend>
              <div className="space-y-2">
                {options?.map((option: string) => (
                  <div key={option} className="flex items-center">
                    <input
                      id={`${id}-${option}`}
                      name={id}
                      type="radio"
                      className={`h-4 w-4 text-primary border-gray-300 focus:ring-primary ${
                        error ? 'border-red-500' : ''
                      }`}
                      value={option}
                      checked={formData[id] === option}
                      onChange={() => handleInputChange(id, option)}
                    />
                    <label htmlFor={`${id}-${option}`} className="ml-2 block text-sm text-gray-700">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'date':
        return (
          <div key={id} className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              id={id}
              className={`w-full rounded-md border ${
                error ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              value={formData[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'file':
        return (
          <div key={id} className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor={id}
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>Upload a file</span>
                    <input
                      id={id}
                      name={id}
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleInputChange(id, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
            {formData[id] && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {formData[id].name}
              </p>
            )}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error || 'Service not found'}</p>
          <Button onClick={() => navigate('/services')}>
            Return to Service Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold">{service.name}</h1>
          {service.description && (
            <p className="mt-1 text-gray-600">{service.description}</p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Default description field if not provided in form_fields */}
          {!service.form_fields?.some((f: any) => f.id === 'description') && (
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                className={`w-full rounded-md border ${
                  validationErrors.description ? 'border-red-500' : 'border-gray-300'
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="Please describe what you need..."
                rows={4}
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
              )}
            </div>
          )}
          
          {/* Custom form fields */}
          {service.form_fields?.map((field: any) => renderFormField(field))}
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {/* Submit button */}
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/services')}
              className="mr-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestPage;

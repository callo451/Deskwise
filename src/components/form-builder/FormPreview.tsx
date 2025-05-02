import React, { useState, useEffect } from 'react';
import { 
  FormDesign, 
  FormField, 
  FormFieldRouting,
  FormFieldCondition
} from '../../types/formBuilder';

interface FormPreviewProps {
  formDesign: FormDesign;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ formDesign }) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>({});
  
  // Initialize all fields as visible and with their default required state
  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    const initialRequired: Record<string, boolean> = {};
    
    Object.values(formDesign.fields).forEach(field => {
      initialVisibility[field.id] = true;
      initialRequired[field.id] = field.required;
    });
    
    setVisibleFields(initialVisibility);
    setRequiredFields(initialRequired);
  }, [formDesign]);
  
  // Apply routing rules when form values change
  useEffect(() => {
    if (Object.keys(formValues).length === 0) return;
    
    // Start with all fields visible and with their default required state
    const newVisibility: Record<string, boolean> = {};
    const newRequired: Record<string, boolean> = {};
    
    Object.values(formDesign.fields).forEach(field => {
      newVisibility[field.id] = true;
      newRequired[field.id] = field.required;
    });
    
    // Apply each routing rule
    formDesign.routing.forEach(rule => {
      const conditionsMet = evaluateConditions(rule.conditions, rule.logicOperator);
      
      if (conditionsMet) {
        rule.targetFieldIds.forEach(targetId => {
          switch (rule.action) {
            case 'show':
              newVisibility[targetId] = true;
              break;
            case 'hide':
              newVisibility[targetId] = false;
              break;
            case 'require':
              newRequired[targetId] = true;
              break;
            // Skip action would be handled in a real form submission flow
            default:
              break;
          }
        });
      }
    });
    
    setVisibleFields(newVisibility);
    setRequiredFields(newRequired);
  }, [formValues, formDesign]);
  
  // Evaluate if conditions are met based on form values
  const evaluateConditions = (
    conditions: FormFieldCondition[], 
    logicOperator: 'AND' | 'OR'
  ): boolean => {
    if (conditions.length === 0) return true;
    
    const results = conditions.map(condition => {
      const fieldValue = formValues[condition.sourceFieldId] || '';
      const conditionValue = condition.value;
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === conditionValue;
        case 'notEquals':
          return fieldValue !== conditionValue;
        case 'contains':
          return typeof fieldValue === 'string' && fieldValue.includes(conditionValue);
        case 'notContains':
          return typeof fieldValue === 'string' && !fieldValue.includes(conditionValue);
        case 'greaterThan':
          return Number(fieldValue) > Number(conditionValue);
        case 'lessThan':
          return Number(fieldValue) < Number(conditionValue);
        case 'startsWith':
          return typeof fieldValue === 'string' && fieldValue.startsWith(conditionValue);
        case 'endsWith':
          return typeof fieldValue === 'string' && fieldValue.endsWith(conditionValue);
        default:
          return false;
      }
    });
    
    return logicOperator === 'AND' 
      ? results.every(result => result) 
      : results.some(result => result);
  };
  
  // Handle form value changes
  const handleChange = (fieldId: string, value: any) => {
    setFormValues({
      ...formValues,
      [fieldId]: value
    });
  };
  
  // Render a form field based on its type
  const renderField = (field: FormField) => {
    if (!visibleFields[field.id]) return null;
    
    const isRequired = requiredFields[field.id];
    
    switch (field.type) {
      case 'heading':
        return (
          <div className="py-2">
            <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
          </div>
        );
      case 'paragraph':
        return (
          <div className="py-2">
            <p className="text-sm text-gray-500">{field.label}</p>
          </div>
        );
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
        return (
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={formValues[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              required={isRequired}
            />
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={formValues[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              rows={4}
              required={isRequired}
            />
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'select':
        return (
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={formValues[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              required={isRequired}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {(field.options || []).map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="py-2">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={!!formValues[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                  required={isRequired}
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">
                  {field.label}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.helpText && (
                  <p className="text-gray-500">{field.helpText}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'radio':
        return (
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="radio"
                    id={`${field.id}-${idx}`}
                    name={field.id}
                    value={option}
                    checked={formValues[field.id] === option}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                    required={isRequired}
                  />
                  <label htmlFor={`${field.id}-${idx}`} className="ml-3 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'date':
        return (
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={formValues[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              required={isRequired}
            />
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
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
                    htmlFor={`file-upload-${field.id}`}
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id={`file-upload-${field.id}`}
                      name={`file-upload-${field.id}`}
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleChange(field.id, file.name);
                        }
                      }}
                      required={isRequired}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  {formValues[field.id] || 'No file selected'}
                </p>
              </div>
            </div>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  
  // Render fields by section
  const renderSectionFields = (sectionId: string) => {
    const section = formDesign.sections.find(s => s.id === sectionId);
    if (!section) return null;
    
    return (
      <div key={sectionId} className="mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-gray-500 mt-1">{section.description}</p>
          )}
        </div>
        
        <div className="space-y-4">
          {section.fieldIds.map(fieldId => {
            const field = formDesign.fields[fieldId];
            if (!field) return null;
            
            return (
              <div 
                key={fieldId} 
                className={`${
                  field.width === 'full' ? 'w-full' : 
                  field.width === 'half' ? 'w-1/2' : 
                  'w-1/3'
                } ${field.width !== 'full' ? 'inline-block pr-4' : ''}`}
              >
                {renderField(field)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form submitted with values: ' + JSON.stringify(formValues, null, 2));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Form Preview</h3>
        <div className="text-sm text-gray-500">
          Test your form with conditional logic
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit}>
          {formDesign.sections.map(section => renderSectionFields(section.id))}
          
          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This is a preview of how your form will appear to users. 
              Try filling out fields to test your conditional logic rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

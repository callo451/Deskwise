import React, { useState } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { FormField as FormFieldType, FieldType, FieldWidth } from '../../types/formBuilder';

interface FormFieldProps {
  field: FormFieldType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormFieldType>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const getFieldTypeLabel = (type: FieldType): string => {
    switch (type) {
      case 'text': return 'Text Field';
      case 'textarea': return 'Text Area';
      case 'select': return 'Dropdown';
      case 'checkbox': return 'Checkbox';
      case 'radio': return 'Radio Buttons';
      case 'date': return 'Date Picker';
      case 'file': return 'File Upload';
      case 'heading': return 'Heading';
      case 'paragraph': return 'Paragraph';
      case 'number': return 'Number';
      case 'email': return 'Email';
      case 'phone': return 'Phone';
      case 'section': return 'Section Divider';
      default: return 'Field';
    }
  };
  
  const getFieldWidthClass = (width: FieldWidth): string => {
    switch (width) {
      case 'half': return 'w-1/2';
      case 'third': return 'w-1/3';
      default: return 'w-full';
    }
  };
  
  const renderFieldPreview = () => {
    switch (field.type) {
      case 'heading':
        return (
          <div className="py-1">
            <h3 className="font-semibold text-gray-900">{field.label}</h3>
          </div>
        );
      case 'paragraph':
        return (
          <div className="py-1">
            <p className="text-sm text-gray-500">{field.label}</p>
          </div>
        );
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
        return (
          <div className="py-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-400 text-sm">
              {field.placeholder || `Enter ${field.label.toLowerCase()}`}
            </div>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div className="py-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-400 text-sm h-20">
              {field.placeholder || `Enter ${field.label.toLowerCase()}`}
            </div>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'select':
        return (
          <div className="py-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-400 text-sm flex justify-between items-center">
              <span>{field.placeholder || 'Select an option'}</span>
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="py-1">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  disabled
                  className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.helpText && (
                  <p className="text-xs text-gray-500">{field.helpText}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'radio':
        return (
          <div className="py-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="radio"
                    disabled
                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                  />
                  <label className="ml-3 text-sm text-gray-700">
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
          <div className="py-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-400 text-sm">
              MM/DD/YYYY
            </div>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="py-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 bg-gray-50 text-gray-400 text-sm text-center">
              Click or drag file to upload
            </div>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
          </div>
        );
      default:
        return (
          <div className="py-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-400 text-sm">
              Field preview
            </div>
          </div>
        );
    }
  };
  
  const renderFieldEditor = () => {
    return (
      <div className="space-y-4 p-4 bg-white rounded-md shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
        </div>
        
        {field.type !== 'heading' && field.type !== 'paragraph' && field.type !== 'checkbox' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder Text
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Help Text
          </label>
          <input
            type="text"
            value={field.helpText || ''}
            onChange={(e) => onUpdate({ helpText: e.target.value })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
        </div>
        
        {field.type !== 'heading' && field.type !== 'paragraph' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`required-${field.id}`}
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor={`required-${field.id}`} className="ml-2 block text-sm text-gray-700">
              Required Field
            </label>
          </div>
        )}
        
        {(field.type === 'select' || field.type === 'radio') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options (one per line)
            </label>
            <textarea
              value={(field.options || []).join('\n')}
              onChange={(e) => onUpdate({ 
                options: e.target.value.split('\n').filter(o => o.trim() !== '') 
              })}
              rows={4}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Width
          </label>
          <select
            value={field.width}
            onChange={(e) => onUpdate({ width: e.target.value as FieldWidth })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          >
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
            <option value="third">One Third Width</option>
          </select>
        </div>
        
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`border rounded-md ${
        isSelected 
          ? 'border-primary-300 ring-1 ring-primary-200' 
          : 'border-gray-200 hover:border-gray-300'
      } ${isEditing ? 'bg-gray-50' : 'bg-white'}`}
      onClick={() => {
        if (!isEditing) {
          onSelect();
        }
      }}
    >
      <div className="p-3">
        {!isEditing ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 mr-2 cursor-grab" />
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {getFieldTypeLabel(field.type)}
                </span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Edit Field"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Duplicate Field"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to remove this field?')) {
                      onRemove();
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Remove Field"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className={getFieldWidthClass(field.width)}>
              {renderFieldPreview()}
            </div>
          </>
        ) : (
          renderFieldEditor()
        )}
      </div>
    </div>
  );
};

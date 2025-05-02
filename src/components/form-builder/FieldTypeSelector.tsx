import React, { useEffect, useRef } from 'react';
import { FieldType } from '../../types/formBuilder';

interface FieldTypeSelectorProps {
  position: { x: number; y: number };
  onSelect: (type: FieldType) => void;
  onClose: () => void;
}

interface FieldTypeOption {
  type: FieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'basic' | 'input' | 'choice' | 'layout';
}

export const FieldTypeSelector: React.FC<FieldTypeSelectorProps> = ({
  position,
  onSelect,
  onClose
}) => {
  const selectorRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Adjust position to ensure it's visible within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y, window.innerHeight - 400)
  };
  
  const fieldTypes: FieldTypeOption[] = [
    // Basic inputs
    {
      type: 'text',
      label: 'Text Field',
      description: 'Single line text input',
      icon: <span className="text-lg">Aa</span>,
      category: 'basic'
    },
    {
      type: 'textarea',
      label: 'Text Area',
      description: 'Multi-line text input',
      icon: <span className="text-lg">¶</span>,
      category: 'basic'
    },
    {
      type: 'number',
      label: 'Number',
      description: 'Numeric input field',
      icon: <span className="text-lg">123</span>,
      category: 'basic'
    },
    {
      type: 'email',
      label: 'Email',
      description: 'Email address input',
      icon: <span className="text-lg">@</span>,
      category: 'input'
    },
    {
      type: 'phone',
      label: 'Phone',
      description: 'Phone number input',
      icon: <span className="text-lg">📞</span>,
      category: 'input'
    },
    {
      type: 'date',
      label: 'Date',
      description: 'Date picker',
      icon: <span className="text-lg">📅</span>,
      category: 'input'
    },
    {
      type: 'file',
      label: 'File Upload',
      description: 'File attachment field',
      icon: <span className="text-lg">📎</span>,
      category: 'input'
    },
    
    // Choice fields
    {
      type: 'select',
      label: 'Dropdown',
      description: 'Select from a list of options',
      icon: <span className="text-lg">▼</span>,
      category: 'choice'
    },
    {
      type: 'checkbox',
      label: 'Checkbox',
      description: 'Single checkbox for yes/no options',
      icon: <span className="text-lg">☑</span>,
      category: 'choice'
    },
    {
      type: 'radio',
      label: 'Radio Buttons',
      description: 'Choose one from multiple options',
      icon: <span className="text-lg">◉</span>,
      category: 'choice'
    },
    
    // Layout elements
    {
      type: 'heading',
      label: 'Heading',
      description: 'Section title',
      icon: <span className="text-lg">H</span>,
      category: 'layout'
    },
    {
      type: 'paragraph',
      label: 'Paragraph',
      description: 'Informational text block',
      icon: <span className="text-lg">¶</span>,
      category: 'layout'
    },
    {
      type: 'section',
      label: 'Section Divider',
      description: 'Visual separator between fields',
      icon: <span className="text-lg">—</span>,
      category: 'layout'
    }
  ];
  
  const categories = [
    { id: 'basic', label: 'Basic Fields' },
    { id: 'input', label: 'Input Types' },
    { id: 'choice', label: 'Choice Fields' },
    { id: 'layout', label: 'Layout Elements' }
  ];

  return (
    <div 
      ref={selectorRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-80"
      style={{ 
        top: `${adjustedPosition.y}px`, 
        left: `${adjustedPosition.x}px`,
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Add Field</h3>
        <p className="text-sm text-gray-500">Select a field type to add</p>
      </div>
      
      <div className="p-2">
        {categories.map(category => (
          <div key={category.id} className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
              {category.label}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {fieldTypes
                .filter(field => field.category === category.id)
                .map(field => (
                  <button
                    key={field.type}
                    onClick={() => onSelect(field.type)}
                    className="flex flex-col items-center text-center p-3 rounded-md border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="w-8 h-8 flex items-center justify-center text-gray-700 mb-1">
                      {field.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{field.label}</span>
                    <span className="text-xs text-gray-500 mt-1">{field.description}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

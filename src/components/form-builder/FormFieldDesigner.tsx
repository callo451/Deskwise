import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowsUpDownIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { FormSection as FormSectionComponent } from './FormSection';
import { FieldTypeSelector } from './FieldTypeSelector';
import { RoutingBuilder } from './RoutingBuilder';
import { FormPreview } from './FormPreview';
import { 
  FormField, 
  FormSection, 
  FormDesign, 
  FormFieldRouting,
  FieldType
} from '../../types/formBuilder';

interface FormFieldDesignerProps {
  initialDesign?: FormDesign;
  onChange?: (design: FormDesign) => void;
}

const defaultFormDesign: FormDesign = {
  sections: [
    {
      id: 'section_default',
      title: 'General Information',
      description: 'Please provide the following information',
      collapsed: false,
      fieldIds: []
    }
  ],
  fields: {},
  routing: []
};

export const FormFieldDesigner: React.FC<FormFieldDesignerProps> = ({
  initialDesign,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'routing' | 'preview'>('fields');
  const [formDesign, setFormDesign] = useState<FormDesign>(initialDesign || defaultFormDesign);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    formDesign.sections.length > 0 ? formDesign.sections[0].id : null
  );
  const [showFieldTypeSelector, setShowFieldTypeSelector] = useState(false);
  const [fieldTypeSelectorPosition, setFieldTypeSelectorPosition] = useState({ x: 0, y: 0 });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Sync with parent component when design changes
  useEffect(() => {
    if (onChange) {
      onChange(formDesign);
    }
  }, [formDesign, onChange]);

  // Initialize with default section if none exists
  useEffect(() => {
    if (formDesign.sections.length === 0) {
      addSection();
    }
  }, []);

  // Handle adding a new field
  const handleAddField = (type: FieldType) => {
    if (!activeSectionId) return;

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: getDefaultLabelForType(type),
      placeholder: '',
      helpText: '',
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : [],
      sectionId: activeSectionId,
      width: 'full'
    };

    // Update the fields object
    const updatedFields = {
      ...formDesign.fields,
      [newField.id]: newField
    };

    // Update the section's fieldIds array
    const updatedSections = formDesign.sections.map(section => {
      if (section.id === activeSectionId) {
        return {
          ...section,
          fieldIds: [...section.fieldIds, newField.id]
        };
      }
      return section;
    });

    setFormDesign({
      ...formDesign,
      fields: updatedFields,
      sections: updatedSections
    });

    setShowFieldTypeSelector(false);
  };

  // Get default label based on field type
  const getDefaultLabelForType = (type: FieldType): string => {
    switch (type) {
      case 'heading':
        return 'Section Heading';
      case 'paragraph':
        return 'Informational Text';
      case 'email':
        return 'Email Address';
      case 'phone':
        return 'Phone Number';
      default:
        return 'New Field';
    }
  };

  // Handle adding a new section
  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      description: '',
      collapsed: false,
      fieldIds: []
    };

    setFormDesign({
      ...formDesign,
      sections: [...formDesign.sections, newSection]
    });

    setActiveSectionId(newSection.id);
  };

  // Handle updating a field
  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormDesign({
      ...formDesign,
      fields: {
        ...formDesign.fields,
        [fieldId]: {
          ...formDesign.fields[fieldId],
          ...updates
        }
      }
    });
  };

  // Handle duplicating a field
  const handleDuplicateField = (fieldId: string) => {
    const fieldToDuplicate = formDesign.fields[fieldId];
    if (!fieldToDuplicate) return;

    const newField: FormField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      label: `${fieldToDuplicate.label} (Copy)`
    };

    // Update the fields object
    const updatedFields = {
      ...formDesign.fields,
      [newField.id]: newField
    };

    // Update the section's fieldIds array
    const updatedSections = formDesign.sections.map(section => {
      if (section.id === newField.sectionId) {
        // Find the index of the original field
        const originalIndex = section.fieldIds.indexOf(fieldId);
        // Create a new array with the duplicated field right after the original
        const newFieldIds = [...section.fieldIds];
        newFieldIds.splice(originalIndex + 1, 0, newField.id);
        
        return {
          ...section,
          fieldIds: newFieldIds
        };
      }
      return section;
    });

    setFormDesign({
      ...formDesign,
      fields: updatedFields,
      sections: updatedSections
    });
  };

  // Handle removing a field
  const handleRemoveField = (fieldId: string) => {
    const field = formDesign.fields[fieldId];
    if (!field) return;

    // Create a copy of fields without the removed field
    const { [fieldId]: removedField, ...remainingFields } = formDesign.fields;

    // Update the section's fieldIds array
    const updatedSections = formDesign.sections.map(section => {
      if (section.id === field.sectionId) {
        return {
          ...section,
          fieldIds: section.fieldIds.filter(id => id !== fieldId)
        };
      }
      return section;
    });

    // Remove any routing rules that reference this field
    const updatedRouting = formDesign.routing.filter(rule => {
      // Remove rules where this field is the source
      const hasFieldAsSource = rule.conditions.some(
        condition => condition.sourceFieldId === fieldId
      );
      
      // Remove rules where this field is a target
      const hasFieldAsTarget = rule.targetFieldIds.includes(fieldId);
      
      return !hasFieldAsSource && !hasFieldAsTarget;
    });

    setFormDesign({
      ...formDesign,
      fields: remainingFields,
      sections: updatedSections,
      routing: updatedRouting
    });

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  // Handle updating a section
  const handleUpdateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setFormDesign({
      ...formDesign,
      sections: formDesign.sections.map(section => {
        if (section.id === sectionId) {
          return { ...section, ...updates };
        }
        return section;
      })
    });
  };

  // Handle removing a section
  const handleRemoveSection = (sectionId: string) => {
    // Get all field IDs in this section
    const section = formDesign.sections.find(s => s.id === sectionId);
    if (!section) return;

    // Create a copy of fields without the fields in the removed section
    const remainingFields = { ...formDesign.fields };
    section.fieldIds.forEach(fieldId => {
      delete remainingFields[fieldId];
    });

    // Remove the section
    const updatedSections = formDesign.sections.filter(s => s.id !== sectionId);

    // Remove any routing rules that reference fields in this section
    const updatedRouting = formDesign.routing.filter(rule => {
      // Remove rules where a field in this section is the source
      const hasFieldAsSource = rule.conditions.some(
        condition => formDesign.fields[condition.sourceFieldId]?.sectionId === sectionId
      );
      
      // Remove rules where a field in this section is a target
      const hasFieldAsTarget = rule.targetFieldIds.some(
        targetId => formDesign.fields[targetId]?.sectionId === sectionId
      );
      
      return !hasFieldAsSource && !hasFieldAsTarget;
    });

    setFormDesign({
      ...formDesign,
      fields: remainingFields,
      sections: updatedSections,
      routing: updatedRouting
    });

    // If we removed the active section, set a new active section
    if (activeSectionId === sectionId && updatedSections.length > 0) {
      setActiveSectionId(updatedSections[0].id);
    } else if (updatedSections.length === 0) {
      setActiveSectionId(null);
    }

    if (selectedFieldId && formDesign.fields[selectedFieldId]?.sectionId === sectionId) {
      setSelectedFieldId(null);
    }
  };

  // Handle showing the field type selector
  const handleShowFieldTypeSelector = (event: React.MouseEvent) => {
    setFieldTypeSelectorPosition({ 
      x: event.clientX, 
      y: event.clientY 
    });
    setShowFieldTypeSelector(true);
  };

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Handle section reordering
    if (type === 'section') {
      const newSections = Array.from(formDesign.sections);
      const [movedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, movedSection);
      
      setFormDesign({
        ...formDesign,
        sections: newSections
      });
      return;
    }
    
    // Handle field reordering within the same section
    if (destination.droppableId === source.droppableId) {
      const sectionId = destination.droppableId;
      const section = formDesign.sections.find(s => s.id === sectionId);
      if (!section) return;
      
      const newFieldIds = Array.from(section.fieldIds);
      const [movedFieldId] = newFieldIds.splice(source.index, 1);
      newFieldIds.splice(destination.index, 0, movedFieldId);
      
      setFormDesign({
        ...formDesign,
        sections: formDesign.sections.map(s => {
          if (s.id === sectionId) {
            return { ...s, fieldIds: newFieldIds };
          }
          return s;
        })
      });
    } else {
      // Handle field moving between sections
      const sourceSection = formDesign.sections.find(s => s.id === source.droppableId);
      const destSection = formDesign.sections.find(s => s.id === destination.droppableId);
      
      if (!sourceSection || !destSection) return;
      
      const sourceFieldIds = Array.from(sourceSection.fieldIds);
      const destFieldIds = Array.from(destSection.fieldIds);
      
      const [movedFieldId] = sourceFieldIds.splice(source.index, 1);
      destFieldIds.splice(destination.index, 0, movedFieldId);
      
      // Update the field's sectionId
      setFormDesign({
        ...formDesign,
        fields: {
          ...formDesign.fields,
          [movedFieldId]: {
            ...formDesign.fields[movedFieldId],
            sectionId: destination.droppableId
          }
        },
        sections: formDesign.sections.map(s => {
          if (s.id === source.droppableId) {
            return { ...s, fieldIds: sourceFieldIds };
          }
          if (s.id === destination.droppableId) {
            return { ...s, fieldIds: destFieldIds };
          }
          return s;
        })
      });
    }
  };

  // Handle updating routing rules
  const handleUpdateRouting = (routing: FormFieldRouting[]) => {
    setFormDesign({
      ...formDesign,
      routing
    });
  };

  // Render the tabs
  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('fields')}
          className={`${
            activeTab === 'fields'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Form Builder
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`${
            activeTab === 'routing'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
        >
          <ArrowsUpDownIcon className="h-4 w-4 mr-2" />
          Conditional Logic
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`${
            activeTab === 'preview'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview Form
        </button>
      </nav>
    </div>
  );

  // Render the form builder tab
  const renderFormBuilder = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Form Builder</h3>
        <Button 
          onClick={addSection}
          size="sm"
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Section
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections" type="section">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-6"
            >
              {formDesign.sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <FormSectionComponent
                        key={section.id}
                        section={section}
                        fields={formDesign.fields}
                        isActive={section.id === activeSectionId}
                        onSectionClick={() => setActiveSectionId(section.id)}
                        onUpdateSection={(updates) => handleUpdateSection(section.id, updates)}
                        onRemoveSection={() => handleRemoveSection(section.id)}
                        onAddField={handleShowFieldTypeSelector}
                        onUpdateField={handleUpdateField}
                        onRemoveField={handleRemoveField}
                        onDuplicateField={handleDuplicateField}
                        selectedFieldId={selectedFieldId}
                        onSelectField={setSelectedFieldId}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {formDesign.sections.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No sections added yet. Add a section to get started.</p>
          <Button 
            onClick={addSection}
            variant="outline"
            className="mt-4"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Section
          </Button>
        </div>
      )}

      {showFieldTypeSelector && (
        <FieldTypeSelector
          position={fieldTypeSelectorPosition}
          onSelect={handleAddField}
          onClose={() => setShowFieldTypeSelector(false)}
        />
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {renderTabs()}
      
      {activeTab === 'fields' && renderFormBuilder()}
      
      {activeTab === 'routing' && (
        <RoutingBuilder
          fields={formDesign.fields}
          routing={formDesign.routing}
          onChange={handleUpdateRouting}
        />
      )}
      
      {activeTab === 'preview' && (
        <FormPreview
          formDesign={formDesign}
        />
      )}
    </div>
  );
};

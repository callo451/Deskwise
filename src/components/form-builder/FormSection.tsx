import React, { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { FormField as FormFieldComponent } from './FormField';
import { FormField, FormSection as FormSectionType } from '../../types/formBuilder';

interface FormSectionProps {
  section: FormSectionType;
  fields: Record<string, FormField>;
  isActive: boolean;
  onSectionClick: () => void;
  onUpdateSection: (updates: Partial<FormSectionType>) => void;
  onRemoveSection: () => void;
  onAddField: (event: React.MouseEvent) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onRemoveField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
}

export const FormSection: React.FC<FormSectionProps> = ({
  section,
  fields,
  isActive,
  onSectionClick,
  onUpdateSection,
  onRemoveSection,
  onAddField,
  onUpdateField,
  onRemoveField,
  onDuplicateField,
  selectedFieldId,
  onSelectField
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || '');
  
  const handleSaveEdit = () => {
    onUpdateSection({ 
      title, 
      description: description.trim() === '' ? undefined : description 
    });
    setIsEditing(false);
  };
  
  const toggleCollapse = () => {
    onUpdateSection({ collapsed: !section.collapsed });
  };
  
  const confirmRemoveSection = () => {
    if (window.confirm('Are you sure you want to remove this section? All fields in this section will also be removed.')) {
      onRemoveSection();
    }
  };

  return (
    <div className={`border rounded-lg ${isActive ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}`}>
      <div className="p-4 flex items-center justify-between border-b">
        <div 
          className="flex items-center cursor-pointer flex-grow"
          onClick={() => {
            if (!isEditing) {
              onSectionClick();
            }
          }}
        >
          <ArrowsUpDownIcon className="h-5 w-5 text-gray-400 mr-2 cursor-grab" />
          
          {isEditing ? (
            <div className="flex-grow">
              <input
                type="text"
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Section Title"
                autoFocus
              />
              <textarea
                className="w-full mt-2 border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Section Description (optional)"
                rows={2}
              />
            </div>
          ) : (
            <div className="flex-grow">
              <h3 className="font-medium text-gray-900">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-500"
                title="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="text-primary hover:text-primary-dark"
                title="Save"
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-500"
                title="Edit Section"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={confirmRemoveSection}
                className="text-gray-400 hover:text-red-500"
                title="Remove Section"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                onClick={toggleCollapse}
                className="text-gray-400 hover:text-gray-500"
                title={section.collapsed ? "Expand Section" : "Collapse Section"}
              >
                {section.collapsed ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronUpIcon className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
      
      {!section.collapsed && (
        <div className="p-4">
          <Droppable droppableId={section.id} type="field">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 min-h-[50px] ${
                  snapshot.isDraggingOver ? 'bg-gray-50 rounded' : ''
                }`}
              >
                {section.fieldIds.map((fieldId, index) => {
                  const field = fields[fieldId];
                  if (!field) return null;
                  
                  return (
                    <Draggable
                      key={fieldId}
                      draggableId={fieldId}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? 'opacity-70' : ''}`}
                        >
                          <FormFieldComponent
                            field={field}
                            isSelected={selectedFieldId === fieldId}
                            onSelect={() => onSelectField(fieldId)}
                            onUpdate={(updates) => onUpdateField(fieldId, updates)}
                            onRemove={() => onRemoveField(fieldId)}
                            onDuplicate={() => onDuplicateField(fieldId)}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          
          <div className="mt-4">
            <button
              onClick={onAddField}
              className="flex items-center text-sm text-primary hover:text-primary-dark"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

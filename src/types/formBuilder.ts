/**
 * Type definitions for the enhanced form builder
 */

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'checkbox-group' 
  | 'radio' 
  | 'radio-group' 
  | 'date' 
  | 'file' 
  | 'heading' 
  | 'paragraph' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'section';

export type FieldWidth = 'full' | 'half' | 'third';

export type ValidationRule = 
  | 'required' 
  | 'email' 
  | 'number' 
  | 'phone' 
  | 'url' 
  | 'minLength' 
  | 'maxLength' 
  | 'pattern' 
  | 'custom';

export type ConditionOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains' 
  | 'greaterThan' 
  | 'lessThan' 
  | 'startsWith' 
  | 'endsWith'
  | 'is' 
  | 'isNot';

export type RoutingAction = 'show' | 'hide' | 'require' | 'skip';

export type LogicOperator = 'AND' | 'OR';

export interface FormFieldCondition {
  fieldId: string;
  operator: ConditionOperator;
  value: string;
}

export interface FormFieldValidation {
  rule: ValidationRule;
  value?: string | number;
  message?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { 
    items?: { value: string; label: string }[]; 
    placeholder?: string; 
    [key: string]: any; 
  };
  defaultValue?: string;
  validations?: FormFieldValidation[];
  routing?: { 
    conditions: FormFieldCondition[]; 
    actions: { targetId: string; type: RoutingAction }[]; 
  }[];
  sectionId?: string;
  width: FieldWidth;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  collapsed?: boolean;
  fieldIds: string[]; // IDs of fields in this section
}

export interface FormDesign {
  sections: FormSection[];
  fields: Record<string, FormField>;
  routing?: { 
    conditions: FormFieldCondition[]; 
    actions: { targetId: string; type: RoutingAction }[]; 
  }[];
}

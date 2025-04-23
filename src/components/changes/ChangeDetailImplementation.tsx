import React from 'react';
import { Change } from '../../types/database';

interface ChangeDetailImplementationProps {
  change: Change;
  isEditing: boolean;
  onChangeUpdate: (updatedChange: Partial<Change>) => void;
}

const ChangeDetailImplementation: React.FC<ChangeDetailImplementationProps> = ({
  change,
  isEditing,
  onChangeUpdate
}) => {
  // Handle field changes
  const handleChange = (field: string, value: any) => {
    onChangeUpdate({ [field]: value });
  };
  
  return (
    <div className="space-y-6">
      {/* Implementation Plan */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Implementation Plan</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div>
              <textarea
                id="implementation_plan"
                rows={8}
                value={change.implementation_plan || ''}
                onChange={(e) => handleChange('implementation_plan', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Describe the steps to implement this change"
              />
            </div>
          ) : (
            <div>
              {change.implementation_plan ? (
                <p className="whitespace-pre-wrap">{change.implementation_plan}</p>
              ) : (
                <p className="text-gray-500 italic">No implementation plan provided</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Test Plan */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Test Plan</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div>
              <textarea
                id="test_plan"
                rows={6}
                value={change.test_plan || ''}
                onChange={(e) => handleChange('test_plan', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Describe how the change will be tested"
              />
            </div>
          ) : (
            <div>
              {change.test_plan ? (
                <p className="whitespace-pre-wrap">{change.test_plan}</p>
              ) : (
                <p className="text-gray-500 italic">No test plan provided</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Backout Plan */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Backout Plan</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div>
              <textarea
                id="backout_plan"
                rows={6}
                value={change.backout_plan || ''}
                onChange={(e) => handleChange('backout_plan', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Describe how to revert the change if needed"
              />
            </div>
          ) : (
            <div>
              {change.backout_plan ? (
                <p className="whitespace-pre-wrap">{change.backout_plan}</p>
              ) : (
                <p className="text-gray-500 italic">No backout plan provided</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Affected Services */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Affected Services</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                This feature will be implemented in a future update to allow selecting multiple services.
              </p>
            </div>
          ) : (
            <div>
              {change.affected_services && change.affected_services.length > 0 ? (
                <ul className="list-disc pl-5">
                  {change.affected_services.map((serviceId, index) => (
                    <li key={index}>{serviceId}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No affected services specified</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Affected Configuration Items */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Affected Configuration Items</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                This feature will be implemented in a future update to allow selecting configuration items.
              </p>
            </div>
          ) : (
            <div>
              {change.affected_configuration_items && change.affected_configuration_items.length > 0 ? (
                <ul className="list-disc pl-5">
                  {change.affected_configuration_items.map((itemId, index) => (
                    <li key={index}>{itemId}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No affected configuration items specified</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeDetailImplementation;

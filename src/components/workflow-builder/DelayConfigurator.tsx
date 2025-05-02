import React, { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface DelayConfiguratorProps {
  onDelayConfigured: (config: any) => void;
  onCancel: () => void;
  initialConfig?: any;
}

export const DelayConfigurator: React.FC<DelayConfiguratorProps> = ({
  onDelayConfigured,
  onCancel,
  initialConfig
}) => {
  const [delayType, setDelayType] = useState<'fixed' | 'until' | 'variable'>('fixed');
  const [duration, setDuration] = useState<number>(5);
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [dateTime, setDateTime] = useState<string>('');
  const [variableName, setVariableName] = useState<string>('');
  
  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.type) {
        setDelayType(initialConfig.type);
      }
      
      if (initialConfig.type === 'fixed' && initialConfig.duration) {
        setDuration(initialConfig.duration.value);
        setTimeUnit(initialConfig.duration.unit);
      } else if (initialConfig.type === 'until' && initialConfig.dateTime) {
        setDateTime(initialConfig.dateTime);
      } else if (initialConfig.type === 'variable' && initialConfig.variableName) {
        setVariableName(initialConfig.variableName);
      }
    }
  }, [initialConfig]);
  
  const handleSubmit = () => {
    let config: any = { type: delayType };
    
    if (delayType === 'fixed') {
      config.duration = {
        value: duration,
        unit: timeUnit
      };
    } else if (delayType === 'until') {
      config.dateTime = dateTime;
    } else if (delayType === 'variable') {
      config.variableName = variableName;
    }
    
    onDelayConfigured(config);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Configure Delay</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set up a waiting period in your workflow
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  delayType === 'fixed' 
                    ? 'border-primary bg-primary-50' 
                    : 'border-gray-200 hover:border-primary hover:bg-primary-50'
                }`}
                onClick={() => setDelayType('fixed')}
              >
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Fixed Duration</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Wait for a specific amount of time
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  delayType === 'until' 
                    ? 'border-primary bg-primary-50' 
                    : 'border-gray-200 hover:border-primary hover:bg-primary-50'
                }`}
                onClick={() => setDelayType('until')}
              >
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Until Date/Time</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Wait until a specific date and time
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  delayType === 'variable' 
                    ? 'border-primary bg-primary-50' 
                    : 'border-gray-200 hover:border-primary hover:bg-primary-50'
                }`}
                onClick={() => setDelayType('variable')}
              >
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Variable Duration</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Use a variable to determine the delay
                </p>
              </div>
            </div>
          </div>
          
          {delayType === 'fixed' && (
            <div className="flex items-end space-x-4">
              <div className="w-1/2">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="number"
                  id="duration"
                  min="1"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="w-1/2">
                <label htmlFor="timeUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  id="timeUnit"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          )}
          
          {delayType === 'until' && (
            <div>
              <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-1">
                Date and Time
              </label>
              <input
                type="datetime-local"
                id="dateTime"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                The workflow will wait until this specific date and time before proceeding
              </p>
            </div>
          )}
          
          {delayType === 'variable' && (
            <div>
              <label htmlFor="variableName" className="block text-sm font-medium text-gray-700 mb-1">
                Variable Name
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  $
                </span>
                <input
                  type="text"
                  id="variableName"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-primary focus:border-primary sm:text-sm border-gray-300"
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  placeholder="delayDuration"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The variable should contain a duration in seconds, or a date string in ISO format
              </p>
            </div>
          )}
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Delays will pause the workflow execution until the specified time has passed. 
                  The workflow state is saved and will resume automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleSubmit}
        >
          Save Delay
        </button>
      </div>
    </div>
  );
};

export default DelayConfigurator;

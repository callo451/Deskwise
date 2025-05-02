import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface LoopConfiguratorProps {
  onLoopConfigured: (config: any) => void;
  onCancel: () => void;
  initialConfig?: any;
}

export const LoopConfigurator: React.FC<LoopConfiguratorProps> = ({
  onLoopConfigured,
  onCancel,
  initialConfig
}) => {
  const [loopType, setLoopType] = useState<'count' | 'collection' | 'while'>('count');
  const [count, setCount] = useState<number>(5);
  const [collectionVariable, setCollectionVariable] = useState<string>('');
  const [itemVariable, setItemVariable] = useState<string>('item');
  const [indexVariable, setIndexVariable] = useState<string>('index');
  const [conditionField, setConditionField] = useState<string>('');
  const [conditionOperator, setConditionOperator] = useState<string>('equals');
  const [conditionValue, setConditionValue] = useState<string>('');
  const [maxIterations, setMaxIterations] = useState<number>(100);
  
  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.type) {
        setLoopType(initialConfig.type);
      }
      
      if (initialConfig.type === 'count' && initialConfig.count) {
        setCount(initialConfig.count);
      } else if (initialConfig.type === 'collection' && initialConfig.collection) {
        setCollectionVariable(initialConfig.collection);
        if (initialConfig.itemVariable) setItemVariable(initialConfig.itemVariable);
        if (initialConfig.indexVariable) setIndexVariable(initialConfig.indexVariable);
      } else if (initialConfig.type === 'while' && initialConfig.condition) {
        setConditionField(initialConfig.condition.field || '');
        setConditionOperator(initialConfig.condition.operator || 'equals');
        setConditionValue(initialConfig.condition.value || '');
        if (initialConfig.maxIterations) setMaxIterations(initialConfig.maxIterations);
      }
    }
  }, [initialConfig]);
  
  const handleSubmit = () => {
    let config: any = { type: loopType };
    
    if (loopType === 'count') {
      config.count = count;
    } else if (loopType === 'collection') {
      config.collection = collectionVariable;
      config.itemVariable = itemVariable;
      config.indexVariable = indexVariable;
    } else if (loopType === 'while') {
      config.condition = {
        field: conditionField,
        operator: conditionOperator,
        value: conditionValue
      };
      config.maxIterations = maxIterations;
    }
    
    onLoopConfigured(config);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Configure Loop</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set up a loop to repeat actions in your workflow
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loop Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  loopType === 'count' 
                    ? 'border-primary bg-primary-50' 
                    : 'border-gray-200 hover:border-primary hover:bg-primary-50'
                }`}
                onClick={() => setLoopType('count')}
              >
                <div className="flex items-center">
                  <ArrowPathIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Count</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Repeat a specific number of times
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  loopType === 'collection' 
                    ? 'border-primary bg-primary-50' 
                    : 'border-gray-200 hover:border-primary hover:bg-primary-50'
                }`}
                onClick={() => setLoopType('collection')}
              >
                <div className="flex items-center">
                  <ArrowPathIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Collection</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Iterate over each item in a collection
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  loopType === 'while' 
                    ? 'border-primary bg-primary-50' 
                    : 'border-gray-200 hover:border-primary hover:bg-primary-50'
                }`}
                onClick={() => setLoopType('while')}
              >
                <div className="flex items-center">
                  <ArrowPathIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">While</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Repeat while a condition is true
                </p>
              </div>
            </div>
          </div>
          
          {loopType === 'count' && (
            <div>
              <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Iterations
              </label>
              <input
                type="number"
                id="count"
                min="1"
                max="1000"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
              <p className="mt-1 text-xs text-gray-500">
                The loop will execute this many times (maximum 1000)
              </p>
            </div>
          )}
          
          {loopType === 'collection' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="collectionVariable" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Variable
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    id="collectionVariable"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-primary focus:border-primary sm:text-sm border-gray-300"
                    value={collectionVariable}
                    onChange={(e) => setCollectionVariable(e.target.value)}
                    placeholder="tickets"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  The variable containing the array or collection to iterate over
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="itemVariable" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Variable Name
                  </label>
                  <input
                    type="text"
                    id="itemVariable"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={itemVariable}
                    onChange={(e) => setItemVariable(e.target.value)}
                    placeholder="item"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name for the current item (without $ prefix)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="indexVariable" className="block text-sm font-medium text-gray-700 mb-1">
                    Index Variable Name
                  </label>
                  <input
                    type="text"
                    id="indexVariable"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={indexVariable}
                    onChange={(e) => setIndexVariable(e.target.value)}
                    placeholder="index"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name for the current index (without $ prefix)
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loopType === 'while' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="conditionField" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition Field
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    id="conditionField"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-primary focus:border-primary sm:text-sm border-gray-300"
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    placeholder="hasMoreItems"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="conditionOperator" className="block text-sm font-medium text-gray-700 mb-1">
                  Operator
                </label>
                <select
                  id="conditionOperator"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={conditionOperator}
                  onChange={(e) => setConditionOperator(e.target.value)}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Does Not Contain</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="conditionValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  id="conditionValue"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="true"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The value to compare against. You can use variables with $ prefix.
                </p>
              </div>
              
              <div>
                <label htmlFor="maxIterations" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Iterations
                </label>
                <input
                  type="number"
                  id="maxIterations"
                  min="1"
                  max="1000"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(parseInt(e.target.value) || 100)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Safety limit to prevent infinite loops (maximum 1000)
                </p>
              </div>
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
                  Loops will execute the connected nodes repeatedly. Be careful with large collections or while loops to avoid performance issues.
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
          Save Loop
        </button>
      </div>
    </div>
  );
};

export default LoopConfigurator;

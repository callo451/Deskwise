import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { ArrowUpTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { parseCSVFile, validateCSVData, importTicketsFromCSV, generateCSVTemplate, ImportResult, CSVTicket } from '../../utils/csvImport';

interface TicketImportProps {
  onImportComplete: () => void;
}

const TicketImport: React.FC<TicketImportProps> = ({ onImportComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setValidationErrors([]);
      setShowErrors(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ticket_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    try {
      // Parse CSV file
      const parsedData = await parseCSVFile(file);
      
      // Validate CSV data
      const validation = validateCSVData(parsedData);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setShowErrors(true);
        setIsImporting(false);
        return;
      }

      // Import tickets
      const result = await importTicketsFromCSV(parsedData);
      setImportResult(result);
      
      // Reset file input if there were no errors
      if (result.errors.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setFile(null);
      } else {
        setValidationErrors(result.errors);
        setShowErrors(true);
      }
      
      // Notify parent component that import is complete
      onImportComplete();
    } catch (error) {
      console.error('Error importing tickets:', error);
      setValidationErrors([{ row: 0, error: 'Failed to import CSV file' }]);
      setShowErrors(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Import Tickets</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="flex items-center"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
          Download Template
        </Button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-gray-50 file:text-gray-700
              hover:file:bg-gray-100"
          />
        </div>
        <Button
          variant="default"
          onClick={handleImport}
          disabled={!file || isImporting}
          className="flex items-center"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
          {isImporting ? 'Importing...' : 'Import'}
        </Button>
      </div>
      
      {importResult && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Import Results</h3>
          <div className="text-sm text-gray-600">
            <p>Successfully imported: <span className="font-medium text-green-600">{importResult.success}</span></p>
            <p>Failed to import: <span className="font-medium text-red-600">{importResult.failed}</span></p>
            {importResult.errors.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showErrors ? 'Hide Errors' : 'Show Errors'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {showErrors && validationErrors.length > 0 && (
        <div className="mt-3 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Errors</h3>
          <ul className="text-sm text-red-600 list-disc pl-5">
            {validationErrors.map((error, index) => (
              <li key={index}>
                Row {error.row}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>
          Upload a CSV file with the following columns: title, description, priority_id, status_id, category_id, queue_id, service_id, assigned_to.
          Only title and description are required.
        </p>
      </div>
    </div>
  );
};

export default TicketImport;

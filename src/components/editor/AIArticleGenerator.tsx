import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface AIArticleGeneratorProps {
  categories: any[];
  onGenerate: (request: {
    prompt: string;
    options: {
      includeTitle: boolean;
      includeContent: boolean;
      includeCategory: boolean;
      includeTags: boolean;
    };
  }) => void;
  isGenerating: boolean;
}

const AIArticleGenerator: React.FC<AIArticleGeneratorProps> = ({
  categories,
  onGenerate,
  isGenerating,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({
    includeTitle: true,
    includeContent: true,
    includeCategory: categories.length > 0, // Only include category if categories are available
    includeTags: true,
  });

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate({
        prompt,
        options: selectedOptions,
      });
    }
  };

  const handleOptionChange = (option: keyof typeof selectedOptions) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 mb-6 overflow-hidden">
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center">
          <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-medium text-gray-800">AI Article Generator</span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-blue-100">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                What would you like to write about?
              </label>
              <textarea
                id="prompt"
                rows={3}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
                placeholder="Describe the topic you want to create an article about..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Generate:
              </p>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    checked={selectedOptions.includeTitle}
                    onChange={() => handleOptionChange('includeTitle')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Title</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    checked={selectedOptions.includeContent}
                    onChange={() => handleOptionChange('includeContent')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Content</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    checked={selectedOptions.includeCategory}
                    onChange={() => handleOptionChange('includeCategory')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Category</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    checked={selectedOptions.includeTags}
                    onChange={() => handleOptionChange('includeTags')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Tags</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center"
              >
                <SparklesIcon className="h-5 w-5 mr-1" />
                {isGenerating ? 'Generating...' : 'Generate Article'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIArticleGenerator;

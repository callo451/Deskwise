import React from 'react';

interface HtmlContentProps {
  content: string;
  className?: string;
}

/**
 * Component for rendering HTML content with proper styling
 */
const HtmlContent: React.FC<HtmlContentProps> = ({ content, className = '' }) => {
  return (
    <div 
      className={`html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  );
};

export default HtmlContent;

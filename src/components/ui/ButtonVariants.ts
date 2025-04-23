// Re-export the Button component from the base Button file
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Export utility functions for button styling
export const getButtonColorClass = (variant: string): string => {
  switch (variant) {
    case 'primary':
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    case 'success':
      return 'bg-green-600 hover:bg-green-700 text-white';
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white';
    case 'warning':
      return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    default:
      return '';
  }
};

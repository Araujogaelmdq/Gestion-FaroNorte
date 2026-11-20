import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  bordered = true,
  className = '',
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  const borderStyle = bordered ? 'border border-gray-200 shadow-sm' : '';

  return (
    <div
      className={`bg-white rounded-2xl ${borderStyle} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

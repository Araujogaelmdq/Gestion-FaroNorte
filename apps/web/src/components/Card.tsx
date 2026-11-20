import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  bordered = true,
  interactive = false,
  className = '',
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  const borderStyle = bordered ? 'border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : '';
  const interactiveStyle = interactive ? 'card-interactive cursor-pointer' : '';

  return (
    <div
      className={`bg-white rounded-2xl transition-all duration-200 ${borderStyle} ${interactiveStyle} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

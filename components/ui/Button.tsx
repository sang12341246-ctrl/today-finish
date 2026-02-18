import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl";
  
  const variants = {
    primary: "bg-toss-blue text-white hover:bg-toss-blue-hover focus:ring-toss-blue",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-200",
    outline: "border-2 border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-200"
  };

  const sizes = "py-4 px-6 text-lg";
  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

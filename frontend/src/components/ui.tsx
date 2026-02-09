import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    children, 
    ...props 
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
        primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/20",
        outline: "border border-slate-600 text-slate-200 hover:bg-slate-800",
        ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50"
    };

    const sizes = {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg"
    };

    return (
        <button 
            className={cn(baseStyles, variants[variant], sizes[size], className)} 
            {...props}
        >
            {children}
        </button>
    );
};

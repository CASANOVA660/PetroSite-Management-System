import React from 'react';

interface FormDefaultInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
}

const FormDefaultInput: React.FC<FormDefaultInputProps> = ({
    label,
    value,
    onChange,
    type = 'text',
    required = false,
    placeholder = '',
    className = ''
}) => {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
            />
        </div>
    );
};

export default FormDefaultInput; 
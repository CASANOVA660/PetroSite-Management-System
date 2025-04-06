import React from 'react';

interface FormTextAreaInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    required?: boolean;
    placeholder?: string;
    className?: string;
    rows?: number;
}

const FormTextAreaInput: React.FC<FormTextAreaInputProps> = ({
    label,
    value,
    onChange,
    required = false,
    placeholder = '',
    className = '',
    rows = 4
}) => {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                rows={rows}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
            />
        </div>
    );
};

export default FormTextAreaInput; 
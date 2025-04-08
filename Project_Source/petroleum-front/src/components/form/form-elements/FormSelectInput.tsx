import React from 'react';

interface Option {
    value: string;
    label: string;
}

interface FormSelectInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Option[];
    required?: boolean;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

const FormSelectInput: React.FC<FormSelectInputProps> = ({
    label,
    value,
    onChange,
    options,
    required = false,
    className = '',
    placeholder = 'Sélectionner une option',
    disabled = false
}) => {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default FormSelectInput; 
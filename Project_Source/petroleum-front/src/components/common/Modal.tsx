import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={onClose}
            open={isOpen}
        >
            <div className="min-h-screen px-4 text-center">
                <div className="fixed inset-0 bg-black bg-opacity-30" />
                <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative z-50">
                    <div className="flex justify-between items-center">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                            {title}
                        </Dialog.Title>
                        <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="mt-4">
                        {children}
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default Modal; 
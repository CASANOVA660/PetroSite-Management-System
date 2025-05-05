import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { uploadProfilePicture } from '../../store/slices/userSlice';
import { useAppSelector } from '../../hooks/useAppSelector';

interface ProfilePictureUploadProps {
    onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function ProfilePictureUpload({ onAlert }: ProfilePictureUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const dispatch = useAppDispatch();
    const { currentUser } = useAppSelector((state) => state.users);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        if (!file.type.startsWith('image/')) {
            onAlert('error', 'Please upload an image file');
            return;
        }

        setIsUploading(true);
        try {
            await dispatch(uploadProfilePicture(file)).unwrap();
            onAlert('success', 'Profile picture updated successfully');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            onAlert('error', 'Failed to upload profile picture');
        } finally {
            setIsUploading(false);
        }
    }, [dispatch, onAlert]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        },
        maxFiles: 1,
        disabled: isUploading
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow"
        >
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                Profile Picture
            </h4>

            <div
                {...getRootProps()}
                className={`relative w-48 h-48 mx-auto rounded-full overflow-hidden border-2 border-dashed transition-colors ${isDragActive
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                    } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                    {isUploading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/50"
                        >
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                    ) : currentUser?.profilePicture?.url ? (
                        <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            src={currentUser.profilePicture.url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500"
                        >
                            <svg
                                className="w-12 h-12 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <p className="text-sm text-center">
                                {isDragActive
                                    ? 'Drop your image here'
                                    : 'Drag & drop or click to upload'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
                Supported formats: JPG, PNG, GIF
            </p>
        </motion.div>
    );
} 
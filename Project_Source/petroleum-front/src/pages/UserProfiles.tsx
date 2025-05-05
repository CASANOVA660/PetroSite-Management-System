import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import Alert from "../components/ui/alert/Alert";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal/Modal";
import Button from "../components/ui/button/Button";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { getUserById, uploadProfilePicture } from "../store/slices/userSlice";

export default function UserProfiles() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const dispatch = useAppDispatch();
  const { currentUser, loading } = useAppSelector((state) => state.users);
  const { user } = useAppSelector((state) => state.auth);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      dispatch(getUserById(user._id));
    }
  }, [dispatch, user?._id]);

  const handleAlertShow = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertInfo({ type, message });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        handleAlertShow('error', 'File size exceeds 5MB');
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSavePhoto = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    try {
      setIsUploading(true);
      await dispatch(uploadProfilePicture(file)).unwrap();

      // Refresh user data after successful upload
      if (user?._id) {
        dispatch(getUserById(user._id));
      }

      setPreviewUrl(null);
      closeModal();
      handleAlertShow('success', 'Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      handleAlertShow('error', 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPreviewUrl(null);
    closeModal();
    handleAlertShow('success', 'Profile photo removed');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <PageMeta
        title="User Profile | Petroleum Management System"
        description="Manage your professional profile details"
      />
      <PageBreadcrumb pageTitle="Profile" />

      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Alert
              variant={alertInfo.type}
              title={alertInfo.type.charAt(0).toUpperCase() + alertInfo.type.slice(1)}
              message={alertInfo.message}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8 shadow-lg"
        >
          {/* Header with Photo, Name, and Role */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
          >
            <div className="relative">
              <motion.div
                className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white/50 dark:border-gray-800/50"
                whileHover={{ scale: 1.05 }}
              >
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : photoUrl || currentUser?.profilePicture?.url ? (
                  <img
                    src={photoUrl || currentUser?.profilePicture?.url}
                    alt="User profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-16 h-16 text-gray-400 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center opacity-0 bg-black/50 rounded-full transition-opacity"
                whileHover={{ opacity: 1 }}
              >
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={openModal}
                    className="p-2 bg-indigo-600 text-white rounded-full"
                    title={photoUrl ? "Edit Photo" : "Add Photo"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </motion.button>
                  {photoUrl && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleRemovePhoto}
                      className="p-2 bg-red-600 text-white rounded-full"
                      title="Remove Photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-3xl font-bold text-white">
                {currentUser?.nom} {currentUser?.prenom}
              </h3>
              <p className="text-lg text-indigo-100">{currentUser?.role || 'User'}</p>
            </div>
          </motion.div>

          {/* Professional Information */}
          <div className="grid gap-6">
            <UserMetaCard onAlert={handleAlertShow} />
            <UserInfoCard onAlert={handleAlertShow} />
          </div>
        </motion.div>
      </div>

      {/* Photo Upload Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-md m-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl"
        >
          <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {photoUrl ? 'Edit Profile Photo' : 'Add Profile Photo'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Upload a new photo (max 5MB).
          </p>
          <div className="flex flex-col items-center mb-6">
            {previewUrl || photoUrl ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-gray-200/50 dark:border-gray-700/50">
                <img
                  src={previewUrl || photoUrl || ''}
                  alt="Photo preview"
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <svg
                  className="w-16 h-16 text-gray-400 dark:text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              size="sm"
              onClick={triggerFileInput}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isUploading}
            >
              Choose Photo
            </Button>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={closeModal}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={handleSavePhoto}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!previewUrl || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Save Photo'}
            </Button>
          </div>
        </motion.div>
      </Modal>
    </div>
  );
}
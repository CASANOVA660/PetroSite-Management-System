import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { updateProfile } from "../../store/slices/userSlice";

interface UserMetaData {
  employeeId: string;
  jobTitle: string;
  department: string;
}

export default function UserMetaCard({ onAlert }: { onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useAppDispatch();
  const { currentUser, loading } = useAppSelector((state) => state.users);
  const [formData, setFormData] = useState<UserMetaData>({
    employeeId: '',
    jobTitle: '',
    department: ''
  });

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        employeeId: currentUser.employeeId || 'Not assigned',
        jobTitle: currentUser.jobTitle || 'Not specified',
        department: currentUser.department || 'Not specified'
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (currentUser?._id) {
        // Only send fields that have been changed from their default values
        const updatedData = {
          ...formData,
          jobTitle: formData.jobTitle === 'Not specified' ? '' : formData.jobTitle,
          department: formData.department === 'Not specified' ? '' : formData.department
        };

        await dispatch(updateProfile({
          userId: currentUser._id,
          userData: updatedData
        })).unwrap();

        setIsEditing(false);
        onAlert('success', 'Professional information updated successfully');
      }
    } catch (err) {
      console.error('Error updating meta data:', err);
      onAlert('error', 'Failed to update professional information');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to current user values
    if (currentUser) {
      setFormData({
        employeeId: currentUser.employeeId || 'Not assigned',
        jobTitle: currentUser.jobTitle || 'Not specified',
        department: currentUser.department || 'Not specified'
      });
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
      </motion.div>
    );
  }

  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <p className="text-center text-gray-500 dark:text-gray-400">No user data available</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
          Professional Information
        </h4>
        {!isEditing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FA812F] text-white rounded-full hover:bg-orange-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Employee ID</Label>
                <Input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label>Job Title</Label>
                <Input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={handleCancel}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                className="bg-[#FA812F] hover:bg-orange-600 text-white"
              >
                Save Changes
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Employee ID</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{formData.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Job Title</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{formData.jobTitle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Department</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{formData.department}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
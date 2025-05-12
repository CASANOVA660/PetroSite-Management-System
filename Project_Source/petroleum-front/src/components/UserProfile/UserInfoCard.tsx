import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { updateProfile } from "../../store/slices/userSlice";

interface UserProfileData {
  telephone?: string;
  country?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
}

export default function UserInfoCard({ onAlert }: { onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useAppDispatch();
  const { currentUser, loading } = useAppSelector((state) => state.users);

  // Memoize the initial form data
  const initialFormData = useMemo(() => ({
    telephone: currentUser?.telephone || '',
    country: currentUser?.country || '',
    city: currentUser?.city || '',
    state: currentUser?.state || '',
    postalCode: currentUser?.postalCode || '',
    taxId: currentUser?.taxId || ''
  }), [currentUser]);

  const [formData, setFormData] = useState<UserProfileData>(initialFormData);

  // Only update form data when currentUser changes and we're not editing
  useEffect(() => {
    if (!isEditing && currentUser) {
      setFormData(initialFormData);
    }
  }, [currentUser, isEditing, initialFormData]);

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
        await dispatch(updateProfile({
          userId: currentUser._id,
          userData: formData
        })).unwrap();

        setIsEditing(false);
        onAlert('success', 'Profile updated successfully');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      onAlert('error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(initialFormData);
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
          Profile Details
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
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={currentUser.nom}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={currentUser.prenom}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="text"
                  value={currentUser.email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="text"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label>Tax ID</Label>
                <Input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
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
            {currentUser.employeeId && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Employee ID</p>
                <p className="text-base font-medium text-gray-800 dark:text-white">{currentUser.employeeId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">First Name</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{currentUser.nom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Name</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{currentUser.prenom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{currentUser.telephone || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">
                {currentUser.city && currentUser.country
                  ? `${currentUser.city}, ${currentUser.state || ''} ${currentUser.country}`
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Postal Code</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{currentUser.postalCode || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tax ID</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{currentUser.taxId || 'Not specified'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
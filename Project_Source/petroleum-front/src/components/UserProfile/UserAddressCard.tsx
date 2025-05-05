import { useState } from "react";
import { motion } from "framer-motion";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

interface AddressData {
  country: string;
  cityState: string;
  postalCode: string;
  taxId: string;
}

export default function UserAddressCard({ onAlert }: { onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void }) {
  const { isOpen, openModal, closeModal } = useModal();
  const [formData, setFormData] = useState<AddressData>({
    country: 'United States',
    cityState: 'Phoenix, Arizona, United States',
    postalCode: 'ERT 2489',
    taxId: 'AS4568384'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    try {
      // Simulate API call to save address
      console.log("Saving address changes:", formData);
      closeModal();
      onAlert('success', 'Address updated successfully');
    } catch (err) {
      console.error('Error saving address:', err);
      onAlert('error', 'Failed to update address');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Address Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Country</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{formData.country}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">City/State</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{formData.cityState}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Postal Code</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{formData.postalCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tax ID</p>
              <p className="text-base font-medium text-gray-800 dark:text-white">{formData.taxId}</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors lg:w-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </motion.button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-3xl m-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl"
        >
          <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Edit Address
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Update your address details.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                <Label>City/State</Label>
                <Input
                  type="text"
                  name="cityState"
                  value={formData.cityState}
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
                onClick={closeModal}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </Modal>
    </motion.div>
  );
}
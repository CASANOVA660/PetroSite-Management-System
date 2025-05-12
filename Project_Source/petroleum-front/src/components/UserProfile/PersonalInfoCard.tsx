import { useState } from "react";
import { motion } from "framer-motion";
import Form from "../form/Form";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";

interface PersonalInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
}

export default function PersonalInfoCard({ onAlert }: { onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        firstName: 'Musharof',
        lastName: 'Chowdhury',
        email: 'randomuser@pimjo.com',
        phone: '+09 363 398 46',
        jobTitle: 'Team Manager'
    });

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        try {
            // Simulate API call to save personal info
            console.log("Saving personal info:", personalInfo);
            setIsEditing(false);
            onAlert('success', 'Personal information updated successfully');
        } catch (err) {
            console.error('Error saving personal info:', err);
            onAlert('error', 'Failed to update personal information');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow"
        >
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Personal Information
                </h4>
                {!isEditing && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEdit}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FA812F] text-white rounded-full hover:bg-orange-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                    </motion.button>
                )}
            </div>

            <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            type="text"
                            id="firstName"
                            value={personalInfo.firstName}
                            disabled={!isEditing}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                            className={isEditing ? "focus:ring-indigo-500" : "bg-gray-100 dark:bg-gray-700"}
                        />
                    </div>
                    <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            type="text"
                            id="lastName"
                            value={personalInfo.lastName}
                            disabled={!isEditing}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                            className={isEditing ? "focus:ring-indigo-500" : "bg-gray-100 dark:bg-gray-700"}
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            type="email"
                            id="email"
                            value={personalInfo.email}
                            disabled={true}
                            className="bg-gray-100 dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            type="tel"
                            id="phone"
                            value={personalInfo.phone}
                            disabled={!isEditing}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                            className={isEditing ? "focus:ring-indigo-500" : "bg-gray-100 dark:bg-gray-700"}
                        />
                    </div>
                    <div>
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                            type="text"
                            id="jobTitle"
                            value={personalInfo.jobTitle}
                            disabled={!isEditing}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })}
                            className={isEditing ? "focus:ring-indigo-500" : "bg-gray-100 dark:bg-gray-700"}
                        />
                    </div>
                </div>

                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 flex items-center justify-end gap-4"
                    >
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
                    </motion.div>
                )}
            </Form>
        </motion.div>
    );
}
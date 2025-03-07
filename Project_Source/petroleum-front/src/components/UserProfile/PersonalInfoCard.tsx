import { useState } from 'react';
import Form from '../form/Form';
import Input from '../form/input/InputField';
import Label from '../form/Label';

interface PersonalInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
}

export default function PersonalInfoCard() {
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
        setIsEditing(false);
        // Here you'll add the API call to save changes
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                    Personal Information
                </h3>
                {!isEditing && (
                    <button
                        onClick={handleEdit}
                        className="inline-flex items-center justify-center rounded-md border border-primary py-2 px-6 text-center font-medium text-primary hover:bg-opacity-90"
                    >
                        Edit
                    </button>
                )}
            </div>

            <Form onSubmit={(e) => {
                e.preventDefault();
                handleSave();
            }}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            type="text"
                            id="firstName"
                            value={personalInfo.firstName}
                            disabled={!isEditing}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
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
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            type="email"
                            id="email"
                            value={personalInfo.email}
                            disabled={true}
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
                        />
                    </div>
                </div>

                {isEditing && (
                    <div className="mt-6 flex items-center justify-end gap-4">
                        <button
                            onClick={handleCancel}
                            className="inline-flex items-center justify-center rounded-md border border-stroke py-2 px-6 text-center font-medium text-black hover:bg-opacity-90 dark:border-strokedark dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </Form>
        </div>
    );
}
import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import DocumentsCard from "../components/UserProfile/DocumentsCard";
import Alert from "../components/ui/alert/Alert";

export default function UserProfiles() {
  const [activeTab, setActiveTab] = useState('personal');
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  });

  const handleAlertShow = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertInfo({ type, message });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <>
      <PageMeta
        title="User Profile | Petroleum Management System"
        description="User profile management page"
      />
      <PageBreadcrumb pageTitle="Profile" />

      {showAlert && (
        <div className="mb-4">
          <Alert
            variant={alertInfo.type}
            title={alertInfo.type.charAt(0).toUpperCase() + alertInfo.type.slice(1)}
            message={alertInfo.message}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4 px-4">
            <button
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'personal'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              onClick={() => setActiveTab('personal')}
            >
              Informations personnelles
            </button>
            <button
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-6">
            {activeTab === 'personal' ? (
              <>
                <UserMetaCard />
                <UserInfoCard />
                <UserAddressCard />
              </>
            ) : (
              <DocumentsCard onAlert={handleAlertShow} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

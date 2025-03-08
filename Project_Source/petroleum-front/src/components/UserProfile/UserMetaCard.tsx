import { useEffect } from "react";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { getUserById } from "../../store/slices/userSlice";

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  employeeId?: string;
  telephone?: string;
  country?: string;
  city?: string;
  state?: string;
}

export default function UserMetaCard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, loading, error } = useAppSelector((state) => state.users);

  useEffect(() => {
    const fetchUserData = async () => {
      // Get stored user data from localStorage as fallback
      const storedUser = localStorage.getItem('user');
      const parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;

      // Check both _id and id since the stored format might vary
      const userId = user?._id || user?.id || parsedStoredUser?.id || parsedStoredUser?._id;

      console.log('Auth user:', user);
      console.log('Stored user:', parsedStoredUser);
      console.log('User ID to use:', userId);

      if (!userId) {
        console.log('No user ID found in auth state or localStorage');
        return;
      }

      try {
        await dispatch(getUserById(userId));
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [dispatch, user]);

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-gray-500">No user data available</p>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
            <span className="text-3xl font-medium text-gray-600 dark:text-gray-300">
              {currentUser.nom?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {currentUser.nom} {currentUser.prenom}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentUser.role}
              </p>
              {currentUser.country && (
                <>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentUser.country}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

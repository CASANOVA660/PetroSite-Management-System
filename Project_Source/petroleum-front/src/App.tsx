import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { Provider } from 'react-redux';
import { store } from './store';
import UserManagement from "./pages/UserManagement/UserManagement";
import ActivationPage from './pages/Activation/ActivationPage';
import ProjectPreparation from './pages/Projects/ProjectPreparation';
import AddProject from './pages/Projects/AddProject';
import ProjectDetails from './pages/Projects/ProjectDetails';
import EditProject from './pages/Projects/EditProject';
import Tasks from './pages/Tasks';
import GlobalActions from './pages/GlobalActions';
import EquipmentList from './pages/Equipment/EquipmentList';
import EquipmentDetailView from './pages/Equipment/EquipmentDetailView';
import EquipmentAdd from './pages/Equipment/EquipmentAdd';
import EquipmentEdit from './pages/Equipment/EquipmentEdit';
import { Chat } from './pages/Chat';
import { useEffect } from "react";
import { setupTokenExpirationChecker } from "./utils/authUtils";

// Initialize token expiration checking
const AppInitializer = () => {
  useEffect(() => {
    // Only setup token expiration checker if not on activation page
    if (window.location.pathname !== '/activate') {
      setupTokenExpirationChecker();
    }

    // Listen to route changes to conditionally enable/disable token checking
    const handleRouteChange = () => {
      // Clear any existing interval
      if ((window as any).tokenCheckInterval) {
        clearInterval((window as any).tokenCheckInterval);
        (window as any).tokenCheckInterval = null;
      }

      // Don't check tokens on activation page
      if (window.location.pathname !== '/activate') {
        setupTokenExpirationChecker();
      }
    };

    // Add event listener for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      if ((window as any).tokenCheckInterval) {
        clearInterval((window as any).tokenCheckInterval);
      }
    };
  }, []);

  return null;
};

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppInitializer />
        <ScrollToTop />
        <Routes>
          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Home />} />
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />

            {/* User Management */}
            <Route
              path="/user-management"
              element={
                <UserManagement />
              }
            />

            {/* Projects */}
            <Route path="/projects/preparation" element={<ProjectPreparation />} />
            <Route path="/projects/add" element={<AddProject />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/:id/edit" element={<EditProject />} />

            {/* Tasks */}
            <Route path="/tasks" element={
              <Tasks />
            } />

            {/* Global Actions */}
            <Route path="/global-actions" element={<GlobalActions />} />

            {/* Equipment Management Routes */}
            <Route path="/equipments" element={<EquipmentList />} />
            <Route path="/equipments/:id" element={<EquipmentDetailView />} />
            <Route path="/equipments/add" element={<EquipmentAdd />} />
            <Route path="/equipments/:id/edit" element={<EquipmentEdit />} />

            {/* Chat */}
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Redirect root to signin */}
          <Route path="/" element={<Navigate to="/signin" replace />} />

          {/* Activation Page */}
          <Route path="/activate" element={<ActivationPage />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </Provider>
  );
}
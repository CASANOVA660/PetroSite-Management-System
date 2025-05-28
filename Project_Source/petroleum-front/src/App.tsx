import React, { useState, useEffect } from 'react';
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
import ProjectDetails from './pages/Projects/ProjectDetails';
import ProjectOperation from './pages/Projects/ProjectOperation';
import AddProject from './pages/Projects/AddProject';
import EditProject from './pages/Projects/EditProject';
import Tasks from './pages/Tasks';
import GlobalActions from './pages/GlobalActions';
import EquipmentList from './pages/Equipment/EquipmentList';
import EquipmentDetailView from './pages/Equipment/EquipmentDetailView';
import EquipmentAdd from './pages/Equipment/EquipmentAdd';
import EquipmentEdit from './pages/Equipment/EquipmentEdit';
import { Chat } from './pages/Chat';
import GestionRH from './pages/GestionRH';
import { setupTokenExpirationChecker } from "./utils/authUtils";
import { useSelector, useDispatch } from 'react-redux';
import socketService from './services/socketService';
import { Toaster } from 'react-hot-toast';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { RootState } from './store';
import PlanningPage from "./pages/Planning";
import { ReunionPage } from './pages/Reunion/ReunionPage';
import { SidebarProvider } from "./context/SidebarContext";
import { ModalProvider } from "./context/ModalContext";

// Toast options for consistent styling
const getToastOptions = () => {
  return {
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
    },
    success: {
      duration: 3000,
      iconTheme: {
        primary: '#10B981',
        secondary: '#FFFF',
      },
    },
    error: {
      duration: 5000,
      iconTheme: {
        primary: '#EF4444',
        secondary: '#FFFF',
      },
    }
  };
};

// Initialize token expiration checking
const AppInitializer = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);

  // Check if token exists in localStorage and user is already logged in
  useEffect(() => {
    // Only setup token expiration checker if not on activation page
    if (window.location.pathname !== '/activate') {
      setupTokenExpirationChecker();
      // The app will now rely on the initial state from authSlice
      // which automatically checks for token and user in localStorage
    }
  }, [dispatch]);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect(user._id);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return null;
};

export default function App() {
  return (
    <Provider store={store}>
      <SidebarProvider>
        <ModalProvider>
          <HelmetProvider>
            <Helmet>
              <title>Petroleum Management System</title>
              <meta name="description" content="Enterprise Resource Planning for Petroleum Operations" />
            </Helmet>
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
                  <Route path="/projects/:id/operation" element={<ProjectOperation />} />
                  <Route path="/projects/operation" element={<ProjectPreparation operationView={true} />} />

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

                  {/* Planning Page */}
                  <Route path="/planning" element={<PlanningPage />} />

                  {/* Reunions Page */}
                  <Route path="/reunions" element={<ReunionPage />} />

                  {/* HR Management */}
                  <Route path="/gestion-rh" element={<GestionRH />} />

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
            <Toaster position="bottom-right" toastOptions={getToastOptions()} />
          </HelmetProvider>
        </ModalProvider>
      </SidebarProvider>
    </Provider>
  );
}
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

export default function App() {
  return (
    <Provider store={store}>
      <Router>
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
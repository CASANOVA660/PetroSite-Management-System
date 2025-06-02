import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useLocation } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { connectSocket } from "../utils/socket";
import socket from "../utils/socket";
import { useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppSelector } from "../hooks/useAppSelector";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user } = useAppSelector(state => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (user?._id) {
      console.log('Connecting socket for user:', user._id);
      connectSocket(user._id);

      // Check if socket is connected after a short delay
      setTimeout(() => {
        console.log('Socket connection status after setup:', socket.connected ? 'Connected' : 'Disconnected');
      }, 1000);
    } else {
      console.log('User not authenticated, skipping socket connection');
    }
  }, [user?._id]);

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {/* Hide AppHeader on chat and RAG chatbot routes */}
        {location.pathname !== '/chat' && location.pathname !== '/rag-chat' && <AppHeader />}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;

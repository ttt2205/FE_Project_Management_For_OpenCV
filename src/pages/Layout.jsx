import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadTheme } from "../features/themeSlice";
import { Loader2Icon } from "lucide-react";
import {
  useUser,
  SignIn,
  useAuth,
  useOrganizationList,
  CreateOrganization,
} from "@clerk/clerk-react";
import { fetchWorkspaces } from "../features/workspaceSlice";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncRetries, setSyncRetries] = useState(0);
  const { loading, workspaces } = useSelector((state) => state.workspace);
  const dispatch = useDispatch();

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { userMemberships } = useOrganizationList({ userMemberships: true });
  const membershipsCount = userMemberships?.data?.length || 0;

  // Initial load of theme
  useEffect(() => {
    dispatch(loadTheme());
  }, []);

  // Initial load of workspaces
  useEffect(() => {
    if (isLoaded && user && workspaces.length === 0) {
      dispatch(fetchWorkspaces({ getToken }));
    }
  }, [user, isLoaded, workspaces.length, dispatch, getToken]);

  // Retry a few times after Clerk organization is created, because DB sync can be delayed.
  useEffect(() => {
    if (workspaces.length > 0) {
      setSyncRetries(0);
    }
  }, [workspaces.length]);

  useEffect(() => {
    const shouldRetrySync =
      isLoaded &&
      user &&
      membershipsCount > 0 &&
      workspaces.length === 0 &&
      syncRetries < 5;

    if (!shouldRetrySync) return;

    const timer = setTimeout(async () => {
      await dispatch(fetchWorkspaces({ getToken }));
      setSyncRetries((prev) => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    isLoaded,
    user,
    membershipsCount,
    workspaces.length,
    syncRetries,
    dispatch,
    getToken,
  ]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
        <SignIn />
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );

  if (user && workspaces.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-3 bg-white dark:bg-zinc-950">
        <CreateOrganization afterCreateOrganizationUrl="/" />
        {membershipsCount > 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Organization da tao tren Clerk, dang dong bo xuong database...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

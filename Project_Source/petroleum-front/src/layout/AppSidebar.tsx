import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Import icons
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  GroupIcon,
  FolderIcon,
  WarehouseIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { ClipboardIcon, ChatBubbleLeftRightIcon, UserGroupIcon } from "@heroicons/react/24/outline";


type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  badge?: number;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { chats } = useSelector((state: RootState) => state.chat);
  const isManager = user?.role === 'Manager';

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Calculate total unread message count from all chats
  const totalUnreadMessages = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group hover:bg-[#FA812F] ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active text-white bg-[#FA812F]"
                : "menu-item-inactive text-white"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active text-white"
                  : "menu-item-icon-inactive text-white group-hover:text-white"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "text-white"
                  : "text-white group-hover:text-white"
                  }`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-white"
                    : "text-white group-hover:text-white"
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group relative hover:bg-[#FA812F] ${isActive(nav.path)
                  ? "menu-item-active text-white bg-[#FA812F]"
                  : "menu-item-inactive text-white"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active text-white"
                    : "menu-item-icon-inactive text-white group-hover:text-white"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text ${isActive(nav.path)
                    ? "text-white"
                    : "text-white group-hover:text-white"
                    }`}>{nav.name}</span>
                )}
                {nav.badge !== undefined && nav.badge > 0 && (
                  <span
                    className={`${!isExpanded && !isHovered ? 'absolute -top-1 -right-1' : 'ml-auto'} 
                      flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-medium text-white 
                      bg-white/20 rounded-full transition-all duration-300 animate-pulse`}
                  >
                    {nav.badge > 99 ? '99+' : nav.badge}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item hover:bg-[#FA812F] hover:text-white ${isActive(subItem.path)
                        ? "menu-dropdown-item-active text-white bg-[#FA812F]"
                        : "menu-dropdown-item-inactive text-white"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active text-[#FA812F]"
                              : "menu-dropdown-badge-inactive text-white/80 group-hover:text-[#FA812F]"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active text-[#FA812F]"
                              : "menu-dropdown-badge-inactive text-white/80 group-hover:text-[#FA812F]"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Tableau de bord",
      path: "/dashboard"
    },
    {
      icon: <UserCircleIcon />,
      name: "User Profile",
      path: "/profile",
    },
    {
      icon: <FolderIcon />,
      name: "Préparation Projet",
      path: "/projects/preparation"
    },
    {
      icon: <ListIcon />,
      name: "Mes Tâches",
      path: "/tasks"
    },
    {
      icon: <PageIcon />,
      name: "Documents",
      path: "/documents"
    },
    {
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      name: "Messagerie",
      path: "/chat",
      badge: totalUnreadMessages
    },
    {
      icon: <WarehouseIcon />,
      name: "Magasin des équipments",
      path: "/equipments"
    },
    {
      icon: <CalenderIcon />,
      name: "Planning",
      path: "/planning"
    },
    {
      icon: <UserGroupIcon className="w-6 h-6" />,
      name: "Gestion RH",
      path: "/gestion-rh"
    },

    // Add Global Actions for managers
    ...(isManager ? [{
      icon: <ClipboardIcon />,
      name: "Actions Globales",
      path: "/global-actions"
    }] : []),
    ...(isManager ? [{
      icon: <GroupIcon />,
      name: "Gestion des Utilisateurs",
      path: "/user-management"
    }] : [])
  ];


  const othersItems: NavItem[] = [
    {
      icon: <PieChartIcon />,
      name: "Charts",
      subItems: [
        { name: "Line Chart", path: "/line-chart", pro: false },
        { name: "Bar Chart", path: "/bar-chart", pro: false },
      ],
    },
    {
      icon: <BoxCubeIcon />,
      name: "UI Elements",
      subItems: [
        { name: "Alerts", path: "/alerts", pro: false },
        { name: "Avatar", path: "/avatars", pro: false },
        { name: "Badge", path: "/badge", pro: false },
        { name: "Buttons", path: "/buttons", pro: false },
        { name: "Images", path: "/images", pro: false },
        { name: "Videos", path: "/videos", pro: false },
      ],
    },
    {
      icon: <PlugInIcon />,
      name: "Authentication",
      subItems: [
        { name: "Sign In", path: "/signin", pro: false },
        { name: "Sign Up", path: "/signup", pro: false },
      ],
    },
  ];

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-black dark:bg-black dark:border-gray-800 text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              className="h-30 -mt-10"
              src="/images/logo/logo.PNG"
              alt="Italfluid Petroconnect"
              width={200}
              height={100}
            />
          ) : (
            <img
              className="h-10"
              src="/images/logo/small-logo.png"
              alt="Italfluid Petroconnect"
              width={40}
              height={40}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-white ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-white ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;

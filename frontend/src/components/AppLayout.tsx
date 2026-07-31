import {
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Drawer,
  Flex,
  Grid,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import "./AppLayout.css";


const {
  Header,
  Content,
  Sider,
} = Layout;

const {
  Text,
} = Typography;

const {
  useBreakpoint,
} = Grid;


const menuItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/transactions",
    icon: <SwapOutlined />,
    label: "Transações",
  },
  {
    key: "/customers",
    icon: <TeamOutlined />,
    label: "Clientes",
  },
];


interface SidebarContentProps {
  selectedMenuKey: string;
  onNavigate: (path: string) => void;
  onToggle?: () => void;
}


function SidebarContent({
  selectedMenuKey,
  onNavigate,
  onToggle,
}: SidebarContentProps) {
  return (
    <div className="app-sidebar-content">
      <div className="app-brand">
        <SafetyCertificateOutlined
          className="app-brand-icon"
        />

        <Text
          className="app-brand-name"
          strong
        >
          FinTrack Analytics
        </Text>

        {onToggle ? (
          <Button
            className="app-sidebar-toggle"
            type="text"
            aria-label="Fechar barra lateral"
            title="Fechar barra lateral"
            icon={<MenuFoldOutlined />}
            onClick={onToggle}
          />
        ) : null}
      </div>

      <Menu
        className="app-navigation"
        theme="dark"
        mode="inline"
        selectedKeys={[selectedMenuKey]}
        items={menuItems}
        onClick={({ key }) => {
          onNavigate(key);
        }}
      />
    </div>
  );
}


export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const {
    user,
    logout,
  } = useAuth();

  const isMobile = !screens.lg;

  const [
    desktopCollapsed,
    setDesktopCollapsed,
  ] = useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);


  const selectedMenuKey =
    menuItems.find(
      (item) =>
        location.pathname === item.key
        || location.pathname.startsWith(
          `${item.key}/`,
        ),
    )?.key ?? "/dashboard";


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  function handleMenuNavigation(
    path: string,
  ) {
    navigate(path);

    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }


  function handleMenuToggle() {
    if (isMobile) {
      setMobileMenuOpen(true);
      return;
    }

    setDesktopCollapsed(
      (current) => !current,
    );
  }


  return (
    <Layout className="app-shell">
      {!isMobile ? (
        <Sider
          className="app-sidebar"
          width={248}
          collapsedWidth={0}
          collapsed={desktopCollapsed}
          trigger={null}
        >
          <SidebarContent
            selectedMenuKey={selectedMenuKey}
            onNavigate={handleMenuNavigation}
          />
        </Sider>
      ) : null}

      <Drawer
        rootClassName="app-mobile-drawer"
        placement="left"
        width={280}
        open={isMobile && mobileMenuOpen}
        closable={false}
        onClose={() => {
          setMobileMenuOpen(false);
        }}
      >
        <SidebarContent
          selectedMenuKey={selectedMenuKey}
          onNavigate={handleMenuNavigation}
          onToggle={() => {
            setMobileMenuOpen(false);
          }}
        />
      </Drawer>

      <Layout className="app-main-layout">
        <Header className="app-header">
          <Button
            className="app-menu-toggle"
            type="text"
            aria-label={
              isMobile || desktopCollapsed
                ? "Abrir barra lateral"
                : "Fechar barra lateral"
            }
            title={
              isMobile || desktopCollapsed
                ? "Abrir barra lateral"
                : "Fechar barra lateral"
            }
            icon={
              isMobile || desktopCollapsed
                ? <MenuUnfoldOutlined />
                : <MenuFoldOutlined />
            }
            onClick={handleMenuToggle}
          />

          <Space
            className="app-user-area"
            size={12}
          >
            <Avatar>
              {user?.name
                .trim()
                .charAt(0)
                .toUpperCase()}
            </Avatar>

            <Flex
              className="app-user-copy"
              vertical
            >
              <Text
                className="app-user-name"
                strong
              >
                {user?.name}
              </Text>

              <Text
                className="app-user-email"
                type="secondary"
              >
                {user?.email}
              </Text>
            </Flex>

            <Tag
              className="app-user-role"
              color={
                user?.role === "ADMIN"
                  ? "blue"
                  : "green"
              }
            >
              {user?.role === "ADMIN"
                ? "Administrador"
                : "Analista"}
            </Tag>

            <Button
              className="app-header-logout"
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Sair
            </Button>
          </Space>
        </Header>

        <Content className="app-content">
          <main className="app-content-inner">
            <Outlet />
          </main>
        </Content>
      </Layout>
    </Layout>
  );
}

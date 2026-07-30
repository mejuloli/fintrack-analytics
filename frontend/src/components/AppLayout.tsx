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
  Flex,
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


const { Header, Content, Sider } = Layout;
const { Text } = Typography;


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


export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);


  const selectedMenuKey =
    menuItems.find(
      (item) =>
        location.pathname === item.key ||
        location.pathname.startsWith(
          `${item.key}/`,
        ),
    )?.key ?? "/dashboard";


  function handleLogout() {
    logout();
    navigate("/login", {
      replace: true,
    });
  }


  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={240}
        breakpoint="lg"
        collapsedWidth={0}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Flex
          align="center"
          gap={12}
          style={{
            height: 64,
            paddingInline: 20,
            color: "#ffffff",
          }}
        >
          <SafetyCertificateOutlined
            style={{
              fontSize: 24,
              flexShrink: 0,
            }}
          />

          <Text
            strong
            style={{
              color: "#ffffff",
              fontSize: 16,
              whiteSpace: "nowrap",
            }}
          >
            FinTrack Analytics
          </Text>
        </Flex>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            paddingInline: 20,
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Button
            type="text"
            aria-label={
              collapsed
                ? "Abrir menu lateral"
                : "Fechar menu lateral"
            }
            icon={
              collapsed
                ? <MenuUnfoldOutlined />
                : <MenuFoldOutlined />
            }
            onClick={() => {
              setCollapsed((current) => !current);
            }}
          />

          <Space size={12}>
            <Avatar>
              {user?.name
                .trim()
                .charAt(0)
                .toUpperCase()}
            </Avatar>

            <Flex
              vertical
              style={{
                lineHeight: 1.2,
              }}
            >
              <Text strong>{user?.name}</Text>

              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                }}
              >
                {user?.email}
              </Text>
            </Flex>

            <Tag
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
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Sair
            </Button>
          </Space>
        </Header>

        <Content
          style={{
            padding: 24,
            background: "#f3f5f8",
            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

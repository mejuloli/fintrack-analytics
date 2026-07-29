import {
  Button,
  Card,
  Flex,
  Layout,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  LogoutOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import { useAuth } from "../hooks/useAuth";


const { Header, Content } = Layout;
const { Paragraph, Text, Title } = Typography;


export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 24,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Flex align="center" gap={12}>
          <SafetyCertificateOutlined
            style={{ fontSize: 22 }}
          />

          <Text strong>
            FinTrack Analytics
          </Text>
        </Flex>

        <Space>
          <Text>{user?.name}</Text>

          <Tag color={user?.role === "ADMIN" ? "blue" : "green"}>
            {user?.role === "ADMIN"
              ? "Administrador"
              : "Analista"}
          </Tag>

          <Button
            icon={<LogoutOutlined />}
            onClick={logout}
          >
            Sair
          </Button>
        </Space>
      </Header>

      <Content
        style={{
          padding: 24,
          background: "#f3f5f8",
        }}
      >
        <Card>
          <Title level={2}>
            Olá, {user?.name}
          </Title>

          <Paragraph>
            A autenticação do FinTrack Analytics está
            funcionando.
          </Paragraph>

          <Paragraph>
            Este dashboard ainda está vazio. No próximo
            checkpoint criaremos o layout lateral e o domínio
            de transações.
          </Paragraph>

          <Space direction="vertical">
            <Text>
              <strong>E-mail:</strong> {user?.email}
            </Text>

            <Text>
              <strong>Perfil:</strong> {user?.role}
            </Text>

            <Text>
              <strong>ID:</strong> {user?.id}
            </Text>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}

import {
  Card,
  Col,
  Row,
  Statistic,
  Typography,
} from "antd";
import {
  DatabaseOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
} from "@ant-design/icons";

import { useAuth } from "../hooks/useAuth";


const { Paragraph, Title } = Typography;


export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <Title level={2}>
        Olá, {user?.name}
      </Title>

      <Paragraph type="secondary">
        Visão geral da plataforma de análise de
        transações.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Clientes"
              value={20}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Transações"
              value={300}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Ambiente"
              value="Protegido"
              prefix={
                <SafetyCertificateOutlined />
              }
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}

import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Typography,
} from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { AxiosError } from "axios";
import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../types/auth";


const { Paragraph, Text, Title } = Typography;


export function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);


  if (user) {
    return <Navigate to="/dashboard" replace />;
  }


  async function handleSubmit(
    values: LoginCredentials,
  ) {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          setErrorMessage(
            "E-mail ou senha inválidos.",
          );
        } else {
          setErrorMessage(
            "Não foi possível acessar o servidor.",
          );
        }
      } else {
        setErrorMessage(
          "Ocorreu um erro inesperado.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#f3f5f8",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,
        }}
      >
        <Title level={2} style={{ marginBottom: 4 }}>
          FinTrack Analytics
        </Title>

        <Paragraph type="secondary">
          Acesse a plataforma de análise de transações.
        </Paragraph>

        {errorMessage && (
          <Alert
            type="error"
            message={errorMessage}
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form<LoginCredentials>
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              {
                required: true,
                message: "Informe seu e-mail.",
              },
              {
                type: "email",
                message: "Informe um e-mail válido.",
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="admin@fintrack.local"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[
              {
                required: true,
                message: "Informe sua senha.",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Sua senha"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Entrar
          </Button>
        </Form>

        <Text
          type="secondary"
          style={{
            display: "block",
            marginTop: 24,
            textAlign: "center",
            fontSize: 12,
          }}
        >
          Todos os dados utilizados neste projeto são
          fictícios.
        </Text>
      </Card>
    </Flex>
  );
}

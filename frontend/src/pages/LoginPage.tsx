import {
  BarChartOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Typography,
} from "antd";
import { AxiosError } from "axios";
import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import type {
  LoginCredentials,
} from "../types/auth";

import "./LoginPage.css";


const {
  Paragraph,
  Text,
  Title,
} = Typography;


const platformHighlights = [
  {
    icon: <BarChartOutlined />,
    title: "Indicadores consolidados",
    description:
      "Acompanhe volume, valores e desempenho das transações.",
  },
  {
    icon: <SwapOutlined />,
    title: "Análise de movimentações",
    description:
      "Consulte transações com filtros e histórico detalhado.",
  },
  {
    icon: <TeamOutlined />,
    title: "Visão por cliente",
    description:
      "Entenda o comportamento e a atividade de cada cliente.",
  },
];


export function LoginPage() {
  const navigate = useNavigate();

  const {
    user,
    login,
  } = useAuth();

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);


  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  async function handleSubmit(
    values: LoginCredentials,
  ) {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login(values);

      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
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
    <main className="login-page">
      <section
        className="login-hero"
        aria-labelledby="login-hero-title"
      >
        <div className="login-hero-content">
          <div className="login-brand">
            <span className="login-brand-icon">
              <SafetyCertificateOutlined />
            </span>

            <Text
              className="login-brand-name"
              strong
            >
              FinTrack Analytics
            </Text>
          </div>

          <div className="login-hero-copy">
            <Text className="login-eyebrow">
              Inteligência financeira
            </Text>

            <Title
              id="login-hero-title"
              className="login-hero-title"
              level={1}
            >
              Dados financeiros transformados em
              decisões mais claras.
            </Title>

            <Paragraph className="login-hero-description">
              Uma visão centralizada para acompanhar
              clientes, transações e indicadores de
              desempenho.
            </Paragraph>
          </div>

          <div className="login-highlights">
            {platformHighlights.map((item) => (
              <div
                className="login-highlight"
                key={item.title}
              >
                <span className="login-highlight-icon">
                  {item.icon}
                </span>

                <div>
                  <Text
                    className="login-highlight-title"
                    strong
                  >
                    {item.title}
                  </Text>

                  <Text className="login-highlight-description">
                    {item.description}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Text className="login-hero-footer">
          Ambiente demonstrativo com dados fictícios
        </Text>
      </section>

      <section
        className="login-panel"
        aria-labelledby="login-form-title"
      >
        <Card className="login-card">
          <div className="login-mobile-brand">
            <span className="login-mobile-brand-icon">
              <SafetyCertificateOutlined />
            </span>

            <Text strong>
              FinTrack Analytics
            </Text>
          </div>

          <div className="login-card-header">
            <Text className="login-card-eyebrow">
              Área segura
            </Text>

            <Title
              id="login-form-title"
              className="login-card-title"
              level={2}
            >
              Bem-vindo de volta
            </Title>

            <Paragraph className="login-card-description">
              Informe suas credenciais para acessar a
              plataforma.
            </Paragraph>
          </div>

          {errorMessage ? (
            <Alert
              className="login-error"
              type="error"
              message={errorMessage}
              showIcon
            />
          ) : null}

          <Form<LoginCredentials>
            className="login-form"
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
                  message:
                    "Informe um e-mail válido.",
                },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="seu@email.com"
                size="large"
                autoComplete="email"
                autoFocus
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
                placeholder="Digite sua senha"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              className="login-submit"
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              block
            >
              Entrar na plataforma
            </Button>
          </Form>

          <div className="login-security-note">
            <SafetyCertificateOutlined />

            <Text type="secondary">
              Acesso protegido por autenticação segura.
            </Text>
          </div>
        </Card>

        <Text className="login-panel-footer">
          Todos os dados utilizados neste projeto são
          fictícios.
        </Text>
      </section>
    </main>
  );
}

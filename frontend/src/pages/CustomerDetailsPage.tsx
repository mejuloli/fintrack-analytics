import {
  ArrowLeftOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import type {
  DescriptionsProps,
} from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { getCustomer } from "../services/customers";
import type {
  CustomerDetails,
} from "../types/customer";
import {
  formatDateTime,
} from "../utils/formatters";


const {
  Paragraph,
  Title,
} = Typography;


export default function CustomerDetailsPage() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const parsedCustomerId = Number(customerId);

  const isValidCustomerId =
    Number.isInteger(parsedCustomerId)
    && parsedCustomerId > 0;

  const [customer, setCustomer] =
    useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(
    isValidCustomerId,
  );
  const [error, setError] = useState<string | null>(
    null,
  );


  const loadCustomer = useCallback(async () => {
    if (!isValidCustomerId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getCustomer(
        parsedCustomerId,
      );

      setCustomer(response);
    } catch {
      setCustomer(null);
      setError(
        "Não foi possível carregar este cliente.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    isValidCustomerId,
    parsedCustomerId,
  ]);


  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);


  const customerItems = useMemo<
    DescriptionsProps["items"]
  >(
    () =>
      customer
        ? [
            {
              key: "external_id",
              label: "Identificador",
              children: customer.external_id,
            },
            {
              key: "name",
              label: "Nome",
              children: customer.name,
            },
            {
              key: "email",
              label: "E-mail",
              children:
                customer.email
                || "Não informado",
            },
            {
              key: "location",
              label: "Localização",
              children:
                [
                  customer.city,
                  customer.state,
                ]
                  .filter(Boolean)
                  .join(" - ")
                || "Não informada",
            },
            {
              key: "status",
              label: "Status",
              children: (
                <Tag
                  color={
                    customer.is_active
                      ? "green"
                      : "default"
                  }
                >
                  {customer.is_active
                    ? "Ativo"
                    : "Inativo"}
                </Tag>
              ),
            },
            {
              key: "transaction_count",
              label: "Transações",
              children:
                customer.transaction_count,
            },
          ]
        : [],
    [customer],
  );


  const systemItems = useMemo<
    DescriptionsProps["items"]
  >(
    () =>
      customer
        ? [
            {
              key: "created_at",
              label: "Criado em",
              children: formatDateTime(
                customer.created_at,
              ),
            },
            {
              key: "updated_at",
              label: "Atualizado em",
              children: formatDateTime(
                customer.updated_at,
              ),
            },
          ]
        : [],
    [customer],
  );


  if (!isValidCustomerId) {
    return (
      <Result
        status="404"
        title="Cliente inválido"
        subTitle={
          "O identificador informado não é válido."
        }
        extra={
          <Button
            type="primary"
            onClick={() => {
              navigate("/customers");
            }}
          >
            Voltar para clientes
          </Button>
        }
      />
    );
  }


  return (
    <Space
      orientation="vertical"
      size="large"
      style={{
        width: "100%",
      }}
    >
      <Flex
        justify="space-between"
        align="center"
        gap={16}
        wrap
      >
        <div>
          <Title level={2}>
            Detalhes do cliente
          </Title>

          <Paragraph type="secondary">
            Consulte os dados cadastrais e o resumo
            de movimentações.
          </Paragraph>
        </div>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            navigate("/customers");
          }}
        >
          Voltar
        </Button>
      </Flex>

      {loading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : null}

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Erro ao carregar cliente"
          description={error}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                void loadCustomer();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : null}

      {customer ? (
        <>
          <Card
            title={
              <Space>
                <TeamOutlined />
                {customer.name}
              </Space>
            }
          >
            <Descriptions
              bordered
              column={{
                xs: 1,
                sm: 1,
                md: 2,
                lg: 3,
              }}
              items={customerItems}
            />
          </Card>

          <Card title="Informações do sistema">
            <Descriptions
              bordered
              column={{
                xs: 1,
                md: 2,
              }}
              items={systemItems}
            />
          </Card>
        </>
      ) : null}
    </Space>
  );
}

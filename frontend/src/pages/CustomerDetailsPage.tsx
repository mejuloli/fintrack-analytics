import {
  ArrowLeftOutlined,
  EyeOutlined,
  ReloadOutlined,
  SwapOutlined,
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
  Table,
  Tag,
  Typography,
} from "antd";
import type {
  DescriptionsProps,
  TableColumnsType,
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
import {
  getTransactions,
} from "../services/transactions";
import type {
  PaginatedResponse,
} from "../types/api";
import type {
  CustomerDetails,
} from "../types/customer";
import type {
  Transaction,
} from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
} from "../utils/formatters";


const {
  Paragraph,
  Text,
  Title,
} = Typography;


const STATUS_COLORS: Record<string, string> = {
  APPROVED: "green",
  REJECTED: "red",
  PENDING: "gold",
  REVERSED: "default",
};


const EMPTY_TRANSACTIONS:
  PaginatedResponse<Transaction> = {
    count: 0,
    total_pages: 0,
    page: 1,
    page_size: 5,
    next: null,
    previous: null,
    results: [],
  };


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

  const [transactions, setTransactions] =
    useState<PaginatedResponse<Transaction>>(
      EMPTY_TRANSACTIONS,
    );

  const [
    transactionsLoading,
    setTransactionsLoading,
  ] = useState(false);

  const [
    transactionsError,
    setTransactionsError,
  ] = useState<string | null>(null);

  const [transactionPage, setTransactionPage] =
    useState(1);

  const [
    transactionPageSize,
    setTransactionPageSize,
  ] = useState(5);


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


  const loadTransactions = useCallback(
    async (
      customerExternalId: string,
      page: number,
      pageSize: number,
    ) => {
      setTransactionsLoading(true);
      setTransactionsError(null);

      try {
        const response = await getTransactions({
          page,
          page_size: pageSize,
          customer: customerExternalId,
          ordering: "-transaction_date",
        });

        setTransactions(response);
      } catch {
        setTransactions(EMPTY_TRANSACTIONS);

        setTransactionsError(
          "Não foi possível carregar as transações "
          + "deste cliente.",
        );
      } finally {
        setTransactionsLoading(false);
      }
    },
    [],
  );


  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);


  useEffect(() => {
    if (!customer) {
      return;
    }

    void loadTransactions(
      customer.external_id,
      transactionPage,
      transactionPageSize,
    );
  }, [
    customer,
    loadTransactions,
    transactionPage,
    transactionPageSize,
  ]);


  const customerItems = useMemo<
    DescriptionsProps["items"]
  >(
    () =>
      customer
        ? [
            {
              key: "external_id",
              label: "Identificador",
              children: (
                <Text code>
                  {customer.external_id}
                </Text>
              ),
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


  const transactionColumns = useMemo<
    TableColumnsType<Transaction>
  >(
    () => [
      {
        title: "Identificador",
        dataIndex: "external_id",
        key: "external_id",
        width: 160,
        render: (value: string) => (
          <Text code>{value}</Text>
        ),
      },
      {
        title: "Data",
        dataIndex: "transaction_date",
        key: "transaction_date",
        width: 170,
        render: (value: string) =>
          formatDateTime(value),
      },
      {
        title: "Categoria",
        dataIndex: "category_label",
        key: "category",
        width: 150,
      },
      {
        title: "Status",
        key: "status",
        width: 130,
        render: (_, transaction) => (
          <Tag
            color={
              STATUS_COLORS[
                transaction.status
              ] ?? "default"
            }
          >
            {transaction.status_label}
          </Tag>
        ),
      },
      {
        title: "Valor",
        dataIndex: "amount",
        key: "amount",
        width: 150,
        align: "right",
        render: (value: string) => (
          <Text strong>
            {formatCurrency(value)}
          </Text>
        ),
      },
      {
        title: "Ações",
        key: "actions",
        width: 100,
        align: "center",
        render: (_, transaction) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              navigate(
                `/transactions/${transaction.id}`,
              );
            }}
          >
            Ver
          </Button>
        ),
      },
    ],
    [navigate],
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
            Consulte os dados cadastrais e o histórico
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

          <Card
            title={
              <Space>
                <SwapOutlined />
                Histórico de transações
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => {
                  navigate(
                    "/transactions?customer="
                    + encodeURIComponent(
                      customer.external_id,
                    ),
                  );
                }}
              >
                Ver todas as transações
              </Button>
            }
          >
            {transactionsError ? (
              <Alert
                type="error"
                showIcon
                message="Erro ao carregar histórico"
                description={transactionsError}
                action={
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      void loadTransactions(
                        customer.external_id,
                        transactionPage,
                        transactionPageSize,
                      );
                    }}
                  >
                    Tentar novamente
                  </Button>
                }
                style={{
                  marginBottom: 16,
                }}
              />
            ) : null}

            <Table<Transaction>
              rowKey="id"
              loading={transactionsLoading}
              columns={transactionColumns}
              dataSource={transactions.results}
              scroll={{
                x: 850,
              }}
              locale={{
                emptyText:
                  "Este cliente ainda não possui "
                  + "transações.",
              }}
              pagination={{
                current: transactions.page,
                pageSize: transactions.page_size,
                total: transactions.count,
                showSizeChanger: true,
                pageSizeOptions: [
                  5,
                  10,
                  20,
                ],
                showTotal: (total) =>
                  `${total} transações`,
              }}
              onChange={(pagination) => {
                const nextPage =
                  pagination.current ?? 1;

                const nextPageSize =
                  pagination.pageSize ?? 5;

                if (
                  nextPageSize
                  !== transactionPageSize
                ) {
                  setTransactionPage(1);
                  setTransactionPageSize(
                    nextPageSize,
                  );

                  return;
                }

                setTransactionPage(nextPage);
              }}
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

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
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  savePageScrollPosition,
  usePageScrollRestoration,
} from "../hooks/usePageScrollRestoration";
import { useSmartBack } from "../hooks/useSmartBack";
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

import "./DetailsPage.css";


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
  const location = useLocation();

  const goBack = useSmartBack(
    "/customers",
  );

  const { customerId } = useParams();

  const currentPath =
    `${location.pathname}${location.search}`;

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


  usePageScrollRestoration(
    currentPath,
    !loading && !transactionsLoading,
  );


  const customerItems = useMemo<
    DescriptionsProps["items"]
  >(
    () =>
      customer
        ? [
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
              savePageScrollPosition(
                currentPath,
              );

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
    [
      currentPath,
      navigate,
    ],
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
              goBack();
            }}
          >
            Voltar para clientes
          </Button>
        }
      />
    );
  }


  return (
    <div className="details-page">
      <Flex
        className="details-page-header"
        justify="space-between"
        align="center"
        gap={16}
        wrap
      >
        <div className="details-page-header-copy">
          <Title
            className="details-page-title"
            level={2}
          >
            Detalhes do cliente
          </Title>

          <Paragraph
            className="details-page-description"
            type="secondary"
          >
            Consulte os dados cadastrais e o histórico
            de movimentações.
          </Paragraph>
        </div>

        <Button
          className="details-back-button"
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            goBack();
          }}
        >
          Voltar
        </Button>
      </Flex>

      {loading ? (
        <Card className="details-state-card">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : null}

      {error ? (
        <Alert
          className="details-alert"
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
          <Card className="details-hero-card">
            <div className="details-hero">
              <div className="details-hero-main">
                <div className="details-hero-icon">
                  <TeamOutlined />
                </div>

                <div className="details-hero-copy">
                  <Text className="details-eyebrow">
                    Cliente
                  </Text>

                  <Title
                    className="details-hero-title"
                    level={3}
                  >
                    {customer.name}
                  </Title>

                  <Space
                    className="details-hero-meta"
                    wrap
                  >
                    <Text code>
                      {customer.external_id}
                    </Text>

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
                  </Space>
                </div>
              </div>

              <div className="details-hero-stat">
                <Text type="secondary">
                  Transações registradas
                </Text>

                <Text
                  className="details-hero-stat-value"
                  strong
                >
                  {customer.transaction_count}
                </Text>
              </div>
            </div>

            <Descriptions
              className="details-descriptions"
              bordered
              column={{
                xs: 1,
                md: 2,
              }}
              items={customerItems}
            />
          </Card>

          <Card
            className={
              "details-section-card details-history-card"
            }
            title={
              <div className="details-section-title">
                <SwapOutlined />
                <span>Histórico de transações</span>
              </div>
            }
            extra={
              <Button
                type="link"
                onClick={() => {
                  savePageScrollPosition(
                    currentPath,
                  );

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
                className="details-history-alert"
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
              />
            ) : null}

            <Table<Transaction>
              className="details-table"
              rowKey="id"
              size="middle"
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
                showTotal: (
                  total,
                  range,
                ) =>
                  `${range[0]}–${range[1]} de ${total}`,
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

          <Card
            className={
              "details-section-card details-system-card"
            }
            title={
              <div className="details-section-title">
                Informações do sistema
              </div>
            }
          >
            <Descriptions
              className="details-descriptions"
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
    </div>
  );
}

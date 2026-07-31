import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type {
  TableColumnsType,
} from "antd";
import {
  ArrowLeftOutlined,
  ClearOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  savePageScrollPosition,
  usePageScrollRestoration,
} from "../hooks/usePageScrollRestoration";
import { useSmartBack } from "../hooks/useSmartBack";
import {
  exportTransactionsCsv,
  getTransactionOptions,
  getTransactions,
} from "../services/transactions";
import type { PaginatedResponse } from "../types/api";
import type {
  Transaction,
  TransactionFilters,
  TransactionOptions,
} from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
} from "../utils/formatters";


const { Paragraph, Text, Title } = Typography;


const DEFAULT_FILTERS: TransactionFilters = {
  page: 1,
  page_size: 10,
  ordering: "-transaction_date",
};


function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  const parsedValue = Number(value);

  return (
    Number.isInteger(parsedValue)
    && parsedValue > 0
  )
    ? parsedValue
    : fallback;
}


function getOptionalParameter(
  searchParams: URLSearchParams,
  name: string,
) {
  const value =
    searchParams.get(name)?.trim();

  return value || undefined;
}


function getInitialTransactionFilters(
  searchParams: URLSearchParams,
): TransactionFilters {
  return {
    page: parsePositiveInteger(
      searchParams.get("page"),
      DEFAULT_FILTERS.page,
    ),
    page_size: parsePositiveInteger(
      searchParams.get("page_size"),
      DEFAULT_FILTERS.page_size,
    ),
    search: getOptionalParameter(
      searchParams,
      "search",
    ),
    customer: getOptionalParameter(
      searchParams,
      "customer",
    ),
    status: getOptionalParameter(
      searchParams,
      "status",
    ),
    category: getOptionalParameter(
      searchParams,
      "category",
    ),
    channel: getOptionalParameter(
      searchParams,
      "channel",
    ),
    transaction_type: getOptionalParameter(
      searchParams,
      "transaction_type",
    ),
    state: getOptionalParameter(
      searchParams,
      "state",
    ),
    start_date: getOptionalParameter(
      searchParams,
      "start_date",
    ),
    end_date: getOptionalParameter(
      searchParams,
      "end_date",
    ),
    min_amount: getOptionalParameter(
      searchParams,
      "min_amount",
    ),
    max_amount: getOptionalParameter(
      searchParams,
      "max_amount",
    ),
    ordering:
      getOptionalParameter(
        searchParams,
        "ordering",
      )
      ?? DEFAULT_FILTERS.ordering,
  };
}


function createTransactionSearchParams(
  filters: TransactionFilters,
) {
  const searchParams =
    new URLSearchParams();

  if (
    filters.page
    !== DEFAULT_FILTERS.page
  ) {
    searchParams.set(
      "page",
      String(filters.page),
    );
  }

  if (
    filters.page_size
    !== DEFAULT_FILTERS.page_size
  ) {
    searchParams.set(
      "page_size",
      String(filters.page_size),
    );
  }

  const optionalParameters = {
    search: filters.search,
    customer: filters.customer,
    status: filters.status,
    category: filters.category,
    channel: filters.channel,
    transaction_type:
      filters.transaction_type,
    state: filters.state,
    start_date: filters.start_date,
    end_date: filters.end_date,
    min_amount: filters.min_amount,
    max_amount: filters.max_amount,
  };

  for (
    const [name, value]
    of Object.entries(optionalParameters)
  ) {
    if (value) {
      searchParams.set(name, value);
    }
  }

  if (
    filters.ordering
    && filters.ordering
      !== DEFAULT_FILTERS.ordering
  ) {
    searchParams.set(
      "ordering",
      filters.ordering,
    );
  }

  return searchParams;
}


const statusColors: Record<string, string> = {
  APPROVED: "green",
  REJECTED: "red",
  PENDING: "gold",
  REVERSED: "default",
};


const orderingOptions = [
  {
    value: "-transaction_date",
    label: "Mais recentes",
  },
  {
    value: "transaction_date",
    label: "Mais antigas",
  },
  {
    value: "-amount",
    label: "Maior valor",
  },
  {
    value: "amount",
    label: "Menor valor",
  },
];


interface FilterFormValues {
  search?: string;
  status?: string;
  category?: string;
  channel?: string;
  state?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: string;
  max_amount?: string;
  ordering?: string;
}


export default function TransactionsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const currentPath =
    `${location.pathname}${location.search}`;

  const goBack = useSmartBack(
    "/customers",
  );

  const [form] =
    Form.useForm<FilterFormValues>();

  const { message } = AntApp.useApp();

  const [filters, setFilters] =
    useState<TransactionFilters>(() =>
      getInitialTransactionFilters(
        searchParams,
      )
    );

  const [data, setData] = useState<
    PaginatedResponse<Transaction>
  >({
    count: 0,
    total_pages: 0,
    page: 1,
    page_size: 10,
    next: null,
    previous: null,
    results: [],
  });

  const [options, setOptions] =
    useState<TransactionOptions>({
      categories: [],
      transaction_types: [],
      channels: [],
      statuses: [],
    });

  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] =
    useState(false);

  const [optionsLoading, setOptionsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);


  const tableSectionRef =
    useRef<HTMLDivElement | null>(null);


  usePageScrollRestoration(
    currentPath,
    !loading,
  );


  useEffect(() => {
    const nextSearchParams =
      createTransactionSearchParams(
        filters,
      );

    if (
      nextSearchParams.toString()
      === searchParams.toString()
    ) {
      return;
    }

    setSearchParams(
      nextSearchParams,
      {
        replace: true,
      },
    );
  }, [
    filters,
    searchParams,
    setSearchParams,
  ]);


  useEffect(() => {
    form.setFieldsValue({
      search: filters.search,
      status: filters.status,
      category: filters.category,
      channel: filters.channel,
      state: filters.state,
      start_date: filters.start_date,
      end_date: filters.end_date,
      min_amount: filters.min_amount,
      max_amount: filters.max_amount,
      ordering: filters.ordering,
    });
  }, [
    filters,
    form,
  ]);


  const loadTransactions = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await getTransactions(
          filters,
        );

        setData(response);
      } catch {
        setErrorMessage(
          "Não foi possível carregar as transações.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );


  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);


  useEffect(() => {
    async function loadOptions() {
      setOptionsLoading(true);

      try {
        const response =
          await getTransactionOptions();

        setOptions(response);
      } catch {
        void message.error(
          "Não foi possível carregar as opções de filtro.",
        );
      } finally {
        setOptionsLoading(false);
      }
    }

    void loadOptions();
  }, [message]);


  function handleFiltersSubmit(
    values: FilterFormValues,
  ) {
    setFilters((current) => ({
      ...current,
      ...values,
      page: 1,
    }));
  }


  function handleClearFilters() {
    form.resetFields();

    setFilters({
      ...DEFAULT_FILTERS,
    });
  }


  async function handleExportCsv() {
    setExporting(true);

    try {
      const csv = await exportTransactionsCsv(
        filters,
      );

      const url = URL.createObjectURL(csv);
      const link = document.createElement("a");

      const currentDate = new Date();

      const date = [
        currentDate.getFullYear(),
        String(
          currentDate.getMonth() + 1,
        ).padStart(2, "0"),
        String(
          currentDate.getDate(),
        ).padStart(2, "0"),
      ].join("-");

      link.href = url;
      link.download = `transacoes-${date}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      void message.success(
        "Arquivo CSV exportado com sucesso.",
      );
    } catch {
      void message.error(
        "Não foi possível exportar as transações.",
      );
    } finally {
      setExporting(false);
    }
  }

  function scrollToTableStart() {
    window.requestAnimationFrame(() => {
      tableSectionRef.current
        ?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
    });
  }


  const columns: TableColumnsType<Transaction> = [
    {
      title: "Identificador",
      dataIndex: "external_id",
      key: "external_id",
      width: 150,
      fixed: "left",
      render: (value: string) => (
        <Text code>{value}</Text>
      ),
    },
    {
      title: "Data",
      dataIndex: "transaction_date",
      key: "transaction_date",
      width: 160,
      render: (value: string) =>
        formatDateTime(value),
    },
    {
      title: "Cliente",
      key: "customer",
      width: 220,
      render: (_, transaction) => (
        <Space orientation="vertical" size={0}>
          <Text strong>
            {transaction.customer.name}
          </Text>

          <Text type="secondary">
            {transaction.customer.external_id}
          </Text>
        </Space>
      ),
    },
    {
      title: "Categoria",
      dataIndex: "category_label",
      key: "category",
      width: 150,
    },
    {
      title: "Canal",
      dataIndex: "channel_label",
      key: "channel",
      width: 190,
    },
    {
      title: "Local",
      key: "location",
      width: 170,
      render: (_, transaction) => {
        const location = [
          transaction.city,
          transaction.state,
        ]
          .filter(Boolean)
          .join(" - ");

        return location || "—";
      },
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_, transaction) => (
        <Tag
          color={
            statusColors[transaction.status]
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
      width: 140,
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
      fixed: "right",
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
  ];


  return (
    <>
      <Space
        align="start"
        style={{
          marginBottom: 16,
        }}
      >
        {filters.customer ? (
          <Button
            type="text"
            aria-label="Voltar para o cliente"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              goBack();
            }}
          />
        ) : null}

        <div>
          <Title
            level={2}
            style={{
              marginBottom: 4,
            }}
          >
            Transações
          </Title>

          <Paragraph
            type="secondary"
            style={{
              marginBottom: 0,
            }}
          >
            Consulte e filtre as transações registradas
            na plataforma.
          </Paragraph>
        </div>
      </Space>

      {filters.customer ? (
        <Alert
          type="info"
          showIcon
          message="Filtro de cliente aplicado"
          description={
            `Exibindo somente as transações de `
            + filters.customer
          }
          action={
            <Button
              size="small"
              onClick={handleClearFilters}
            >
              Remover filtro
            </Button>
          }
          style={{
            marginBottom: 16,
          }}
        />
      ) : null}

      <Card
        title={
          <Space>
            <FilterOutlined />
            Filtros
          </Space>
        }
        style={{
          marginBottom: 16,
        }}
      >
        <Form<FilterFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            ordering: "-transaction_date",
          }}
          onFinish={handleFiltersSubmit}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item
                name="search"
                label="Busca"
              >
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="ID, cliente ou descrição"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="status"
                label="Status"
              >
                <Select
                  allowClear
                  loading={optionsLoading}
                  options={options.statuses}
                  placeholder="Todos"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="category"
                label="Categoria"
              >
                <Select
                  allowClear
                  loading={optionsLoading}
                  options={options.categories}
                  placeholder="Todas"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="channel"
                label="Canal"
              >
                <Select
                  allowClear
                  loading={optionsLoading}
                  options={options.channels}
                  placeholder="Todos"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="state"
                label="UF"
              >
                <Input
                  allowClear
                  maxLength={2}
                  placeholder="SP"
                  onInput={(event) => {
                    const input =
                      event.currentTarget;

                    input.value =
                      input.value.toUpperCase();
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="start_date"
                label="Data inicial"
              >
                <Input type="date" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="end_date"
                label="Data final"
              >
                <Input type="date" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="min_amount"
                label="Valor mínimo"
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="R$"
                  placeholder="0,00"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} xl={4}>
              <Form.Item
                name="max_amount"
                label="Valor máximo"
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="R$"
                  placeholder="0,00"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} xl={8}>
              <Form.Item
                name="ordering"
                label="Ordenação"
              >
                <Select
                  options={orderingOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Space wrap>
            <Button
              type="primary"
              htmlType="submit"
              icon={<FilterOutlined />}
            >
              Aplicar filtros
            </Button>

            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
            >
              Limpar
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                void loadTransactions();
              }}
            >
              Atualizar
            </Button>

            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              disabled={loading}
              onClick={() => {
                void handleExportCsv();
              }}
            >
              Exportar CSV
            </Button>
          </Space>
        </Form>
      </Card>

      {errorMessage && (
        <Alert
          type="error"
          showIcon
          message={errorMessage}
          action={
            <Button
              size="small"
              onClick={() => {
                void loadTransactions();
              }}
            >
              Tentar novamente
            </Button>
          }
          style={{
            marginBottom: 16,
          }}
        />
      )}

      {loading && data.results.length === 0 ? (
        <Card>
          <Skeleton
            active
            title={false}
            paragraph={{
              rows: 7,
            }}
          />
        </Card>
      ) : (
        <div
          ref={tableSectionRef}
          style={{
            scrollMarginTop: 88,
          }}
        >
          <Card>
            <Table<Transaction>
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={data.results}
              scroll={{
                x: 1410,
              }}
              pagination={{
                current: data.page,
                pageSize: data.page_size,
                total: data.count,
                showSizeChanger: true,
                pageSizeOptions: [
                  10,
                  20,
                  50,
                  100,
                ],
                showTotal: (total) =>
                  `${total} transações`,
                onChange: (
                  page,
                  pageSize,
                ) => {
                  setFilters((current) => ({
                    ...current,
                    page,
                    page_size: pageSize,
                  }));

                  scrollToTableStart();
                },
              }}
              locale={{
                emptyText:
                  "Nenhuma transação encontrada.",
              }}
            />
          </Card>
        </div>
      )}
    </>
  );
}

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
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type {
  TableColumnsType,
} from "antd";
import {
  ClearOutlined,
  FilterOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
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

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const initialCustomerFilter =
    searchParams.get("customer")?.trim();

  const [form] = Form.useForm<FilterFormValues>();
  const { message } = AntApp.useApp();

  const [filters, setFilters] =
    useState<TransactionFilters>(() => ({
      ...DEFAULT_FILTERS,
      ...(initialCustomerFilter
        ? {
            customer: initialCustomerFilter,
          }
        : {}),
    }));

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
  const [optionsLoading, setOptionsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);


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

    setSearchParams(
      {},
      {
        replace: true,
      },
    );

    setFilters({
      ...DEFAULT_FILTERS,
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
      <Title
        level={2}
        style={{
          marginBottom: 4,
        }}
      >
        Transações
      </Title>

      <Paragraph type="secondary">
        Consulte e filtre as transações registradas na
        plataforma.
      </Paragraph>

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
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total) =>
              `${total} transações`,
            onChange: (page, pageSize) => {
              setFilters((current) => ({
                ...current,
                page,
                page_size: pageSize,
              }));
            },
          }}
          locale={{
            emptyText: "Nenhuma transação encontrada.",
          }}
        />
      </Card>
    </>
  );
}

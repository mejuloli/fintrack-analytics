import {
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
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
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { getCustomers } from "../services/customers";
import type {
  Customer,
  GetCustomersParams,
} from "../types/customer";

import "./ListPage.css";


const {
  Paragraph,
  Text,
  Title,
} = Typography;


interface FilterFormValues {
  search?: string;
  state?: string;
  is_active?: boolean;
  ordering?: string;
}


const ORDERING_OPTIONS = [
  {
    label: "Nome: A–Z",
    value: "name",
  },
  {
    label: "Nome: Z–A",
    value: "-name",
  },
  {
    label: "Identificador crescente",
    value: "external_id",
  },
  {
    label: "Identificador decrescente",
    value: "-external_id",
  },
  {
    label: "Mais recentes",
    value: "-created_at",
  },
  {
    label: "Mais antigos",
    value: "created_at",
  },
];


export default function CustomersPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<FilterFormValues>();

  const [customers, setCustomers] = useState<
    Customer[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] =
    useState<FilterFormValues>({
      ordering: "name",
    });


  const loadCustomers = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      nextFilters = filters,
    ) => {
      setLoading(true);

      const params: GetCustomersParams = {
        page: nextPage,
        page_size: nextPageSize,
        ordering:
          nextFilters.ordering ?? "name",
      };

      const search =
        nextFilters.search?.trim();

      const state =
        nextFilters.state?.trim().toUpperCase();

      if (search) {
        params.search = search;
      }

      if (state) {
        params.state = state;
      }

      if (
        typeof nextFilters.is_active
        === "boolean"
      ) {
        params.is_active =
          nextFilters.is_active;
      }

      try {
        const response =
          await getCustomers(params);

        setCustomers(response.results);
        setTotal(response.count);
        setPage(response.page);
        setPageSize(response.page_size);
      } catch {
        void message.error(
          "Não foi possível carregar os clientes.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      filters,
      message,
      page,
      pageSize,
    ],
  );


  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);


  const columns = useMemo<
    TableColumnsType<Customer>
  >(
    () => [
      {
        title: "Cliente",
        key: "customer",
        render: (_, customer) => (
          <Space>
            <TeamOutlined />

            <div>
              <Text strong>
                {customer.name}
              </Text>

              <br />

              <Text type="secondary">
                {customer.external_id}
              </Text>
            </div>
          </Space>
        ),
      },
      {
        title: "E-mail",
        dataIndex: "email",
        key: "email",
        responsive: ["md"],
        render: (email: string) =>
          email || "Não informado",
      },
      {
        title: "Localização",
        key: "location",
        responsive: ["lg"],
        render: (_, customer) => {
          const location = [
            customer.city,
            customer.state,
          ]
            .filter(Boolean)
            .join(" - ");

          return location || "Não informada";
        },
      },
      {
        title: "Transações",
        dataIndex: "transaction_count",
        key: "transaction_count",
        align: "right",
      },
      {
        title: "Status",
        dataIndex: "is_active",
        key: "is_active",
        render: (isActive: boolean) => (
          <Tag color={isActive ? "green" : "default"}>
            {isActive ? "Ativo" : "Inativo"}
          </Tag>
        ),
      },
      {
        title: "Ações",
        key: "actions",
        align: "right",
        width: 110,
        render: (_, customer) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              navigate(
                `/customers/${customer.id}`,
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


  function handleSubmit(
    values: FilterFormValues,
  ) {
    const nextFilters = {
      ...values,
      state: values.state
        ?.trim()
        .toUpperCase(),
      ordering:
        values.ordering ?? "name",
    };

    setFilters(nextFilters);
    setPage(1);

    void loadCustomers(
      1,
      pageSize,
      nextFilters,
    );
  }


  function handleReset() {
    const nextFilters: FilterFormValues = {
      ordering: "name",
    };

    form.resetFields();
    form.setFieldsValue(nextFilters);

    setFilters(nextFilters);
    setPage(1);

    void loadCustomers(
      1,
      pageSize,
      nextFilters,
    );
  }


  return (
    <div className="list-page">
      <div className="list-page-header">
        <Title
          className="list-page-title"
          level={2}
        >
          Clientes
        </Title>

        <Paragraph
          className="list-page-description"
          type="secondary"
        >
          Consulte clientes e acompanhe suas
          movimentações.
        </Paragraph>
      </div>

      <Card
        className="list-page-filters-card"
        title={
          <Space>
            <FilterOutlined />
            Filtros
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            ordering: "name",
          }}
          onFinish={handleSubmit}
        >
          <div className="list-page-filter-grid">
            <Form.Item
              name="search"
              label="Buscar"
            >
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={
                  "Nome, e-mail ou identificador"
                }
              />
            </Form.Item>

            <Form.Item
              name="state"
              label="Estado"
            >
              <Input
                allowClear
                maxLength={2}
                placeholder="UF"
                onInput={(event) => {
                  const input =
                    event.currentTarget;

                  input.value =
                    input.value.toUpperCase();
                }}
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Status"
            >
              <Select
                allowClear
                placeholder="Todos"
                options={[
                  {
                    label: "Ativos",
                    value: true,
                  },
                  {
                    label: "Inativos",
                    value: false,
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="ordering"
              label="Ordenação"
            >
              <Select
                options={ORDERING_OPTIONS}
              />
            </Form.Item>
          </div>

          <Space
            className="list-page-actions"
            wrap
          >
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              Limpar
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
            >
              Aplicar filtros
            </Button>
          </Space>
        </Form>
      </Card>

      <div className="list-page-table-section">
        <Card
          className="list-page-table-card"
          title={
            <div className="list-page-results-heading">
              <Text
                className="list-page-results-title"
                strong
              >
                Resultados
              </Text>

              <Text
                className="list-page-results-count"
                type="secondary"
              >
                {total}{" "}
                {total === 1
                  ? "cliente encontrado"
                  : "clientes encontrados"}
              </Text>
            </div>
          }
        >
          <Table<Customer>
            className="list-page-table"
            rowKey="id"
            size="middle"
            loading={loading}
            columns={columns}
            dataSource={customers}
            scroll={{
              x: 900,
            }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [
                10,
                20,
                50,
              ],
              showTotal: (
                value,
                range,
              ) =>
                `${range[0]}–${range[1]} de ${value}`,
            }}
            locale={{
              emptyText:
                "Nenhum cliente encontrado.",
            }}
            onChange={(pagination) => {
              const nextPage =
                pagination.current ?? 1;

              const nextPageSize =
                pagination.pageSize ?? 10;

              void loadCustomers(
                nextPageSize !== pageSize
                  ? 1
                  : nextPage,
                nextPageSize,
              );
            }}
          />
        </Card>
      </div>
    </div>
  );
}

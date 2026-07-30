import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App as AntApp,
  Button,
  Card,
  Flex,
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
        fixed: "right",
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
    <Space
      orientation="vertical"
      size="large"
      style={{
        width: "100%",
      }}
    >
      <div>
        <Title level={2}>
          Clientes
        </Title>

        <Paragraph type="secondary">
          Consulte clientes e acompanhe suas
          movimentações.
        </Paragraph>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            ordering: "name",
          }}
          onFinish={handleSubmit}
        >
          <Flex gap={16} wrap>
            <Form.Item
              name="search"
              label="Buscar"
              style={{
                flex: "1 1 280px",
              }}
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
              style={{
                flex: "0 1 120px",
              }}
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
              style={{
                flex: "0 1 180px",
              }}
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
              style={{
                flex: "0 1 230px",
              }}
            >
              <Select
                options={ORDERING_OPTIONS}
              />
            </Form.Item>
          </Flex>

          <Flex justify="flex-end" gap={8} wrap>
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
          </Flex>
        </Form>
      </Card>

      <Card>
        <Table<Customer>
          rowKey="id"
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
            showTotal: (value) =>
              `${value} clientes`,
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
    </Space>
  );
}

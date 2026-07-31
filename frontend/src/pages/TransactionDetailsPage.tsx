import {
  ArrowLeftOutlined,
  ReloadOutlined,
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
import type { DescriptionsProps } from "antd";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "react-router-dom";

import { useSmartBack } from "../hooks/useSmartBack";
import { getTransaction } from "../services/transactions";
import type { Transaction } from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
} from "../utils/formatters";


const { Paragraph, Text, Title } = Typography;


const statusColors: Record<string, string> = {
  APPROVED: "green",
  REJECTED: "red",
  PENDING: "gold",
  REVERSED: "default",
};


export default function TransactionDetailsPage() {
  const goBack = useSmartBack(
    "/transactions",
  );

  const {
    transactionId: transactionIdParameter,
  } = useParams();

  const transactionId = Number(
    transactionIdParameter,
  );

  const isValidTransactionId =
    Number.isInteger(transactionId) &&
    transactionId > 0;

  const [transaction, setTransaction] =
    useState<Transaction | null>(null);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);


  const loadTransaction = useCallback(
    async () => {
      if (!isValidTransactionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await getTransaction(
          transactionId,
        );

        setTransaction(response);
      } catch {
        setTransaction(null);

        setErrorMessage(
          "Não foi possível carregar os detalhes da transação.",
        );
      } finally {
        setLoading(false);
      }
    },
    [isValidTransactionId, transactionId],
  );


  useEffect(() => {
    void loadTransaction();
  }, [loadTransaction]);


  if (!isValidTransactionId) {
    return (
      <Result
        status="404"
        title="Transação inválida"
        subTitle="O identificador informado não é válido."
        extra={
          <Button
            type="primary"
            onClick={() => {
              goBack();
            }}
          >
            Voltar para transações
          </Button>
        }
      />
    );
  }


  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }


  if (errorMessage || !transaction) {
    return (
      <>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            goBack();
          }}
          style={{
            marginBottom: 16,
          }}
        >
          Voltar
        </Button>

        <Alert
          type="error"
          showIcon
          message={errorMessage}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                void loadTransaction();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </>
    );
  }


  const generalItems: DescriptionsProps["items"] = [
    {
      key: "external_id",
      label: "Identificador",
      children: (
        <Text code>
          {transaction.external_id}
        </Text>
      ),
    },
    {
      key: "amount",
      label: "Valor",
      children: (
        <Text strong>
          {formatCurrency(transaction.amount)}
        </Text>
      ),
    },
    {
      key: "status",
      label: "Status",
      children: (
        <Tag
          color={
            statusColors[transaction.status] ??
            "default"
          }
        >
          {transaction.status_label}
        </Tag>
      ),
    },
    {
      key: "transaction_date",
      label: "Data da transação",
      children: formatDateTime(
        transaction.transaction_date,
      ),
    },
    {
      key: "category",
      label: "Categoria",
      children: transaction.category_label,
    },
    {
      key: "transaction_type",
      label: "Tipo",
      children:
        transaction.transaction_type_label,
    },
    {
      key: "channel",
      label: "Canal",
      children: transaction.channel_label,
    },
    {
      key: "description",
      label: "Descrição",
      children: transaction.description || "—",
      span: 2,
    },
  ];


  const customerItems: DescriptionsProps["items"] = [
    {
      key: "customer_name",
      label: "Nome",
      children: transaction.customer.name,
    },
    {
      key: "customer_external_id",
      label: "Identificador",
      children: (
        <Text code>
          {transaction.customer.external_id}
        </Text>
      ),
    },
    {
      key: "location",
      label: "Local",
      children:
        [
          transaction.city,
          transaction.state,
        ]
          .filter(Boolean)
          .join(" - ") || "—",
    },
  ];


  const systemItems: DescriptionsProps["items"] = [
    {
      key: "id",
      label: "ID interno",
      children: transaction.id,
    },
    {
      key: "created_at",
      label: "Criada em",
      children: formatDateTime(
        transaction.created_at,
      ),
    },
    {
      key: "updated_at",
      label: "Atualizada em",
      children: formatDateTime(
        transaction.updated_at,
      ),
    },
  ];


  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap={16}
        wrap
        style={{
          marginBottom: 24,
        }}
      >
        <Space align="start">
          <Button
            type="text"
            aria-label="Voltar para transações"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              goBack();
            }}
          />

          <div>
            <Title
              level={2}
              style={{
                marginBottom: 4,
              }}
            >
              Detalhes da transação
            </Title>

            <Paragraph
              type="secondary"
              style={{
                marginBottom: 0,
              }}
            >
              Consulte todas as informações registradas.
            </Paragraph>
          </div>
        </Space>

        <Space>
          <Text code>
            {transaction.external_id}
          </Text>

          <Tag
            color={
              statusColors[transaction.status] ??
              "default"
            }
          >
            {transaction.status_label}
          </Tag>
        </Space>
      </Flex>

      <Space
        orientation="vertical"
        size={16}
        style={{
          display: "flex",
        }}
      >
        <Card title="Informações da transação">
          <Descriptions
            bordered
            column={{
              xs: 1,
              md: 2,
              xl: 3,
            }}
            items={generalItems}
          />
        </Card>

        <Card title="Cliente e localização">
          <Descriptions
            bordered
            column={{
              xs: 1,
              md: 2,
              xl: 3,
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
              xl: 3,
            }}
            items={systemItems}
          />
        </Card>
      </Space>
    </>
  );
}

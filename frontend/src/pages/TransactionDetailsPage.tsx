import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  FileTextOutlined,
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

import "./DetailsPage.css";


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
      <div className="details-page">
        <Flex
          className="details-page-header"
          align="center"
          justify="space-between"
          gap={16}
          wrap
        >
          <div className="details-page-header-copy">
            <Title
              className="details-page-title"
              level={2}
            >
              Detalhes da transação
            </Title>

            <Paragraph
              className="details-page-description"
              type="secondary"
            >
              Consulte todas as informações registradas.
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

        <Card className="details-state-card">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }


  if (errorMessage || !transaction) {
    return (
      <div className="details-page">
        <Flex
          className="details-page-header"
          align="center"
          justify="space-between"
          gap={16}
          wrap
        >
          <div className="details-page-header-copy">
            <Title
              className="details-page-title"
              level={2}
            >
              Detalhes da transação
            </Title>

            <Paragraph
              className="details-page-description"
              type="secondary"
            >
              Consulte todas as informações registradas.
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

        <Alert
          className="details-alert"
          type="error"
          showIcon
          message={
            errorMessage
            ?? "Não foi possível carregar a transação."
          }
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
      </div>
    );
  }


  const generalItems: DescriptionsProps["items"] = [
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
      span: 3,
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
    <div className="details-page">
      <Flex
        className="details-page-header"
        align="center"
        justify="space-between"
        gap={16}
        wrap
      >
        <div className="details-page-header-copy">
          <Title
            className="details-page-title"
            level={2}
          >
            Detalhes da transação
          </Title>

          <Paragraph
            className="details-page-description"
            type="secondary"
          >
            Consulte todas as informações registradas.
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

      <Card className="details-hero-card">
        <div className="details-hero">
          <div className="details-hero-main">
            <div className="details-hero-icon">
              <SwapOutlined />
            </div>

            <div className="details-hero-copy">
              <Text className="details-eyebrow">
                Transação
              </Text>

              <Title
                className="details-hero-title"
                level={3}
              >
                {transaction.external_id}
              </Title>

              <Space
                className="details-hero-meta"
                wrap
              >
                <Tag
                  color={
                    statusColors[
                      transaction.status
                    ] ?? "default"
                  }
                >
                  {transaction.status_label}
                </Tag>

                <Text type="secondary">
                  {formatDateTime(
                    transaction.transaction_date,
                  )}
                </Text>
              </Space>
            </div>
          </div>

          <div
            className={
              "details-hero-stat "
              + "details-transaction-amount"
            }
          >
            <Text type="secondary">
              Valor da transação
            </Text>

            <Text
              className="details-hero-stat-value"
              strong
            >
              {formatCurrency(transaction.amount)}
            </Text>
          </div>
        </div>
      </Card>

      <Card
        className={
          "details-section-card "
          + "details-descriptions-card"
        }
        title={
          <div className="details-section-title">
            <FileTextOutlined />
            <span>Informações da transação</span>
          </div>
        }
      >
        <Descriptions
          className="details-descriptions"
          bordered
          column={{
            xs: 1,
            md: 2,
            xl: 3,
          }}
          items={generalItems}
        />
      </Card>

      <div className="details-secondary-grid">
        <Card
          className={
            "details-section-card "
            + "details-descriptions-card"
          }
          title={
            <div className="details-section-title">
              <TeamOutlined />
              <span>Cliente e localização</span>
            </div>
          }
        >
          <Descriptions
            className="details-descriptions"
            bordered
            column={1}
            items={customerItems}
          />
        </Card>

        <Card
          className={
            "details-section-card "
            + "details-descriptions-card"
          }
          title={
            <div className="details-section-title">
              <DatabaseOutlined />
              <span>Informações do sistema</span>
            </div>
          }
        >
          <Descriptions
            className="details-descriptions"
            bordered
            column={1}
            items={systemItems}
          />
        </Card>
      </div>
    </div>
  );
}

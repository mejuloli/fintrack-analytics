import {
  BankOutlined,
  CalendarOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  SwapOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../hooks/useAuth";
import {
  getDashboardAnalytics,
} from "../services/dashboard";
import type {
  DashboardAnalytics,
} from "../types/dashboard";

import "./DashboardPage.css";


const {
  Paragraph,
  Text,
  Title,
} = Typography;


const PERIOD_OPTIONS = [
  {
    label: "Últimos 7 dias",
    value: 7,
  },
  {
    label: "Últimos 30 dias",
    value: 30,
  },
  {
    label: "Últimos 60 dias",
    value: 60,
  },
  {
    label: "Últimos 90 dias",
    value: 90,
  },
  {
    label: "Últimos 180 dias",
    value: 180,
  },
  {
    label: "Últimos 365 dias",
    value: 365,
  },
];


const STATUS_COLORS: Record<string, string> = {
  APPROVED: "green",
  REJECTED: "red",
  PENDING: "gold",
  REVERSED: "default",
};


const currencyFormatter = new Intl.NumberFormat(
  "pt-BR",
  {
    style: "currency",
    currency: "BRL",
  },
);


const shortDateFormatter = new Intl.DateTimeFormat(
  "pt-BR",
  {
    day: "2-digit",
    month: "2-digit",
  },
);


const fullDateFormatter = new Intl.DateTimeFormat(
  "pt-BR",
  {
    day: "2-digit",
    month: "long",
    year: "numeric",
  },
);


function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}


function formatMoney(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(amount);
}


function formatShortDate(date: string) {
  return shortDateFormatter.format(
    parseDate(date),
  );
}


function formatFullDate(date: string) {
  return fullDateFormatter.format(
    parseDate(date),
  );
}


interface DashboardChartItem {
  key: string;
  label: string;
  description: string;
  count: number;
  amount: number;
}


const monthDateFormatter =
  new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "short",
      year: "2-digit",
    },
  );


function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase()
    + value.slice(1)
  );
}


function buildDashboardChartItems(
  analytics: DashboardAnalytics,
): DashboardChartItem[] {
  const {
    daily,
    period,
  } = analytics;

  if (period.days <= 30) {
    const labelInterval =
      period.days <= 7
        ? 1
        : period.days <= 14
          ? 2
          : 3;

    return daily.map((item, index) => ({
      key: item.date,
      label:
        index % labelInterval === 0
        || index === daily.length - 1
          ? formatShortDate(item.date)
          : "",
      description: formatFullDate(
        item.date,
      ),
      count: item.count,
      amount: Number(item.amount),
    }));
  }

  if (period.days <= 90) {
    const weeklyItems: DashboardChartItem[] =
      [];

    for (
      let index = 0;
      index < daily.length;
      index += 7
    ) {
      const week = daily.slice(
        index,
        index + 7,
      );

      const firstDay = week[0];
      const lastDay = week[
        week.length - 1
      ];

      if (!firstDay || !lastDay) {
        continue;
      }

      weeklyItems.push({
        key: firstDay.date,
        label: (
          `${formatShortDate(
            firstDay.date,
          )}–${formatShortDate(
            lastDay.date,
          )}`
        ),
        description: (
          `De ${formatFullDate(
            firstDay.date,
          )} até ${formatFullDate(
            lastDay.date,
          )}`
        ),
        count: week.reduce(
          (total, item) =>
            total + item.count,
          0,
        ),
        amount: week.reduce(
          (total, item) =>
            total + Number(item.amount),
          0,
        ),
      });
    }

    return weeklyItems;
  }

  const monthlyItems = new Map<
    string,
    DashboardChartItem
  >();

  for (const item of daily) {
    const monthKey = item.date.slice(
      0,
      7,
    );

    const existing =
      monthlyItems.get(monthKey);

    if (existing) {
      existing.count += item.count;
      existing.amount += Number(
        item.amount,
      );

      continue;
    }

    const monthDate = parseDate(
      `${monthKey}-01`,
    );

    const monthLabel = capitalize(
      monthDateFormatter.format(
        monthDate,
      ),
    );

    monthlyItems.set(
      monthKey,
      {
        key: monthKey,
        label: monthLabel,
        description: monthLabel,
        count: item.count,
        amount: Number(item.amount),
      },
    );
  }

  return Array.from(
    monthlyItems.values(),
  );
}


function getChartTitle(days: number) {
  if (days <= 30) {
    return "Evolução diária do volume";
  }

  if (days <= 90) {
    return "Evolução semanal do volume";
  }

  return "Evolução mensal do volume";
}


export default function DashboardPage() {
  const { user } = useAuth();

  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );


  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await getDashboardAnalytics(days);

      setAnalytics(response);
    } catch {
      setError(
        "Não foi possível carregar os dados do dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [days]);


  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);


  const chartItems = useMemo(
    () =>
      analytics
        ? buildDashboardChartItems(
            analytics,
          )
        : [],
    [analytics],
  );


  const maxChartAmount = useMemo(
    () =>
      Math.max(
        ...chartItems.map(
          (item) => item.amount,
        ),
        1,
      ),
    [chartItems],
  );


  const maxCategoryAmount = useMemo(() => {
    if (!analytics) {
      return 1;
    }

    return Math.max(
      ...analytics.by_category.map(
        (item) => Number(item.amount),
      ),
      1,
    );
  }, [analytics]);


  return (
    <div className="dashboard-page">
      <Flex
        className="dashboard-header"
        justify="space-between"
        align="center"
        wrap
      >
        <div className="dashboard-header-copy">
          <Text className="dashboard-eyebrow">
            Visão geral
          </Text>

          <Title
            className="dashboard-title"
            level={2}
          >
            Olá, {user?.name}
          </Title>

          <Paragraph
            className="dashboard-description"
            type="secondary"
          >
            Acompanhe os principais indicadores das
            transações financeiras.
          </Paragraph>
        </div>

        <Space
          className="dashboard-header-actions"
          wrap
        >
          <Select
            className="dashboard-period-select"
            value={days}
            options={PERIOD_OPTIONS}
            aria-label="Período analisado"
            onChange={setDays}
          />

          <Button
            className="dashboard-refresh-button"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => {
              void loadDashboard();
            }}
          >
            Atualizar
          </Button>
        </Space>
      </Flex>

      {error && (
        <Alert
          className="dashboard-alert"
          type="error"
          showIcon
          message="Erro ao carregar dashboard"
          description={error}
          action={
            <Button
              size="small"
              onClick={() => {
                void loadDashboard();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      )}

      {loading && !analytics ? (
        <Card className="dashboard-state-card">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : null}

      {!loading && !analytics ? (
        <Card className="dashboard-state-card">
          <Empty
            description="Nenhum dado disponível."
          />
        </Card>
      ) : null}

      {analytics ? (
        <>
          <div className="dashboard-period-summary">
            <CalendarOutlined />

            <Text type="secondary">
              Período analisado:{" "}
              <Text strong>
                {formatFullDate(
                  analytics.period.start_date,
                )}
              </Text>{" "}
              até{" "}
              <Text strong>
                {formatFullDate(
                  analytics.period.end_date,
                )}
              </Text>
            </Text>
          </div>

          <Row
            className="dashboard-metrics-grid"
            gutter={[16, 16]}
          >
            <Col xs={24} sm={12} xl={8}>
              <Card className="dashboard-metric-card">

                <Statistic
                  title={
                    <div className="dashboard-metric-header">
                      <span>Clientes cadastrados</span>

                      <span
                        className="dashboard-metric-header-icon"
                        aria-hidden="true"
                      >
                        <TeamOutlined />
                      </span>
                    </div>
                  }
                  value={
                    analytics.summary.total_customers
                  }
                  suffix={
                    <Text type="secondary">
                      /{" "}
                      {
                        analytics.summary
                          .active_customers
                      }{" "}
                      ativos
                    </Text>
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={8}>
              <Card className="dashboard-metric-card">

                <Statistic
                  title={
                    <div className="dashboard-metric-header">
                      <span>Clientes movimentando</span>

                      <span
                        className="dashboard-metric-header-icon"
                        aria-hidden="true"
                      >
                        <RiseOutlined />
                      </span>
                    </div>
                  }
                  value={
                    analytics.summary
                      .customers_with_transactions
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={8}>
              <Card className="dashboard-metric-card">

                <Statistic
                  title={
                    <div className="dashboard-metric-header">
                      <span>Transações no período</span>

                      <span
                        className="dashboard-metric-header-icon"
                        aria-hidden="true"
                      >
                        <SwapOutlined />
                      </span>
                    </div>
                  }
                  value={
                    analytics.summary
                      .total_transactions
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={8}>
              <Card className="dashboard-metric-card">

                <Statistic
                  title={
                    <div className="dashboard-metric-header">
                      <span>Volume movimentado</span>

                      <span
                        className="dashboard-metric-header-icon"
                        aria-hidden="true"
                      >
                        <BankOutlined />
                      </span>
                    </div>
                  }
                  value={formatMoney(
                    analytics.summary.total_amount,
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={8}>
              <Card className="dashboard-metric-card">

                <Statistic
                  title={
                    <div className="dashboard-metric-header">
                      <span>Ticket médio</span>

                      <span
                        className="dashboard-metric-header-icon"
                        aria-hidden="true"
                      >
                        <CalculatorOutlined />
                      </span>
                    </div>
                  }
                  value={formatMoney(
                    analytics.summary.average_ticket,
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={8}>
              <Card className="dashboard-metric-card">

                <Statistic
                  title={
                    <div className="dashboard-metric-header">
                      <span>Taxa de aprovação</span>

                      <span
                        className="dashboard-metric-header-icon"
                        aria-hidden="true"
                      >
                        <CheckCircleOutlined />
                      </span>
                    </div>
                  }
                  value={
                    analytics.summary.approval_rate
                  }
                  precision={2}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>

          <Row
            className="dashboard-analysis-grid"
            gutter={[16, 16]}
          >
            <Col xs={24} xl={12}>
              <Card
                className="dashboard-panel-card"
                title="Transações por status"
              >
                <Space
                  className="dashboard-distribution-list"
                  orientation="vertical"
                  size="middle"
                >
                  {analytics.by_status.map(
                    (item) => {
                      const percentage =
                        analytics.summary
                          .total_transactions > 0
                          ? (
                              item.count
                              / analytics.summary
                                .total_transactions
                            ) * 100
                          : 0;

                      return (
                        <div
                          className={
                            "dashboard-distribution-item"
                          }
                          key={item.value}
                        >
                          <Flex
                            className={
                              "dashboard-distribution-header"
                            }
                            justify="space-between"
                            align="center"
                          >
                            <Space>
                              <Tag
                                color={
                                  STATUS_COLORS[
                                    item.value
                                  ]
                                }
                              >
                                {item.label}
                              </Tag>

                              <Text type="secondary">
                                {item.count} transações
                              </Text>
                            </Space>

                            <div
                              className={
                                "dashboard-distribution-description"
                              }
                            >
                              <Text strong>
                                {percentage.toFixed(1)}%
                              </Text>

                              <br />

                              <Text type="secondary">
                                {formatMoney(
                                  item.amount,
                                )}
                              </Text>
                            </div>
                          </Flex>

                          <Progress
                            percent={Number(
                              percentage.toFixed(2),
                            )}
                            showInfo={false}
                          />
                        </div>
                      );
                    },
                  )}
                </Space>
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                className="dashboard-panel-card"
                title="Volume por categoria"
              >
                <Space
                  className="dashboard-distribution-list"
                  orientation="vertical"
                  size="middle"
                >
                  {analytics.by_category.map(
                    (item) => {
                      const percentage =
                        (
                          Number(item.amount)
                          / maxCategoryAmount
                        ) * 100;

                      return (
                        <div
                          className={
                            "dashboard-distribution-item"
                          }
                          key={item.value}
                        >
                          <Flex
                            className={
                              "dashboard-distribution-header"
                            }
                            justify="space-between"
                            align="center"
                          >
                            <div>
                              <Text strong>
                                {item.label}
                              </Text>

                              <br />

                              <Text type="secondary">
                                {item.count} transações
                              </Text>
                            </div>

                            <Text strong>
                              {formatMoney(item.amount)}
                            </Text>
                          </Flex>

                          <Progress
                            percent={Number(
                              percentage.toFixed(2),
                            )}
                            showInfo={false}
                          />
                        </div>
                      );
                    },
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          <Card
            className={
              "dashboard-panel-card dashboard-chart-card"
            }
            title={getChartTitle(
              analytics.period.days,
            )}
          >
            <div className="dashboard-chart-scroll">
              <div
                className="dashboard-chart"
                role="list"
                aria-label={getChartTitle(
                  analytics.period.days,
                )}
              >
                {chartItems.map((item) => {
                  const height =
                    item.amount > 0
                      ? Math.max(
                          8,
                          Math.round(
                            (
                              item.amount
                              / maxChartAmount
                            ) * 150,
                          ),
                        )
                      : 2;

                  const transactionLabel =
                    item.count === 1
                      ? "transação"
                      : "transações";

                  const chartItemDescription =
                    `${item.description}: `
                    + `${formatMoney(
                      String(item.amount),
                    )} em `
                    + `${item.count} `
                    + transactionLabel;

                  return (
                    <div
                      className="dashboard-chart-item"
                      key={item.key}
                      role="listitem"
                      tabIndex={0}
                      title={chartItemDescription}
                      aria-label={chartItemDescription}
                    >
                      <span
                        className={
                          "dashboard-chart-count"
                        }
                      >
                        {item.count || ""}
                      </span>

                      <div
                        className={
                          "dashboard-chart-bar"
                        }
                        style={{
                          height: `${height}px`,
                        }}
                      />

                      <span
                        className={
                          "dashboard-chart-label"
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

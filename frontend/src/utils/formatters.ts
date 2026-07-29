const currencyFormatter = new Intl.NumberFormat(
  "pt-BR",
  {
    style: "currency",
    currency: "BRL",
  },
);


const dateTimeFormatter = new Intl.DateTimeFormat(
  "pt-BR",
  {
    dateStyle: "short",
    timeStyle: "short",
  },
);


export function formatCurrency(
  value: string | number,
) {
  const normalizedValue =
    typeof value === "string"
      ? Number(value)
      : value;

  if (!Number.isFinite(normalizedValue)) {
    return "—";
  }

  return currencyFormatter.format(normalizedValue);
}


export function formatDateTime(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateTimeFormatter.format(date);
}

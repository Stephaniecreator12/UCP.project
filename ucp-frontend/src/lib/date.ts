const frenchDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const frenchDateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const FRENCH_DATE_INPUT_PROPS = {
  lang: "fr-FR",
  title: "Format JJ/MM/AAAA",
  placeholder: "JJ/MM/AAAA",
} as const;

const parseDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatFrenchDate = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = parseDate(value);
  return date ? frenchDateFormatter.format(date) : String(value);
};

export const formatFrenchDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = parseDate(value);
  return date ? frenchDateTimeFormatter.format(date) : String(value);
};

export const formatFrenchIsoDate = (value: string | null | undefined) => {
  if (!value) return "";

  const date = parseDate(`${value}T00:00:00`);
  return date ? frenchDateFormatter.format(date) : String(value);
};

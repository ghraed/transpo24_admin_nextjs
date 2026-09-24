// ISO alpha-2 set aligned with the API's class-validator country validation.
export const COUNTRY_CODES = ['AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'] as const;
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const countryLabel = (code: string) => `${names.of(code) ?? code} (${code})`;
export const COUNTRIES = COUNTRY_CODES.map(code => ({ code, label: countryLabel(code) }))
  .sort((a, b) => a.label.localeCompare(b.label, "en"));
export const TRANSPORT_TYPES = {
  VEHICLE_TRANSPORT: "Vehicle",
  MOTORCYCLE_TRANSPORT: "Motorcycle",
  GOODS_TRANSPORT: "Goods",
  FURNITURE_TRANSPORT: "Furniture",
} as const;
export type TransportType = keyof typeof TRANSPORT_TYPES;
export type RouteBlockValues = {
  fromCountryCode: string;
  toCountryCode: string;
  transportType: TransportType | null;
  reason: string | null;
  isActive: boolean;
};
export type RouteBlock = RouteBlockValues & {
  id: string;
  createdByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type RouteBlockList = { items: RouteBlock[]; total: number; page: number; limit: number };
export const typeLabel = (type: TransportType | null) => type ? TRANSPORT_TYPES[type] : "All transport types";
export const directionLabel = (value: RouteBlockValues) => `${countryLabel(value.fromCountryCode)} → ${countryLabel(value.toCountryCode)}`;
export const LIFECYCLE_WARNING = "Blocking this route prevents new requests and new matching once route enforcement is fully deployed. Existing accepted/in-progress transports will not be cancelled automatically.";
export const ROLLOUT_WARNING = "Rollout in progress: request publication checks are implemented; matching and offer checks are pending. Do not rely on route blocks for full operational enforcement yet.";
export function routeBlockError(error: unknown): string {
  const value = error as { message?: string; errors?: { code?: string } } | undefined;
  if (value?.errors?.code === "ROUTE_BLOCK_DUPLICATE") {
    return "An active block already exists for this direction and transport type. Edit the existing block or save this one as inactive.";
  }
  return value?.message || "Could not save the route block. Please try again.";
}

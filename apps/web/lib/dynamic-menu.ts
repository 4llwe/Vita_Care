import { api } from "./api";
import { PUBLIC_MENU, type PublicMenuGroup } from "./public-menu";
export type DynamicMenuItem = {
  id: string;
  label: string;
  slug: string;
  description?: string;
  operationKind?: string;
  requestType?: string;
  headline?: string;
  steps?: string[];
  sla?: string;
  hrefOverride?: string;
  isActive: boolean;
  sortOrder: number;
};
export type DynamicMenuGroup = {
  id: string;
  key: string;
  label: string;
  description?: string;
  items: DynamicMenuItem[];
};
export async function loadDynamicMenu(): Promise<DynamicMenuGroup[]> {
  try {
    return await api<DynamicMenuGroup[]>("/menus", { cache: "no-store" });
  } catch {
    return PUBLIC_MENU.map((g, gi) => ({
      id: `fallback-${g.key}`,
      key: g.key,
      label: g.label,
      items: g.items.map((label, i) => ({
        id: `fallback-${gi}-${i}`,
        label,
        slug: label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        isActive: true,
        sortOrder: i,
      })),
    }));
  }
}
export function asLegacyMenu(rows: DynamicMenuGroup[]): PublicMenuGroup[] {
  return rows.map((g) => ({
    key: g.key,
    label: g.label,
    items: g.items.map((i) => i.label),
  }));
}

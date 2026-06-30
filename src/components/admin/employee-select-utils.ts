import type { Department, Employee } from "@/types/database";

export const NONE_VALUE = "__none__";

export type PersonOption = Pick<Employee, "id" | "full_name" | "employee_code">;

export function personLabel(p: PersonOption) {
  return p.employee_code ? `${p.full_name} (${p.employee_code})` : p.full_name;
}

export function departmentLabel(departments: Department[], id: string) {
  if (!id) return null;
  return departments.find((d) => d.id === id)?.name ?? null;
}

export function personOptionLabel(people: PersonOption[], id: string) {
  if (!id) return null;
  return people.find((p) => p.id === id)?.full_name
    ? personLabel(people.find((p) => p.id === id)!)
    : null;
}

/** Ensures currently selected people appear in dropdown options even if inactive. */
export function mergePersonOptions(
  people: PersonOption[],
  ...selected: (PersonOption | null | undefined)[]
): PersonOption[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  for (const person of selected) {
    if (person?.id && !byId.has(person.id)) {
      byId.set(person.id, person);
    }
  }
  return Array.from(byId.values()).sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );
}

export const formSelectTriggerClass =
  "w-full min-w-0 overflow-hidden *:data-[slot=select-value]:truncate";

export const formGridClass = "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function EmployeeTilePicker({
  employees,
  value,
  onChange,
}: {
  employees: { id: string; full_name: string; email: string; pm_role?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">No BD employees found. Set pm_role to &quot;bd&quot; on employee records.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {employees.map((emp) => {
        const selected = value === emp.id;
        return (
          <button
            key={emp.id}
            type="button"
            onClick={() => onChange(emp.id)}
            className={cn(
              "relative flex flex-col rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5",
              selected
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                : "border-border/60 bg-card/50 hover:border-primary/30"
            )}
          >
            {selected && (
              <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
            <p className="pr-8 font-semibold">{emp.full_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emp.email}</p>
            {emp.pm_role && (
              <span className="mt-2 inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                {emp.pm_role}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

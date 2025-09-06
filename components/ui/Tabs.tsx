"use client";

type TabItem = {
  key: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function Tabs({ items, activeKey, onChange }: TabsProps) {
  return (
    <div className="w-full">
      <div className="flex border-b border-[var(--app-card-border)] mb-3">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 ${
                isActive
                  ? "border-[var(--app-accent)] text-[var(--app-foreground)]"
                  : "border-transparent text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]"
              }`}
              onClick={() => onChange(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}



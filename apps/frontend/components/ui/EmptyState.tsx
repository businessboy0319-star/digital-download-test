import Button from "./Button";

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white p-6 shadow-none transition-shadow hover:shadow-[0_12px_30px_-18px_rgba(63,63,70,0.75)]">
      <div className="text-sm font-medium text-zinc-950">{title}</div>
      <div className="text-sm text-zinc-600">{description}</div>
      {action ? (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}


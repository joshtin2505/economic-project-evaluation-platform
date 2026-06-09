import RecurringForm from "@/components/recurring/recurring-form";
import {
  fetchIncomeSourceById,
  fetchRecurringExpenseById,
  type RecurringKind,
} from "@/lib/services/recurring";

interface Props {
  params: Promise<{ kind: RecurringKind; id: string }>;
}

export default async function EditRecurringPage({ params }: Props) {
  const { kind, id } = await params;
  const initialData =
    kind === "income"
      ? await fetchIncomeSourceById(id)
      : await fetchRecurringExpenseById(id);

  return <RecurringForm mode="edit" kind={kind} initialData={initialData} />;
}

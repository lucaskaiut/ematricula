import { notFound } from 'next/navigation';

import { Api } from '@/lib/api';
import { parseWeekdaysFromApi } from '@/lib/parse-class-group-weekdays';
import type { ClassGroupAttributes } from '@/types/api';

import { ClassGroupForm } from '../../_components/class-group-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClassGroupPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) notFound();

  let row: ClassGroupAttributes;
  try {
    const api = new Api(`/class-groups/${id}`);
    const response = await api.get<ClassGroupAttributes>();
    const data = response.data;
    if (!data) notFound();
    row = data;
  } catch {
    notFound();
  }

  return (
    <ClassGroupForm
      mode="edit"
      classGroupId={row.id}
      defaultValues={{
        name: row.name,
        modality_id: row.modality_id,
        teacher_person_id: row.teacher_person_id,
        max_capacity: row.max_capacity,
        weekdays: parseWeekdaysFromApi(row.weekdays),
        starts_at: row.starts_at ?? '',
        ends_at: row.ends_at ?? '',
        plan_ids: (row.plans ?? []).map((p) => p.id),
      }}
    />
  );
}

import { notFound } from 'next/navigation';

import { Api } from '@/lib/api';
import type { EnrollmentAttributes } from '@/types/api';

import { EnrollmentForm } from '../../_components/enrollment-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMatriculaPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) notFound();

  let enrollment: EnrollmentAttributes;
  try {
    const api = new Api(`/enrollments/${id}`);
    const response = await api.get<EnrollmentAttributes>();
    const data = response.data;
    if (!data) notFound();
    enrollment = data;
  } catch {
    notFound();
  }

  const sub = enrollment.active_subscription;

  return (
    <EnrollmentForm
      mode="edit"
      enrollmentId={enrollment.id}
      initialStatusFromApi={enrollment.status}
      defaultValues={{
        student_person_id: enrollment.student_person_id,
        class_group_id: enrollment.class_group_id,
        starts_on: enrollment.starts_on,
        ends_on: enrollment.ends_on,
        status: enrollment.status,
        plan_id: sub?.plan_id ?? 0,
        billing_starts_on: sub?.started_at?.slice(0, 10) ?? '',
      }}
      billing={
        sub
          ? {
              subscriptionId: sub.id,
              subscriptionStatus: sub.status,
            }
          : null
      }
    />
  );
}

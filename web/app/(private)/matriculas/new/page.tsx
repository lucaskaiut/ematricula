'use client';

import { useMemo } from 'react';

import { EnrollmentForm } from '../_components/enrollment-form';

export default function NovaMatriculaPage() {
  const startsOn = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  return (
    <EnrollmentForm
      mode="create"
      defaultValues={{
        student_person_id: 0,
        class_group_id: 0,
        starts_on: startsOn,
        ends_on: null,
        status: 'active',
        plan_id: 0,
        billing_starts_on: startsOn,
      }}
    />
  );
}

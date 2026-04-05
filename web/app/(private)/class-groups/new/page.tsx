import { ClassGroupForm } from '../_components/class-group-form';

export default function NewClassGroupPage() {
  return (
    <ClassGroupForm
      mode="create"
      defaultValues={{
        name: '',
        modality_id: 0,
        teacher_person_id: 0,
        max_capacity: null,
        weekdays: [],
        starts_at: '',
        ends_at: '',
        plan_ids: [],
      }}
    />
  );
}

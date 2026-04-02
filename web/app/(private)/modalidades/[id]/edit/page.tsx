import { notFound } from 'next/navigation';

import { Api } from '@/lib/api';
import type { ModalityAttributes } from '@/types/api';

import { ModalityForm } from '../../_components/modality-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditModalidadePage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) notFound();

  let modality: ModalityAttributes;
  try {
    const api = new Api(`/modalities/${id}`);
    const response = await api.get<ModalityAttributes>();
    const data = response.data;
    if (!data) notFound();
    modality = data;
  } catch {
    notFound();
  }

  return (
    <ModalityForm
      mode="edit"
      modalityId={modality.id}
      defaultValues={{
        name: modality.name,
        description: modality.description ?? '',
      }}
    />
  );
}

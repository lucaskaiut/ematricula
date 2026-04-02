import { ModalityForm } from '../_components/modality-form';

export default function NovaModalidadePage() {
  return (
    <ModalityForm mode="create" defaultValues={{ name: '', description: '' }} />
  );
}

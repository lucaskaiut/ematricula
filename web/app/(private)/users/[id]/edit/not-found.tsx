import { NotFoundView } from '@/components/not-found-view';

export default function EditUserNotFound() {
  return (
    <NotFoundView
      title="Usuário não encontrado"
      description="Não encontramos este usuário. Ele pode ter sido removido ou o link está incorreto."
      primaryAction={{ href: '/users', label: 'Lista de usuários' }}
      secondaryAction={{ href: '/', label: 'Ir ao início' }}
    />
  );
}

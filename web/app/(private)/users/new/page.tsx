import { UserForm } from '../_components/user-form';

export default function NewUserPage() {
  return (
    <UserForm mode="create" defaultValues={{ name: '', email: '', password: '' }} />
  );
}

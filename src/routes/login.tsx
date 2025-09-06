import { Title } from '@solidjs/meta';
import LoginForm from '~/components/Auth/LoginForm';

export default function Login() {
  return (
    <>
      <Title>Login - Your App Name</Title>
      <div>
        <div>
          <h1>Sign in to your account</h1>
        </div>
        <div>
          <LoginForm />
        </div>
      </div>
    </>
  );
}

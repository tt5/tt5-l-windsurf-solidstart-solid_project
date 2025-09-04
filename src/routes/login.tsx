import { Title } from '@solidjs/meta';
import LoginForm from '~/components/Auth/LoginForm';

export default function Login() {
  return (
    <>
      <Title>Login - Your App Name</Title>
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 class="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h1>
        </div>
        
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <LoginForm />
        </div>
      </div>
    </>
  );
}

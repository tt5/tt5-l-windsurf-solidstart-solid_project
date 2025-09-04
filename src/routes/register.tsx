import { Title } from '@solidjs/meta';
import RegisterForm from '~/components/Auth/RegisterForm';

export default function Register() {
  return (
    <>
      <Title>Register - Your App Name</Title>
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 class="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h1>
        </div>
        
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <RegisterForm />
        </div>
      </div>
    </>
  );
}

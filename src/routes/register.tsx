import { Title } from '@solidjs/meta';
import RegisterForm from '~/components/Auth/RegisterForm';

export default function Register() {
  return (
    <>
      <Title>Register - Your App Name</Title>
      <div>
        <div>
          <h1>Create your account</h1>
        </div>
        <div>
          <RegisterForm />
        </div>
      </div>
    </>
  );
}

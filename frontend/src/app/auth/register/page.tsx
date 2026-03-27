import RegisterForm from '@/components/RegisterForm';

export const metadata = {
  title: 'Sign Up - BlogHub',
  description: 'Create a BlogHub account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center">
      <RegisterForm />
    </div>
  );
}

import LoginForm from '@/components/LoginForm';

export const metadata = {
  title: 'Sign In - BlogHub',
  description: 'Sign in to your BlogHub account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center">
      <LoginForm />
    </div>
  );
}

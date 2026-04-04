import LoginForm from '@/components/LoginForm';
import Image from 'next/image';

export const metadata = {
  title: 'Sign In - BlogHub',
  description: 'Sign in to your BlogHub account',
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(340,50%,95%) 0%, hsl(340,45%,90%) 50%, hsl(340,40%,86%) 100%)' }}>

      <LoginForm />
    </div>
  );
}



// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';
// import Link from 'next/link';
// import Image from 'next/image';

 
// export default function LoginForm() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const { login } = useAuth();
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       await login(email, password);
//       router.push('/dashboard');
//     } catch (err: any) {
//       setError(err.message || 'Failed to login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//    <div className="relative w-full max-w-md mx-auto">

//       {/* CAT (TOP LEFT BEHIND FORM) */}
//       <Image
//         src="/uploads/cat.svg"
//         alt="Cat"
//         width={180}
//         height={180}
//         className="absolute -top-20 -left-16 z-0 hidden md:block rotate-[-10deg] drop-shadow-xl"
//       />

//       {/* FLOWER (BOTTOM RIGHT BEHIND FORM) */}
//       <Image
//         src="/uploads/flower.svg"
//         alt="Flower"
//         width={180}
//         height={180}
//         className="absolute -bottom-10 -right-24 z-0 hidden md:block rotate-[10deg] drop-shadow-xl"
//       />

//       {/* 🧾 FORM CARD */}
//       <div className="mt-20 relative z-10 bg-white rounded-2xl shadow-2xl p-8">

//         <h2 className="text-2xl font-bold mb-6 text-center">
//           Sign In
//         </h2>

//         {/* ERROR */}
//         {error && (
//           <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* FORM */}
//         <form onSubmit={handleSubmit} className="space-y-4">

//           {/* EMAIL */}
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium mb-2">
//               Email
//             </label>
//             <input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
//               placeholder="your@email.com"
//               required
//             />
//           </div>

//           {/* PASSWORD */}
//           <div>
//             <div className="flex items-center justify-between mb-2">
//               <label htmlFor="password" className="block text-sm font-medium">
//                 Password
//               </label>

//               <Link
//                 href="/auth/forgot-password"
//                 className="text-xs text-primary hover:text-primary-dark"
//               >
//                 Forgot password?
//               </Link>
//             </div>

//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
//               placeholder="••••••••"
//               required
//             />
//           </div>

//           {/* BUTTON */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-primary-light text-white py-2 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400"
//           >
//             {loading ? 'Signing in...' : 'Sign In'}
//           </button>
//         </form>

//         {/* FOOTER */}
//         <p className="text-center text-sm text-gray-600 mt-6">
//           Don't have an account?{' '}
//           <Link href="/auth/register" className="text-primary hover:text-primary">
//             Sign up
//           </Link>
//         </p>

//       </div>
//     </div>
//   );
// }
// import RegisterForm from '@/components/RegisterForm';
// import Image from 'next/image';

// export const metadata = {
//   title: 'Sign Up - BlogHub',
//   description: 'Create a BlogHub account',
// };

// export default function RegisterPage() {
//   return (
//     <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(340,50%,95%) 0%, hsl(340,45%,90%) 50%, hsl(340,40%,86%) 100%)' }}>

//       {/* Cat — bottom-right corner */}
//       <div className="pointer-events-none select-none absolute -bottom-6 -right-8 opacity-70">
//         <Image src="/cat.png" alt="" width={200} height={200} priority />
//       </div>

//       {/* Flower — top-left corner */}
//       <div className="pointer-events-none select-none absolute -top-8 -left-6 opacity-75">
//         <Image src="/flower.png" alt="" width={190} height={190} priority />
//       </div>

//       <RegisterForm />
//     </div>
//   );
// }





// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';
// import Link from 'next/link';
// import Image from 'next/image';
// // import RegisterForm from '@/components/RegisterForm';

// export default function RegisterForm() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const { register } = useAuth(); // make sure this exists
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       await register(name, email, password);
//       router.push('/dashboard');
//     } catch (err: any) {
//       setError(err.message || 'Failed to register');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="relative w-full max-w-md mx-auto">

//       {/* CAT */}
//       <Image
//         src="/uploads/cat.svg"
//         alt="Cat"
//         width={180}
//         height={180}
//         className="absolute -top-20 -left-16 z-0 hidden md:block rotate-[-10deg] drop-shadow-xl"
//       />

//       {/* FLOWER */}
//       <Image
//         src="/uploads/flower.svg"
//         alt="Flower"
//         width={180}
//         height={180}
//         className="absolute -bottom-10 -right-24 z-0 hidden md:block rotate-[10deg] drop-shadow-xl"
//       />

//       {/* FORM CARD */}
//       <div className="mt-20 relative z-10 bg-white rounded-2xl shadow-2xl p-8">

//         <h2 className="text-2xl font-bold mb-6 text-center">
//           Sign Up
//         </h2>

//         {/* ERROR */}
//         {error && (
//           <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* FORM */}
//         <form onSubmit={handleSubmit} className="space-y-4">

//           {/* NAME */}
//           <div>
//             <label className="block text-sm font-medium mb-2">
//               Name
//             </label>
//             <input
//               type="text"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
//               placeholder="Your name"
//               required
//             />
//           </div>

//           {/* EMAIL */}
//           <div>
//             <label className="block text-sm font-medium mb-2">
//               Email
//             </label>
//             <input
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
//             <label className="block text-sm font-medium mb-2">
//               Password
//             </label>
//             <input
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
//             {loading ? 'Creating account...' : 'Sign Up'}
//           </button>
//         </form>

//         {/* FOOTER */}
//         <p className="text-center text-sm text-gray-600 mt-6">
//           Already have an account?{' '}
//           <Link href="/auth/login" className="text-primary hover:text-primary">
//             Sign in
//           </Link>
//         </p>

//       </div>
//     </div>
//   );
// }





import RegisterForm from '@/components/RegisterForm';
import Image from 'next/image';

export const metadata = {
  title: 'Sign Up - BlogHub',
  description: 'Create a BlogHub account',
};

export default function RegisterPage() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, hsl(340,50%,95%) 0%, hsl(340,45%,90%) 50%, hsl(340,40%,86%) 100%)',
      }}
    >


      <RegisterForm />
    </div>
  );
}
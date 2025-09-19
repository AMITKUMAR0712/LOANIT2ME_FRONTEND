import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRegAddressCard } from 'react-icons/fa';
// import { register } from '@/lib/api';
import axios from 'axios';


export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/register`, form);
      // await register(form)
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-b from-nyanza-900 to-celadon-900 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full max-w-md border border-celadon-600 transition-transform hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-col items-center mb-6">
          <FaRegAddressCard className="text-4xl text-fern_green-400 drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-fern_green-300 mt-2 text-center leading-tight drop-shadow">
            Create Your LoanIt2Me Account
          </h2>
          <p className="text-sm text-fern_green-400 mt-1">Track your loans, payments & updates</p>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 text-red-200 border border-red-600 text-sm px-3 py-2 rounded mb-4 backdrop-blur-sm">
            {error}
          </div>
        )}

        <label htmlFor="name" className="block text-sm font-medium text-fern_green-300 mb-1 drop-shadow">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full mb-3 px-4 py-2 border border-celadon-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fern_green-500 transition bg-gradient-to-r from-nyanza-800 to-celadon-800 text-fern_green-200 placeholder-fern_green-400"
          required
        />

        <label htmlFor="email" className="block text-sm font-medium text-fern_green-300 mb-1 drop-shadow">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="user@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full mb-3 px-4 py-2 border border-celadon-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fern_green-500 transition bg-gradient-to-r from-nyanza-800 to-celadon-800 text-fern_green-200 placeholder-fern_green-400"
          required
        />

        <label htmlFor="phone" className="block text-sm font-medium text-fern_green-300 mb-1 drop-shadow">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="+91 9876543210"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          className="w-full mb-3 px-4 py-2 border border-celadon-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fern_green-500 transition bg-gradient-to-r from-nyanza-800 to-celadon-800 text-fern_green-200 placeholder-fern_green-400"
          required
        />

        <label htmlFor="password" className="block text-sm font-medium text-fern_green-300 mb-1 drop-shadow">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full mb-6 px-4 py-2 border border-celadon-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fern_green-500 transition bg-gradient-to-r from-nyanza-800 to-celadon-800 text-fern_green-200 placeholder-fern_green-400"
          required
        />

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-fern_green-500 to-mantis-500 hover:from-fern_green-400 hover:to-mantis-400 text-white py-2 rounded-md font-semibold transition-all duration-300 focus:ring-2 focus:ring-fern_green-500 focus:outline-none shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Register
        </button>

        <p className="text-center text-sm text-fern_green-300 mt-4">
          You have an already account?{" "}
          <Link
            to="/login"
            className="text-fern_green-400 font-medium hover:text-fern_green-300 hover:underline transition-colors"
          >
            Login
          </Link>
        </p>

      </form>
    </div>
  );
}

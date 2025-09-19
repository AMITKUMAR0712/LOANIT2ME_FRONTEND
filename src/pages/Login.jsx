import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaMoneyCheckAlt } from 'react-icons/fa';
import { login } from '../lib/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Show success message if redirected from registration
  useEffect(() => {
    if (location.state?.message) {
      setError(''); // Clear any existing error
      // You could show a success message here instead
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await login(form.email, form.password);

      // Store the token in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userRole', response.user.role);

      // Redirect based on user role
      if (response.user.role === 'LENDER') {
        navigate('/lender-dashboard');
      } else if (response.user.role === 'BORROWER') {
        navigate('/borrower-dashboard');
      } else {
        // For users with BOTH role, redirect to lender dashboard by default
        navigate('/lender-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-b from-nyanza-900 to-celadon-900 backdrop-blur-sm p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-celadon-600 transition-transform hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-col items-center mb-6">
          <FaMoneyCheckAlt className="text-4xl text-fern_green-400 mb-2 drop-shadow-lg" />
          <h2 className="text-2xl sm:text-3xl font-bold text-fern_green-300 text-center leading-tight drop-shadow">
            Login to LoanIt2Me
          </h2>
          <p className="text-sm text-fern_green-400 mt-1">Manage your personal loan easily</p>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 text-red-200 border border-red-600 text-sm px-3 py-2 rounded mb-4 backdrop-blur-sm">
            {error}
          </div>
        )}

        <label htmlFor="email" className="block text-sm font-medium text-fern_green-300 mb-1 drop-shadow">
          Email
        </label>
        <input
          id="email"
          type="text"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full mb-4 px-4 py-2 border border-celadon-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fern_green-500 focus:border-fern_green-500 transition bg-gradient-to-r from-nyanza-800 to-celadon-800 text-fern_green-200 placeholder-fern_green-400"
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
          className="w-full mb-6 px-4 py-2 border border-celadon-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fern_green-500 focus:border-fern_green-500 transition bg-gradient-to-r from-nyanza-800 to-celadon-800 text-fern_green-200 placeholder-fern_green-400"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-fern_green-500 to-mantis-500 hover:from-fern_green-400 hover:to-mantis-400 text-white font-semibold py-2 rounded-md transition-all duration-300 focus:ring-2 focus:ring-fern_green-500 focus:outline-none disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-fern_green-400 font-medium hover:text-fern_green-300 hover:underline transition-colors"
          >
            Sign up
          </Link>
        </p>

      </form>
    </div>
  );
}

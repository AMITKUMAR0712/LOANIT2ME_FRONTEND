import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInviteDetails, acceptInvite, register } from "../lib/api";
import { ShieldCheck, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { me } from "../lib/api";

export default function ReferralPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const userData = await me();
        if (userData?.userId) {
          // console.log("User is already logged in:", userData);

          setUser(userData);
        }
      } catch (error) {
        // setError("Failed to check authentication");
        console.error('Auth check failed:', error);
      }
    };

    // Fetch invite details
    const fetchInvite = async () => {
      try {
        const data = await getInviteDetails(token);
        setInvite(data);
      } catch (error) {
        setError("Invalid or expired invite link");
        console.error('Error fetching invite details:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchInvite();
  }, [token]);

  const handleInputChange = (e) => {
    // console.log("Input changed:", e.target.name, e.target.value);
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccept = async (formData) => {
    // console.log("Handling accept with formData:", formData);

    setSubmitting(true);
    setError("");
    // console.log("token and formdata", token, formData);

    try {
      const res = await acceptInvite(token, formData);

      // If successful, redirect to appropriate dashboard
      if (res.success) {
        if (user) {
          // If already logged in, just redirect to dashboard
          navigate("/borrower-dashboard");
        } else {
          // If new user, redirect to login with success message
          navigate("/login", {
            state: { message: "Account created! Please log in to access your dashboard." }
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to accept invite");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission for new users
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // await handleAccept(formData);
    setSubmitting(true);
    setError("");

    try {
      await register(
        formData.fullName,
        formData.email,
        formData.phoneNumber,
        formData.password,
        token
      );

      // Redirect to login with success message
      navigate("/login", {
        state: { message: "Registration successful! Please log in." }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  // If already logged in as a lender, show error
  if (user && user.role === "LENDER") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cannot Accept Invite</h1>
            <p className="text-gray-600 mb-6">You are logged in as a lender. Please use a different account to accept this borrower invite.</p>
            <button
              onClick={() => navigate("/lender-dashboard")}
              className="bg-mantis-600 text-white px-6 py-2 rounded hover:bg-mantis-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mantis-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invite details...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-mantis-600 text-white px-6 py-2 rounded hover:bg-mantis-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is already logged in as a borrower, show connect button
  if (user && user.role === "BORROWER" && invite) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 text-mantis-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome {user.fullName}</h1>
            <p className="text-gray-600 mb-6 ">
              You've been invited by <span className="font-semibold">{invite.lenderName}</span> to connect on LoanIt2Me.
            </p>

            {/* Loan terms preview */}
            {invite.loanRules && (
              <div className="bg-mantis-50 border border-mantis-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-mantis-900 mb-2">Loan Terms</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-mantis-800">
                  <div>
                    <span className="font-medium">Max Amount:</span> ${invite.loanRules.maxLoanAmount}
                  </div>
                  <div>
                    <span className="font-medium">Allow Multiple Loans:</span> {invite.loanRules.allowMultipleLoans ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-medium">Payback Days:</span> {invite.loanRules.maxPaybackDays}
                  </div>
                  <div>
                    <span className="font-medium">Fee:</span> ${invite.loanRules.feePer10Short}/$10
                  </div>
                  <div>
                    <span className="font-medium">Loan Multiple:</span> {invite.loanRules.loanMultiple}
                  </div>
                  <div>
                    <span className="font-medium">Fee per $10 (Long):</span> ${invite.loanRules.feePer10Long}/$10
                  </div>

                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm mb-4">{error}</div>
            )}

            <button
              onClick={() => handleAccept({ email: user.email })}
              disabled={submitting}
              className="bg-mantis-600 text-white px-6 py-2 rounded hover:bg-mantis-700 disabled:opacity-50"
            >
              {submitting ? "Connecting..." : `Connect with ${invite.lenderName}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default view for non-logged in users - show signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-fern_green-400 mx-auto mb-4 drop-shadow-lg" />
          <h2 className="text-3xl font-bold text-fern_green-300 drop-shadow">Join LoanIt2Me</h2>
          {invite && (
            <p className="mt-2 text-sm text-fern_green-400">
              You've been invited by <span className="font-semibold text-fern_green-300">{invite.lenderName}</span>
            </p>
          )}
        </div>

        {/* Lender Terms Preview */}
        {invite && invite.loanRules && (
          <div className="bg-gradient-to-r from-celadon-900 to-fern_green-900 border border-celadon-600 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="font-semibold text-fern_green-300 mb-2 drop-shadow">Loan Terms</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-fern_green-400">
              <div>
                <span className="font-medium text-fern_green-300">Max Amount:</span> ${invite.loanRules.maxLoanAmount}
              </div>
              <div>
                <span className="font-medium text-fern_green-300">Payback Days:</span> {invite.loanRules.maxPaybackDays}
              </div>
              <div>
                <span className="font-medium text-fern_green-300">Fee:</span> ${invite.loanRules.feePer10Short}/$10
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-fern_green-300 focus:border-fern_green-300 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-fern_green-300 focus:border-fern_green-300 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number (Optional)
              </label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-fern_green-300 focus:border-fern_green-300 focus:z-10 sm:text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-fern_green-300 focus:border-fern_green-300 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-fern_green-300 focus:border-fern_green-300 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-fern_green-500 to-mantis-500 hover:from-fern_green-400 hover:to-mantis-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fern_green-500 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-fern_green-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-fern_green-300 hover:text-fern_green-200 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
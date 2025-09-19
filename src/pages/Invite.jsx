import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { register } from "../lib/api";

export default function Invite() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [inviteData, setInviteData] = useState(null);
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
        fetchInviteDetails();
    }, [token]);

    const fetchInviteDetails = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/public/invite/${token}`);
            if (!response.ok) {
                throw new Error("Invalid invite link");
            }
            const data = await response.json();
            setInviteData(data);
        } catch (err) {
            setError("Invalid or expired invite link");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fern_green-400 mx-auto"></div>
                    <p className="mt-4 text-fern_green-300 drop-shadow">Loading invite details...</p>
                </div>
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900 flex items-center justify-center">
                <div className="bg-gradient-to-b from-nyanza-900 to-celadon-900 backdrop-blur-sm p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-celadon-600">
                    <div className="text-center">
                        <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4 drop-shadow-lg" />
                        <h1 className="text-2xl font-bold text-fern_green-300 mb-2 drop-shadow">Invalid Invite</h1>
                        <p className="text-fern_green-400 mb-6">{error}</p>
                        <button
                            onClick={() => navigate("/")}
                            className="bg-gradient-to-r from-fern_green-500 to-mantis-500 text-white px-6 py-2 rounded hover:from-fern_green-400 hover:to-mantis-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <ShieldCheck className="w-16 h-16 text-fern_green-400 mx-auto mb-4 drop-shadow-lg" />
                    <h2 className="text-3xl font-bold text-fern_green-300 drop-shadow">Join LoanIt2Me</h2>
                    <p className="mt-2 text-sm text-fern_green-400">
                        You've been invited by <span className="font-semibold text-fern_green-300">{inviteData?.lender?.fullName}</span>
                    </p>
                </div>

                {/* Lender Terms Preview */}
                {inviteData?.lenderTerm && (
                    <div className="bg-gradient-to-r from-celadon-900 to-fern_green-900 border border-celadon-600 rounded-lg p-4 backdrop-blur-sm">
                        <h3 className="font-semibold text-fern_green-300 mb-2 drop-shadow">Lender Terms</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-fern_green-400">
                            <div>
                                <span className="font-medium text-fern_green-300">Max Amount:</span> ${inviteData.lenderTerm.maxLoanAmount}
                            </div>
                            <div>
                                <span className="font-medium text-fern_green-300">Payback Days:</span> {inviteData.lenderTerm.maxPaybackDays}
                            </div>
                            <div>
                                <span className="font-medium text-fern_green-300">Fee (≤7 days):</span> ${inviteData.lenderTerm.feePer10Short}/$10
                            </div>
                            <div>
                                <span className="font-medium text-fern_green-300">Fee (&gt;7 days):</span> ${inviteData.lenderTerm.feePer10Long}/$10
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6 bg-gradient-to-b from-nyanza-900 to-celadon-900 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-celadon-600" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-fern_green-300 drop-shadow">
                                Full Name
                            </label>
                            <div className="mt-1 relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fern_green-500 w-5 h-5" />
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="pl-10 appearance-none relative block w-full px-3 py-2 border border-celadon-600 placeholder-fern_green-400 text-fern_green-200 rounded-md focus:outline-none focus:ring-fern_green-500 focus:border-fern_green-500 focus:z-10 sm:text-sm bg-gradient-to-r from-nyanza-800 to-celadon-800"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-fern_green-300 drop-shadow">
                                Email Address
                            </label>
                            <div className="mt-1 relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fern_green-500 w-5 h-5" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="pl-10 appearance-none relative block w-full px-3 py-2 border border-celadon-600 placeholder-fern_green-400 text-fern_green-200 rounded-md focus:outline-none focus:ring-fern_green-500 focus:border-fern_green-500 focus:z-10 sm:text-sm bg-gradient-to-r from-nyanza-800 to-celadon-800"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-fern_green-300 drop-shadow">
                                Phone Number (Optional)
                            </label>
                            <div className="mt-1 relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fern_green-500 w-5 h-5" />
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="pl-10 appearance-none relative block w-full px-3 py-2 border border-celadon-600 placeholder-fern_green-400 text-fern_green-200 rounded-md focus:outline-none focus:ring-fern_green-500 focus:border-fern_green-500 focus:z-10 sm:text-sm bg-gradient-to-r from-nyanza-800 to-celadon-800"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-fern_green-300 drop-shadow">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fern_green-500 w-5 h-5" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border border-celadon-600 placeholder-fern_green-400 text-fern_green-200 rounded-md focus:outline-none focus:ring-fern_green-500 focus:border-fern_green-500 focus:z-10 sm:text-sm bg-gradient-to-r from-nyanza-800 to-celadon-800"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fern_green-500 hover:text-fern_green-400"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-fern_green-300 drop-shadow">
                                Confirm Password
                            </label>
                            <div className="mt-1 relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fern_green-500 w-5 h-5" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border border-celadon-600 placeholder-fern_green-400 text-fern_green-200 rounded-md focus:outline-none focus:ring-fern_green-500 focus:border-fern_green-500 focus:z-10 sm:text-sm bg-gradient-to-r from-nyanza-800 to-celadon-800"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fern_green-500 hover:text-fern_green-400"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-gradient-to-r from-red-900 to-red-800 text-red-200 border border-red-600 text-sm text-center px-3 py-2 rounded backdrop-blur-sm">{error}</div>
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

import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { createLenderTerm } from "../lib/api";

export default function CreateTermModal({ isOpen, onClose, onTermCreated }) {
    const [formData, setFormData] = useState({
        maxLoanAmount: "",
        loanMultiple: "10",
        maxPaybackDays: "",
        feePer10Short: "",
        feePer10Long: "",
        allowMultipleLoans: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await createLenderTerm(formData);
            setSuccess(true);
            // Generate full URL for the invite link
            const inviteUrl = `${window.location.origin}/invite/${response.lenderTerm.inviteToken}`;
            setInviteLink(inviteUrl);
            onTermCreated(response.lenderTerm);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create lender term");
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create Loan Terms</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Loan Amount ($)
                            </label>
                            <input
                                type="number"
                                name="maxLoanAmount"
                                value={formData.maxLoanAmount}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="200.00"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Loan Multiple
                            </label>
                            <input
                                type="number"
                                name="loanMultiple"
                                value={formData.loanMultiple}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="10"
                                step="0.01"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Loans must be multiples of this amount
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Payback Days
                            </label>
                            <input
                                type="number"
                                name="maxPaybackDays"
                                value={formData.maxPaybackDays}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="14"
                                min="1"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fee per $10 (≤7 days)
                                </label>
                                <input
                                    type="number"
                                    name="feePer10Short"
                                    value={formData.feePer10Short}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="1.00"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fee per $10 (&gt 7 days)
                                </label>
                                <input
                                    type="number"
                                    name="feePer10Long"
                                    value={formData.feePer10Long}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="2.00"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="allowMultipleLoans"
                                checked={formData.allowMultipleLoans}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Allow multiple active loans
                            </label>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Creating..." : "Create Terms"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center">
                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-green-800">
                                Loan Terms Created!
                            </h3>
                            <p className="text-gray-600">
                                Share this invite link with borrowers:
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="flex-1 bg-transparent text-sm text-gray-600 mr-2"
                                />
                                <button
                                    onClick={copyInviteLink}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Copy link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateLenderTerm } from "../lib/api";

export default function EditTermModal({ isOpen, onClose, onTermUpdated, term }) {
    const [formData, setFormData] = useState({
        maxLoanAmount: "",
        loanMultiple: "",
        maxPaybackDays: "",
        feePer10Short: "",
        feePer10Long: "",
        allowMultipleLoans: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (term) {
            setFormData({
                maxLoanAmount: term.maxLoanAmount.toString(),
                loanMultiple: term.loanMultiple.toString(),
                maxPaybackDays: term.maxPaybackDays.toString(),
                feePer10Short: term.feePer10Short.toString(),
                feePer10Long: term.feePer10Long.toString(),
                allowMultipleLoans: term.allowMultipleLoans
            });
        }
    }, [term]);

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
            const response = await updateLenderTerm(term.id, formData);
            setSuccess(true);
            onTermUpdated(response.lenderTerm);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update lender term");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Edit Loan Terms</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="text-center py-4">
                        <div className="mb-4 text-green-600 font-semibold">
                            Loan terms updated successfully!
                        </div>
                    </div>
                ) : (
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
                                placeholder="30"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fee Per $10 (Short Term)
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
                                    Fee Per $10 (Long Term)
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
                                id="allowMultipleLoans"
                                name="allowMultipleLoans"
                                checked={formData.allowMultipleLoans}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="allowMultipleLoans" className="ml-2 block text-sm text-gray-700">
                                Allow borrowers to have multiple active loans
                            </label>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Update Terms"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
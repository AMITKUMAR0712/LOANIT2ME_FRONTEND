import { Clock } from 'lucide-react';
import React, { useState } from 'react'
import BorrowerLoanDetailsModal from '../BorrowerLoanDetailsModal';

// Pending Loans Section Component
export function PendingLoansSection({ loans, onNavigateToLenders }) {
    const [selectedLoan, setSelectedLoan] = useState(null);

    const getTimeSinceRequest = (dateString) => {
        const now = new Date();
        const requestDate = new Date(dateString);
        const diffInHours = Math.floor((now - requestDate) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-fern_green-500 border-b border-celadon-300 pb-2">
                    Pending Loan Requests
                </h2>
                <div className="flex items-center bg-celadon-700 bg-opacity-10 px-4 py-2 rounded-lg">
                    <Clock className="w-5 h-5 mr-2 text-mantis-400" />
                    <span className="text-fern_green-500 font-medium">{loans.length} pending request{loans.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {loans.length ? (
                <div className="space-y-4">
                    {loans.map(loan => (
                        <div key={loan.id} className="bg-white p-6 rounded-xl shadow-md border border-celadon-200 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-mantis-400 bg-opacity-10 rounded-full flex items-center justify-center w-12 h-12">
                                        <span className="text-white text-md">{loan.lender.fullName.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-fern_green-500 text-lg">
                                            Loan Request to {loan.lender.fullName}
                                        </h3>
                                        <p className="text-sm text-fern_green-400">{loan.lender.email}</p>
                                        <p className="text-xs text-mantis-400 mt-1">
                                            Requested {getTimeSinceRequest(loan.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-mantis-900 text-mantis-400 px-3 py-1 rounded-full text-xs font-medium border border-mantis-400">
                                        PENDING APPROVAL
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-nyanza-900 p-4 rounded-lg mb-4">
                                <div>
                                    <p className="text-sm text-fern_green-400">Requested Amount</p>
                                    <p className="font-semibold text-fern_green-500 text-lg">${loan.amount.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-fern_green-400">Expected Total</p>
                                    <p className="font-semibold text-fern_green-500 text-lg">${loan.totalPayable.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-fern_green-400">Payback Date</p>
                                    <p className="font-semibold text-fern_green-500">{new Date(loan.paybackDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-fern_green-400">Request Date</p>
                                    <p className="font-semibold text-fern_green-500">{new Date(loan.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {loan.lenderTerm && (
                                <div className="bg-celadon-700 bg-opacity-10 p-4 rounded-lg mb-4">
                                    <h4 className="font-medium text-fern_green-500 mb-2">Applied Terms:</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <span className="text-fern_green-400">Max Amount: </span>
                                            <span className="font-semibold text-fern_green-500">${loan.lenderTerm.maxLoanAmount}</span>
                                        </div>
                                        <div>
                                            <span className="text-fern_green-400">Max Days: </span>
                                            <span className="font-semibold text-fern_green-500">{loan.lenderTerm.maxPaybackDays}</span>
                                        </div>
                                        <div>
                                            <span className="text-fern_green-400">Fee Rate: </span>
                                            <span className="font-semibold text-fern_green-500">${loan.lenderTerm.feePer10Short}/$10</span>
                                        </div>
                                        <div>
                                            <span className="text-fern_green-400">Multiple: </span>
                                            <span className="font-semibold text-fern_green-500">{loan.lenderTerm.loanMultiple}x</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <div className="text-sm text-fern_green-400">
                                    <p>Waiting for lender approval...</p>
                                </div>
                                <button
                                    onClick={() => setSelectedLoan(loan)}
                                    className="bg-celadon-800 text-fern_green-500 px-4 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="bg-celadon-700 bg-opacity-10 p-8 rounded-xl border border-celadon-200">
                        <Clock className="w-16 h-16 text-celadon-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-fern_green-500 mb-2">No Pending Requests</h3>
                        <p className="text-fern_green-400 mb-4">You don't have any pending loan requests at the moment.</p>
                        <button
                            onClick={() => onNavigateToLenders()}
                            className="bg-fern_green-500 text-white px-6 py-3 rounded-lg hover:bg-fern_green-400 transition-all duration-200 font-medium"
                        >
                            Request a New Loan
                        </button>
                    </div>
                </div>
            )}

            {/* Loan Details Modal */}
            {selectedLoan && (
                <BorrowerLoanDetailsModal
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                />
            )}
        </div>
    );
}
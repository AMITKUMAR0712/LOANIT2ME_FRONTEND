import React, { useState, useEffect } from 'react';
import { fetchAdminLoans, updateAdminLoan } from '../../lib/api';

const LoanHealthColors = {
  GOOD: "bg-celadon-900 text-fern_green-500 border border-celadon-400",
  BEHIND: "bg-mantis-900 text-mantis-400 border border-mantis-400",
  FAILING: "bg-celadon-light-100 bg-opacity-10 text-celadon-light-300 border border-celadon-light-200",
  DEFAULTED: "bg-fern_green-100 bg-opacity-10 text-fern_green-300 border border-fern_green-200",
};

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { loans } = await fetchAdminLoans();
        setLoans(loans);
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAdminLoan(id, { status });
      setLoans(loans.map((loan) => (loan.id === id ? { ...loan, status } : loan)));
    } catch (error) {
      console.error('Error updating loan:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Loan Management</h2>
      {loans.length ? (
        loans.map((loan) => (
          <div key={loan.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-semibold text-fern_green-500 text-lg">Loan: {loan.borrower.fullName} → {loan.lender.fullName}</h3>
                <p className="text-sm text-fern_green-400">Borrower: {loan.borrower.email} | Lender: {loan.lender.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${LoanHealthColors[loan.health]}`}>
                {loan.health}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
              <div>
                <p className="text-sm text-fern_green-400">Amount</p>
                <p className="font-semibold text-text-mantis-100">${loan.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Status</p>
                <p className="font-semibold text-text-mantis-100">{loan.status}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Health</p>
                <p className="font-semibold text-text-mantis-100">{loan.health}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Due Date</p>
                <p className="font-semibold text-text-mantis-100">{new Date(loan.paybackDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                onChange={(e) => handleUpdateStatus(loan.id, e.target.value)}
                value={loan.status}
                className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium border-none outline-none"
              >
                <option value="PENDING">Pending</option>
                <option value="FUNDED">Funded</option>
                <option value="DENIED">Denied</option>
                <option value="IN_PROCESS">In Process</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        ))
      ) : (
        <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No loans found.</p>
      )}
    </div>
  );
};

export default LoanManagement;
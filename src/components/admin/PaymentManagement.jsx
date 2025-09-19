import React, { useState, useEffect } from 'react';
import { fetchAdminPayments, confirmAdminPayment } from '../../lib/api';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { payments } = await fetchAdminPayments();
        // console.log(payments);

        setPayments(payments);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleConfirm = async (id) => {
    try {
      await confirmAdminPayment(id);
      setPayments(payments.map((payment) => (payment.id === id ? { ...payment, confirmed: true } : payment)));
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Payment Management</h2>
      {payments.length ? (
        payments.map((payment) => (
          <div key={payment.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div>
                {/* <h3 className="font-semibold text-fern_green-500 text-lg">Payment for Loan #{payment.loanId}</h3> */}
                <h3 className="font-semibold text-fern_green-500 text-lg">Payment from {payment.loan.lender.fullName} to {payment.loan.borrower.fullName}</h3>
                <p className="text-sm text-fern_green-400">Payment Method: {payment.method}</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                payment.confirmed ? "bg-celadon-900 text-fern_green-500 border border-celadon-400" :
                "bg-mantis-900 text-mantis-400 border border-mantis-400"
              }`}>
                {payment.confirmed ? 'Confirmed' : 'Pending'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
              {/* <div>
                <p className="text-sm text-fern_green-400">Loan ID</p>
                <p className="font-semibold text-text-mantis-100">{payment.loanId}</p>
              </div> */}
              <div>
                <p className="text-sm text-fern_green-400">Payment Date</p>
                <p className="font-semibold text-text-mantis-100">{payment.paymentDate.split('T')[0] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Amount</p>
                <p className="font-semibold text-text-mantis-100">${payment.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Method</p>
                <p className="font-semibold text-text-mantis-100">{payment.method}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Status</p>
                <p className="font-semibold text-text-mantis-100">{payment.confirmed ? 'Confirmed' : 'Pending'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {!payment.confirmed && (
                <button
                  onClick={() => handleConfirm(payment.id)}
                  className="bg-fern_green-300 text-white px-5 py-2 rounded-lg hover:bg-fern_green-400 transition-all duration-200 shadow-sm font-medium"
                >
                  Confirm Payment
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No payments found.</p>
      )}
    </div>
  );
};

export default PaymentManagement;
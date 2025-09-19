import React from "react";
import { motion } from "framer-motion";
import { X, CreditCard, CheckCircle } from "lucide-react";

const LenderLoanDetailsModal = ({ loan, lenderDetails, onClose }) => {
  if (!loan) return null;

  // Calculate payment progress
  const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => payment.confirmed && payment.payerRole === 'BORROWER' && payment.receiverRole === 'LENDER' ? sum + payment.amount : sum, 0) : 0;

  const remainingAmount = loan.totalPayable - totalPaid;
  const paymentProgress = (totalPaid / loan.totalPayable) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Modal Container with Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Loan Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Borrower Info */}
        <div className="space-y-3 text-gray-800 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">
            Borrower
          </h3>
          <p>
            <span className="font-medium text-gray-600">Name:</span>{" "}
            {loan.borrower?.fullName || "N/A"}
          </p>
          <p>
            <span className="font-medium text-gray-600">Email:</span>{" "}
            {loan.borrower?.email || "N/A"}
          </p>
          {loan.borrower?.phoneNumber && (
            <p>
              <span className="font-medium text-gray-600">Phone:</span>{" "}
              {loan.borrower.phoneNumber}
            </p>
          )}
        </div>

        {/* Lender Info */}
        <div className="space-y-3 text-gray-800 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">
            Lender
          </h3>
          <p>
            <span className="font-medium text-gray-600">Name:</span>{" "}
            {lenderDetails?.fullName || "N/A"}
          </p>
          <p>
            <span className="font-medium text-gray-600">Email:</span>{" "}
            {lenderDetails?.email || "N/A"}
          </p>
          {lenderDetails?.phoneNumber && (
            <p>
              <span className="font-medium text-gray-600">Phone:</span>{" "}
              {lenderDetails.phoneNumber}
            </p>
          )}
        </div>

        {/* Loan Info */}
        <div className="space-y-3 text-gray-800 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">
            Loan Info
          </h3>

          <p>
            <span className="font-medium text-gray-600">Fees:</span>{" "}
            <span className="text-purple-700 font-semibold">
              ${loan.feeAmount?.toFixed(2) || "0.00"}
            </span>
          </p>

          <p>
            <span className="font-medium text-gray-600">Amount:</span>{" "}
            <span className="text-green-700 font-semibold">
              ${loan.amount?.toFixed(2) || "0.00"}
            </span>
          </p>

          <p>
            <span className="font-medium text-gray-600">Total Payable:</span>{" "}
            <span className="text-yellow-700 font-semibold">
              ${loan.totalPayable?.toFixed(2) || "0.00"}
            </span>
          </p>

          <p>
            <span className="font-medium text-gray-600">Due Date:</span>{" "}
            {loan.paybackDate
              ? new Date(loan.paybackDate).toLocaleDateString()
              : "N/A"}
          </p>

          <p>
            <span className="font-medium text-gray-600">Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded-md text-sm font-semibold ${loan.status === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : loan.status === "FUNDED"
                  ? "bg-blue-100 text-blue-700"
                  : loan.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
            >
              {loan.status}
            </span>
          </p>

          <p>
            <span className="font-medium text-gray-600">Health:</span>{" "}
            <span
              className={`px-2 py-1 rounded-md text-sm font-semibold ${loan.health === "GOOD"
                ? "bg-green-100 text-green-700"
                : loan.health === "BEHIND"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
                }`}
            >
              {loan.health}
            </span>
          </p>
        </div>

        {/* Payment Progress */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 mb-3">
            Payment Progress
          </h3>
          <div className="bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Received: ${totalPaid.toFixed(2)}</span>
            <span>Outstanding: ${remainingAmount.toFixed(2)}</span>
          </div>
          <div className="text-center text-sm font-medium text-gray-700 mt-1">
            {paymentProgress.toFixed(1)}% Repaid
          </div>
        </div>

        {/* Payment History */}
        {loan.payments && loan.payments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 mb-3">
              Payment History
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {loan.payments.map((payment, index) => payment.payerRole == "BORROWER" && payment.receiverRole == "LENDER" ?
                <div key={payment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${payment.confirmed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {payment.confirmed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">${payment.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{payment.method}</p>
                    <p className={`text-xs ${payment.confirmed ? 'text-green-600' : 'text-yellow-600'}`}>
                      {payment.confirmed ? 'Confirmed' : 'Pending'}
                    </p>
                  </div>
                </div>
                : "")}
            </div>
          </div>
        )}

        {(!loan.payments || loan.payments.length === 0) && (
          <div className="text-center py-4 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No payment history available</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LenderLoanDetailsModal;

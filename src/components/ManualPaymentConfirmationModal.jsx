import React, { useState, useRef } from 'react';
import api from '../lib/api';

const ManualPaymentConfirmationModal = ({ isOpen, onClose, payment, userRole, onUpdate }) => {
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setScreenshot(file);
    }
  };

  const uploadScreenshot = async (file) => {
    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('paymentId', payment.id);

    const response = await api.post('/payments/upload-screenshot', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.filePath;
  };

  const handleSubmitProof = async () => {
    if (!transactionId && !screenshot) {
      alert('Please provide either a transaction ID or upload a screenshot');
      return;
    }

    setLoading(true);
    try {
      let screenshotPath = null;

      if (screenshot) {
        setUploading(true);
        screenshotPath = await uploadScreenshot(screenshot);
        setUploading(false);
      }

      const response = await api.post('/payments/submit-manual-proof', {
        paymentId: payment.id,
        transactionId,
        note,
        screenshotPath,
        userRole
      });

      if (response.data.success) {
        onUpdate(response.data.payment);
        onClose();
      }
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit payment proof');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleConfirmPayment = async (confirmed) => {
    setLoading(true);
    try {
      const response = await api.post('/payments/confirm-manual-payment', {
        paymentId: payment.id,
        confirmed,
        userRole,
        note: confirmed ? note : `Disputed by ${userRole}: ${note}`
      });

      if (response.data.success) {
        onUpdate(response.data.payment);
        onClose();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !payment) return null;

  const isLender = userRole === 'LENDER';
  const isBorrower = userRole === 'BORROWER';
  const canSubmitProof = payment.manualConfirmationStatus === 'PENDING_UPLOAD';
  const canConfirm = payment.manualConfirmationStatus === 'PENDING_CONFIRMATION';
  const needsLenderConfirmation = !payment.lenderConfirmed && canConfirm;
  const needsBorrowerConfirmation = !payment.borrowerConfirmed && canConfirm;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white/95 to-fern_green_light/10 backdrop-blur-lg rounded-2xl shadow-2xl border translate-y-[10vh]  border-white/20 w-full max-w-lg">
        <div className="p-6 border-b border-fern_green/20">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-fern_green to-mantis bg-clip-text text-transparent">
            Manual Payment Confirmation
          </h3>
          <p className="text-gray-600 mt-2">
            CashApp Payment - Amount: ${payment.amount}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Status */}
          <div className="p-4 bg-gradient-to-r from-fern_green/10 to-mantis/10 rounded-xl border border-fern_green/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${payment.manualConfirmationStatus === 'PENDING_UPLOAD'
                  ? 'bg-yellow-100 text-yellow-800'
                  : payment.manualConfirmationStatus === 'PENDING_CONFIRMATION'
                    ? 'bg-blue-100 text-blue-800'
                    : payment.manualConfirmationStatus === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                {payment.manualConfirmationStatus === 'PENDING_UPLOAD' && 'Waiting for Proof'}
                {payment.manualConfirmationStatus === 'PENDING_CONFIRMATION' && 'Waiting for Confirmation'}
                {payment.manualConfirmationStatus === 'CONFIRMED' && 'Confirmed'}
                {payment.manualConfirmationStatus === 'DISPUTED' && 'Disputed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${payment.lenderConfirmed ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-sm text-gray-600">Lender Confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${payment.borrowerConfirmed ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-sm text-gray-600">Borrower Confirmed</span>
              </div>
            </div>
          </div>

          {/* Existing Payment Info */}
          {payment.cashAppTransactionId && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Transaction ID: <span className="font-mono">{payment.cashAppTransactionId}</span></p>
            </div>
          )}

          {/* Display Payment Proof/Screenshot if available */}
          {(payment.screenshotPath || payment.confirmationScreenshot) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Payment Proof:</h4>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Screenshot Evidence</span>
                  <a 
                    href={`${import.meta.env.VITE_BASE_URL}/${payment.confirmationScreenshot || payment.screenshotPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                  >
                    View Full Size
                  </a>
                </div>
                <div className="relative">
                  <img 
                    src={`${import.meta.env.VITE_BASE_URL}/${payment.confirmationScreenshot || payment.screenshotPath}`}
                    alt="Payment proof screenshot"
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-white shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Payment proof uploaded by {payment.payerRole === 'LENDER' ? 'lender' : 'borrower'}
                </div>
              </div>
            </div>
          )}

          {payment.confirmationNote && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Note: {payment.confirmationNote}</p>
            </div>
          )}

          {/* Submit Proof Section */}
          {canSubmitProof && (isBorrower || (isLender && payment.payerRole === 'LENDER')) && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Submit Payment Proof:</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CashApp Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fern_green focus:border-transparent"
                  placeholder="Enter transaction ID if available"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshot Proof
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gradient-to-r from-fern_green/20 to-mantis/20 text-fern_green border border-fern_green/30 rounded-xl hover:bg-gradient-to-r hover:from-fern_green/30 hover:to-mantis/30 transition-all duration-200"
                  >
                    Choose File
                  </button>
                  {screenshot && (
                    <span className="text-sm text-gray-600">
                      {screenshot.name}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fern_green focus:border-transparent"
                  rows="3"
                  placeholder="Any additional information..."
                />
              </div>

              <button
                onClick={handleSubmitProof}
                disabled={loading || uploading}
                className="w-full py-3 bg-gradient-to-r from-fern_green to-mantis text-white font-semibold rounded-xl hover:from-fern_green_dark hover:to-mantis_dark transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Proof'}
              </button>
            </div>
          )}

          {/* Confirmation Section */}
          {canConfirm && ((isLender && needsLenderConfirmation) || (isBorrower && needsBorrowerConfirmation)) && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Confirm Payment:</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Notes
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fern_green focus:border-transparent"
                  rows="2"
                  placeholder="Optional confirmation notes..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleConfirmPayment(true)}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                >
                  ✓ Confirm Payment
                </button>
                <button
                  onClick={() => handleConfirmPayment(false)}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                >
                  ✗ Dispute Payment
                </button>
              </div>
            </div>
          )}

          {/* Read-only state for confirmed/disputed payments */}
          {(payment.manualConfirmationStatus === 'CONFIRMED' || payment.manualConfirmationStatus === 'DISPUTED') && (
            <div className="text-center py-6">
              <div className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold ${payment.manualConfirmationStatus === 'CONFIRMED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                {payment.manualConfirmationStatus === 'CONFIRMED' ? '✓ Payment Confirmed' : '✗ Payment Disputed'}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-fern_green/20">
          <button
            onClick={onClose}
            className="px-6 py-2 text-black hover:text-gray-900 font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualPaymentConfirmationModal;

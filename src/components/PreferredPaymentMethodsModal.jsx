import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const PreferredPaymentMethodsModal = ({ isOpen, onClose, lenderTerm, onUpdate }) => {
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [requireMatching, setRequireMatching] = useState(true);
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { value: 'CASHAPP', label: 'CashApp', icon: '💸' },
    { value: 'PAYPAL', label: 'PayPal', icon: '💳' },
    { value: 'ZELLE', label: 'Zelle', icon: '🏦' },
    { value: 'INTERNAL_WALLET', label: 'Internal Wallet', icon: '💰' }
  ];

  useEffect(() => {
    if (lenderTerm) {
      try {
        const preferred = lenderTerm.preferredPaymentMethods 
          ? JSON.parse(lenderTerm.preferredPaymentMethods) 
          : [];
        setSelectedMethods(preferred);
        setRequireMatching(lenderTerm.requireMatchingPaymentMethod !== false);
      } catch (error) {
        console.error('Error parsing preferred payment methods:', error);
        setSelectedMethods([]);
      }
    }
  }, [lenderTerm]);

  const handleMethodToggle = (method) => {
    setSelectedMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // const response = await api.put(`/admin/lender-terms/${lenderTerm.id}`, {
      const response = await api.put(`/lender/terms/payment-preference/${lenderTerm.id}`, {
        preferredPaymentMethods: JSON.stringify(selectedMethods),
        requireMatchingPaymentMethod: requireMatching
      });

      if (response.data.success) {
        onUpdate(response.data.lenderTerm);
        onClose();
      }
    } catch (error) {
      console.error('Error updating preferred payment methods:', error);
      alert('Failed to update preferred payment methods');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white/95 to-fern_green_light/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
        <div className="p-6 border-b border-fern_green/20">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-fern_green to-mantis bg-clip-text text-transparent">
            Preferred Payment Methods
          </h3>
          <p className="text-gray-600 mt-2">
            Select which payment methods you prefer to use for loans
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Methods Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Preferred Methods:
            </label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-fern_green/50 cursor-pointer transition-all duration-200 hover:bg-fern_green/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes(method.value)}
                    onChange={() => handleMethodToggle(method.value)}
                    className="w-4 h-4 text-fern_green focus:ring-fern_green border-gray-300 rounded"
                  />
                  <span className="text-2xl ml-3">{method.icon}</span>
                  <span className="ml-3 font-medium text-gray-700">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Require Matching Payment Method */}
          <div>
            <label className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-fern_green/50 cursor-pointer transition-all duration-200">
              <input
                type="checkbox"
                checked={requireMatching}
                onChange={(e) => setRequireMatching(e.target.checked)}
                className="w-4 h-4 text-fern_green focus:ring-fern_green border-gray-300 rounded"
              />
              <div>
                <span className="font-medium text-gray-700">Require Matching Payment Method</span>
                <p className="text-sm text-gray-500">
                  Borrowers must have at least one of your preferred payment methods
                </p>
              </div>
            </label>
          </div>

          {selectedMethods.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800">
                ⚠️ No payment methods selected. Borrowers will be able to use any available payment method.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-fern_green/20">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-fern_green to-mantis text-white font-semibold rounded-xl hover:from-fern_green_dark hover:to-mantis_dark transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferredPaymentMethodsModal;

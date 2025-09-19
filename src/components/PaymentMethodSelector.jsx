import React, { useState } from 'react';
import { CreditCard, Smartphone, Wallet, DollarSign } from 'lucide-react';

const PaymentMethodSelector = ({ onMethodSelect, selectedMethod, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const paymentMethods = [
    {
      id: 'CASHAPP',
      name: 'CashApp',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Pay with CashApp (Manual Confirmation Required)',
      isManual: true
    },
    {
      id: 'PAYPAL',
      name: 'PayPal',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Pay with PayPal (Automated Transfers)',
      isManual: false
    },
    {
      id: 'ZELLE',
      name: 'Zelle',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Pay with Zelle (Manual Confirmation Required)',
      isManual: true
    },
    {
      id: 'INTERNAL_WALLET',
      name: 'Internal Wallet',
      icon: <Wallet className="w-5 h-5" />,
      description: 'Use internal wallet (Automated)',
      isManual: false
    }
  ];

  const selectedMethodData = paymentMethods.find(method => method.id === selectedMethod);

  const handleMethodSelect = (method) => {
    onMethodSelect(method.id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 border rounded-lg flex items-center justify-between ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50 cursor-pointer'
        } border-gray-300 transition-all duration-200`}
      >
        <div className="flex items-center space-x-3">
          {selectedMethodData ? (
            <>
              {selectedMethodData.icon}
              <span className="font-medium">{selectedMethodData.name}</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Select Payment Method</span>
            </>
          )}
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                {method.icon}
                <div className="text-left">
                  <p className="font-medium flex items-center">
                    {method.name}
                    {method.isManual && (
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Manual
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;

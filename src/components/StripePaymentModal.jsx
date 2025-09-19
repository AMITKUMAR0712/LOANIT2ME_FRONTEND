import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import StripePaymentForm from './StripePaymentForm';
import { X, Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const StripePaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  loanId,
  payerRole,
  receiverRole,
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePayment = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            loanId,
            amount,
            method: 'CASHAPP',
            payerRole,
            receiverRole
          })
        });

        const data = await response.json();

        if (response.ok && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setPaymentId(data.id);
        } else {
          setError(data.error || 'Failed to initialize payment');
        }
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError('Failed to initialize payment');
      }

      setLoading(false);
    };

    if (isOpen && amount && loanId) {
      initializePayment();
    }
  }, [isOpen, amount, loanId, payerRole, receiverRole]);

  const retryInitialization = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          loanId,
          amount,
          method: 'CASHAPP',
          payerRole,
          receiverRole
        })
      });

      const data = await response.json();

      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentId(data.id);
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to initialize payment');
    }

    setLoading(false);
  };

  const handlePaymentSuccess = (paymentIntent) => {
    onPaymentSuccess?.(paymentIntent);
    onClose();
  };

  const handlePaymentError = (error) => {
    onPaymentError?.(error);
  };

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#424770',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '8px',
    }
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>CashApp Payment</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Initializing payment...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <button
                onClick={retryInitialization}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <StripePaymentForm
                amount={amount}
                paymentId={paymentId}
                loanDetails={{ loanId }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;

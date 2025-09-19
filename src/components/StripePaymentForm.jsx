import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';

const StripePaymentForm = ({ 
  onSuccess, 
  onError, 
  amount, 
  loanDetails,
  paymentId 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Return URL after payment
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (error) {
        setError(error.message);
        onError?.(error);
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        
        // Call backend to confirm payment
        try {
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/confirm-stripe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              paymentId: paymentId
            })
          });

          if (response.ok) {
            onSuccess?.(paymentIntent);
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to confirm payment');
            onError?.(errorData);
          }
        } catch (confirmError) {
          console.error('Payment confirmation error:', confirmError);
          setError('Failed to confirm payment with server');
          onError?.(confirmError);
        }
      }
    } catch (submitError) {
      console.error('Payment submission error:', submitError);
      setError(submitError.message || 'Payment failed');
      onError?.(submitError);
    }

    setProcessing(false);
  };

  if (succeeded) {
    return (
      <div className="text-center p-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-700 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your payment of ${amount.toFixed(2)} has been processed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">Complete Payment</h3>
        </div>

        {loanDetails && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Payment Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Amount:</span> ${amount.toFixed(2)}</p>
              <p><span className="font-medium">Loan ID:</span> {loanDetails.loanId}</p>
              <p><span className="font-medium">Method:</span> CashApp via Stripe</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <PaymentElement 
              options={{
                layout: 'tabs'
              }}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Secured by Stripe • Your payment information is encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default StripePaymentForm;

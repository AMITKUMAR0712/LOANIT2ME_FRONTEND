import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Plus, Trash2, Star, StarOff, CheckCircle, AlertCircle, Smartphone, DollarSign } from 'lucide-react';

const PaymentAccountModal = ({ isOpen, onClose, onAccountAdded }) => {
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('CASHAPP');
  const [newAccount, setNewAccount] = useState({
    cashAppHandle: '',
    paypalEmail: '',
    accountNickname: '',
    isDefault: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPaymentAccounts();
    }
  }, [isOpen]);

  const fetchPaymentAccounts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment-accounts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentAccounts(data.paymentAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate based on account type
    if (selectedType === 'CASHAPP') {
      if (!newAccount.cashAppHandle.startsWith('$')) {
        setError('CashApp handle must start with $ (e.g., $johndoe)');
        setLoading(false);
        return;
      }
    } else if (selectedType === 'PAYPAL') {
      if (!newAccount.paypalEmail.includes('@')) {
        setError('Please provide a valid PayPal email address');
        setLoading(false);
        return;
      }
    }

    try {
      const accountData = {
        accountType: selectedType,
        accountNickname: newAccount.accountNickname || (selectedType === 'CASHAPP' ? newAccount.cashAppHandle : newAccount.paypalEmail),
        isDefault: newAccount.isDefault || paymentAccounts.filter(acc => acc.accountType === selectedType).length === 0
      };

      if (selectedType === 'CASHAPP') {
        accountData.cashAppHandle = newAccount.cashAppHandle;
      } else if (selectedType === 'PAYPAL') {
        accountData.paypalEmail = newAccount.paypalEmail;
      }

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(accountData)
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentAccounts(prev => [...prev, data.paymentAccount]);
        setNewAccount({ cashAppHandle: '', paypalEmail: '', accountNickname: '', isDefault: false });
        onAccountAdded?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add account');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      setError('Failed to add account');
    }

    setLoading(false);
  };

  const handleSetDefault = async (accountId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment-accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isDefault: true })
      });

      if (response.ok) {
        fetchPaymentAccounts();
      }
    } catch (error) {
      console.error('Error setting default account:', error);
    }
  };

  const handleDeleteAccount = async (accountId, accountType) => {
    if (!confirm(`Are you sure you want to delete this ${accountType} account?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setPaymentAccounts(prev => prev.filter(acc => acc.id !== accountId));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const cashAppAccounts = paymentAccounts.filter(acc => acc.accountType === 'CASHAPP');
  const paypalAccounts = paymentAccounts.filter(acc => acc.accountType === 'PAYPAL');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Manage Payment Accounts</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CashApp Accounts */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                CashApp Accounts
              </h3>
              {cashAppAccounts.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No CashApp accounts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cashAppAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded-full ${account.isDefault ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {account.isDefault ? (
                            <Star className="w-4 h-4 text-green-600 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{account.cashAppHandle}</p>
                          <p className="text-xs text-gray-500">{account.accountNickname}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!account.isDefault && (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                          >
                            Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAccount(account.id, 'CashApp')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PayPal Accounts */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                PayPal Accounts
              </h3>
              {paypalAccounts.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No PayPal accounts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paypalAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded-full ${account.isDefault ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {account.isDefault ? (
                            <Star className="w-4 h-4 text-green-600 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{account.paypalEmail}</p>
                          <p className="text-xs text-gray-500">{account.accountNickname}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!account.isDefault && (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                          >
                            Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAccount(account.id, 'PayPal')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add New Account */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Payment Account</h3>
            
            {/* Account Type Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setSelectedType('CASHAPP')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  selectedType === 'CASHAPP' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <span className="font-medium">CashApp</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedType('PAYPAL')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  selectedType === 'PAYPAL' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">PayPal</span>
                </div>
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              {selectedType === 'CASHAPP' && (
                <div>
                  <Label htmlFor="cashAppHandle">CashApp Handle</Label>
                  <Input
                    id="cashAppHandle"
                    type="text"
                    placeholder="$johndoe"
                    value={newAccount.cashAppHandle}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, cashAppHandle: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Must start with $ symbol</p>
                </div>
              )}

              {selectedType === 'PAYPAL' && (
                <div>
                  <Label htmlFor="paypalEmail">PayPal Email</Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={newAccount.paypalEmail}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Your PayPal account email address</p>
                </div>
              )}

              <div>
                <Label htmlFor="accountNickname">Account Nickname (Optional)</Label>
                <Input
                  id="accountNickname"
                  type="text"
                  placeholder={`My ${selectedType === 'CASHAPP' ? 'CashApp' : 'PayPal'} Account`}
                  value={newAccount.accountNickname}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, accountNickname: e.target.value }))}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>Adding...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add {selectedType === 'CASHAPP' ? 'CashApp' : 'PayPal'} Account
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Why do we need your payment accounts?</p>
                <p className="mb-2">
                  <strong>CashApp:</strong> For manual transfers (you'll need to send money via CashApp app after Stripe payment)
                </p>
                <p>
                  <strong>PayPal:</strong> For automated transfers (money is sent automatically to your PayPal account)
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentAccountModal;

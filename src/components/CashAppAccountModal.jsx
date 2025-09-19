import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Plus, Trash2, Star, StarOff, CheckCircle, AlertCircle } from 'lucide-react';

const CashAppAccountModal = ({ isOpen, onClose, onAccountAdded }) => {
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAccount, setNewAccount] = useState({
    cashAppHandle: '',
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

    // Validate CashApp handle
    if (!newAccount.cashAppHandle.startsWith('$')) {
      setError('CashApp handle must start with $ (e.g., $johndoe)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountType: 'CASHAPP',
          cashAppHandle: newAccount.cashAppHandle,
          accountNickname: newAccount.accountNickname || newAccount.cashAppHandle,
          isDefault: newAccount.isDefault || paymentAccounts.length === 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentAccounts(prev => [...prev, data.paymentAccount]);
        setNewAccount({ cashAppHandle: '', accountNickname: '', isDefault: false });
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

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this CashApp account?')) return;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Manage CashApp Accounts</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Accounts */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Your CashApp Accounts</h3>
            {paymentAccounts.length === 0 ? (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No CashApp accounts added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paymentAccounts.map((account) => (
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
                        <p className="font-medium">{account.cashAppHandle}</p>
                        <p className="text-sm text-gray-500">{account.accountNickname}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!account.isDefault && (
                        <button
                          onClick={() => handleSetDefault(account.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Account */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New CashApp Account</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
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

              <div>
                <Label htmlFor="accountNickname">Account Nickname (Optional)</Label>
                <Input
                  id="accountNickname"
                  type="text"
                  placeholder="My Main CashApp"
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
                    Add CashApp Account
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
                <p className="font-medium mb-1">Why do we need your CashApp handle?</p>
                <p>This allows us to transfer money directly to your CashApp account when you receive loan funds or repayments.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashAppAccountModal;

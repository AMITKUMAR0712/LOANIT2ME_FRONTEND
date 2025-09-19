import axios from "axios";

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Add a request interceptor to include the token in the Authorization header
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Register a new user
export async function register(fullName, email, phoneNumber, password, inviteToken = null) {
  // console.log(fullName, email, phoneNumber, password);
  const payload = { fullName, email, phoneNumber, password };
  if (inviteToken) {
    payload.inviteToken = inviteToken;
    // Use public signup endpoint for invites
    const res = await instance.post('/public/signup', payload);
    return res.data;
  } else {
    // Use regular auth endpoint for normal registration
    const res = await instance.post('/auth/register', payload);
    return res.data;
  }
}

// Invite APIs
export async function getInviteDetails(token) {
  const res = await instance.get(`/invite/${token}`)
  return res.data
}

export async function acceptInvite(token, borrowerData) {
  // console.log('Accepting invite with token:', token);
  // console.log('Borrower data:', borrowerData);

  const res = await instance.post('/invite/accept', { token, borrowerData })
  return res.data
}

// Login user
export async function login(email, password) {
  const res = await instance.post('/auth/login', { email, password })
  // console.log(res.data)
  return res.data
}

// Logout user
export async function logout() {
  try {
    const res = await instance.post('/auth/logout')
    // Clear the token from localStorage on successful logout
    localStorage.removeItem('token')
    return res.data
  } catch (error) {
    // Even if the server request fails, ensure we clear the local token
    localStorage.removeItem('token')
    throw error
  }
}

// Get current user details
export async function me() {
  const res = await instance.get('/auth/me')
  return res.data
}








export async function fetchDashboard() {
  const res = await instance.get('/dashboard')
  return res.data
}

export async function createLoan(payload) {
  const res = await instance.post('/loans', payload)
  return res.data
}

export async function fetchLoans() {
  const res = await instance.get('/loans')
  return res.data
}

export async function fetchLoan(id) {
  const res = await instance.get(`/loans/${id}`)
  return res.data
}

export async function updateLoanStatus(id, body) {
  const res = await instance.patch(`/loans/${id}/status`, body)
  return res.data
}

export async function sendReminder(loanId) {
  const res = await instance.post(`/loans/${loanId}/reminder`)
  return res.data
}

export async function confirmPayment(paymentId) {
  const res = await instance.patch(`/lender/payments/${paymentId}/confirm`)
  return res.data
}

export async function sendLoanReminder(loanId) {
  const res = await instance.post(`/loans/${loanId}/reminder`)
  return res.data
}








// Lender APIs
export async function fetchLenderTerms() {
  const res = await instance.get('/lender/terms')
  return res.data
}

export async function createLenderTerm(payload) {
  const res = await instance.post('/lender/terms', payload)
  return res.data
}

export async function updateLenderTerm(termId, payload) {
  const res = await instance.patch(`/lender/terms/${termId}`, payload)
  return res.data
}

export async function fetchLenderLoans() {
  const res = await instance.get('/lender/loans')
  return res.data
}

export async function fundLoan(loanId) {
  const res = await instance.post(`/lender/loans/${loanId}/fund`)
  return res.data
}

export async function denyLoan(loanId) {
  const res = await instance.post(`/lender/loans/${loanId}/deny`)
  return res.data
}

export async function fetchLenderRelationships() {
  const res = await instance.get('/lender/relationships')
  return res.data
}

export async function updateRelationship(relationshipId, payload) {
  const res = await instance.patch(`/lender/relationships/${relationshipId}`, payload)
  return res.data
}


// Borrower APIs
export async function fetchBorrowerLoans() {
  const res = await instance.get('/borrower/loans')
  return res.data
}

export async function fetchBorrowerRelationships() {
  const res = await instance.get('/borrower/relationships')
  return res.data
}

export async function requestLoan({ lenderId, amount, paybackDays, signedBy, agreementText, preferredPaymentMethod, lenderTermId, agreedPaymentAccountId, agreedPaymentMethod }) {
  const res = await instance.post('/borrower/loans', { lenderId, amount, paybackDays, signedBy, agreementText, preferredPaymentMethod, lenderTermId,agreedPaymentAccountId, agreedPaymentMethod })
  return res.data
}

export async function recordPayment({ loanId, amount, method, reference }) {
  const res = await instance.post(`/borrower/loans/${loanId}/payments`, { amount, method, reference })
  return res.data
}

export async function markLoanAsCompleted(loanId) {
  const res = await instance.patch(`/borrower/loans/${loanId}/completed`)
  return res.data
}

export async function checkMultipleLoans({lenderId, lenderTermId}) {
  // console.log(lenderId, lenderTermId);
  
  const res = await instance.post('/borrower/loans/multiple', { lenderId, lenderTermId })
  return res.data
}

export async function getPaymentId({ paymentMethod }) {
  try {
    const res = await instance.post("/borrower/payment/payment-method", {
      paymentMethod,
    });
    return res.data; // will contain { success, data/message }
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}




// Notification APIs
export async function fetchNotifications() {
  const res = await instance.get('/notifications')
  return res.data
}

export async function createNotification(payload) {
  const res = await instance.post('/notifications', payload)
  return res.data
}

export async function markNotificationAsRead(notificationId) {
  const res = await instance.patch(`/notifications/${notificationId}/read`)
  return res.data
}




// Admin APIs
export async function fetchAdminUsers() {
  const response = await instance.get('/admin/users');
  return response.data;
}

export async function updateAdminUser(id, data) {
  const response = await instance.patch(`/admin/users/${id}`, data);
  return response.data;
}

export async function deleteAdminUser(id) {
  const response = await instance.delete(`/admin/users/${id}`);
  return response.data;
}

export async function fetchAdminLoans() {
  const response = await instance.get('/admin/loans');
  return response.data;
}

export async function updateAdminLoan(id, data) {
  const response = await instance.patch(`/admin/loans/${id}`, data);
  return response.data;
}

export async function fetchAdminRelationships() {
  const response = await instance.get('/admin/relationships');
  return response.data;
}

export async function updateAdminRelationship(id, data) {
  const response = await instance.patch(`/admin/relationships/${id}`, data);
  return response.data;
}

export async function fetchAdminLenderTerms() {
  const response = await instance.get('/admin/lender-terms');
  return response.data;
}

export async function updateAdminLenderTerm(id, data) {
  const response = await instance.patch(`/admin/lender-terms/${id}`, data);
  return response.data;
}

export async function fetchAdminPayments() {
  const response = await instance.get('/admin/payments');
  return response.data;
}

export async function confirmAdminPayment(id) {
  const response = await instance.patch(`/admin/payments/${id}/confirm`, {});
  return response.data;
}

export async function fetchAdminAuditLogs() {
  const response = await instance.get('/admin/audit-logs');
  return response.data;
}

export async function fetchAdminNotifications() {
  const response = await instance.get('/admin/notifications');
  return response.data;
}

export async function markAdminNotificationRead(id) {
  const response = await instance.patch(`/admin/notifications/${id}/read`, {});
  return response.data;
}

export async function testAuditLogging() {
  const response = await instance.get('/test/test-audit-log');
  return response.data;
}

// Payment APIs
export async function processPayment({ loanId, amount, method, payerRole, receiverRole }) {
  // console.log(loanId, amount, method, payerRole, receiverRole);
  
  const res = await instance.post('/payment', { loanId, amount, method, payerRole, receiverRole })
  return res.data
}

export async function fetchLoanPayments(loanId) {
  const res = await instance.get(`/payment/loan/${loanId}`)
  return res.data
}

// Confirm PayPal payment
export async function confirmPayPalPayment({ paymentId, payerId, dbPaymentId }) {
  const res = await instance.post('/payment/confirm-paypal', { 
    paymentId, 
    payerId, 
    dbPaymentId 
  });
  return res.data;
}

// Manual Payment Confirmation Functions
export async function uploadPaymentScreenshot(formData) {
  const res = await instance.post('/payments/upload-screenshot', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return res.data;
}

export async function confirmManualPayment({ paymentId, role }) {
  const res = await instance.post('/payments/confirm-manual-payment', { 
    paymentId, 
    role 
  });
  return res.data;
}




export default instance
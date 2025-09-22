import React, { useState, useEffect } from "react"
import {
    DollarSign,
    TrendingUp,
    CheckCircle,
    Clock,
    Users,
    Settings,
    AlertTriangle,
    Home,
    XCircle,
    ShieldCheck,
    Eye,
    Plus,
    Copy,
    Edit,
    Bell,
    Smartphone,
    CreditCard,
    Wallet
} from "lucide-react"
import CreateTermModal from "../components/CreateTermModal"
import EditTermModal from "../components/EditTermModal"
import PreferredPaymentMethodsModal from "../components/PreferredPaymentMethodsModal"
import ManualPaymentConfirmationModal from "../components/ManualPaymentConfirmationModal"
import { fetchLenderTerms, fetchLenderLoans, fetchLenderRelationships, updateRelationship, me, denyLoan, createNotification, logout, processPayment, confirmPayPalPayment, uploadPaymentScreenshot, confirmManualPayment, getPrefferedPaymentId } from "../lib/api"
import LoanDetailsModal from "@/components/LenderLoanDetailsModal"
import PaymentMethodSelector from "@/components/PaymentMethodSelector"
import StripePaymentModal from "@/components/StripePaymentModal"
import PaymentAccountModal from "../components/PaymentAccountModal.jsx";

// Loan health styles
const LoanHealthColors = {
    GOOD: "bg-celadon-900 text-fern_green-500 border border-celadon-400",
    BEHIND: "bg-mantis-900 text-mantis-400 border border-mantis-400",
    FAILING: "bg-celadon-light-100 bg-opacity-10 text-celadon-light-300 border border-celadon-light-200",
    DEFAULTED: "bg-fern_green-100 bg-opacity-10 text-fern_green-300 border border-fern_green-200",
}
const LoanHealthIcons = {
    GOOD: <CheckCircle className="w-4 h-4" />,
    BEHIND: <Clock className="w-4 h-4" />,
    FAILING: <AlertTriangle className="w-4 h-4" />,
    DEFAULTED: <XCircle className="w-4 h-4" />,
}

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
export default function LenderDashboard() {


    const [showProfile, setShowProfile] = useState(false)
    const [userDetails, setUserDetails] = useState(null)
    const [loans, setLoans] = useState([])
    const [relationships, setRelationships] = useState([])
    const [lenderTerms, setLenderTerms] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState("overview")
    const [showCreateTermModal, setShowCreateTermModal] = useState(false)
    const [showEditTermModal, setShowEditTermModal] = useState(false)
    const [selectedTerm, setSelectedTerm] = useState(null)
    const [showLoanDetails, setShowLoanDetails] = useState(null)
    const [showFundingModal, setShowFundingModal] = useState(null)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('INTERNAL_WALLET')
    const [fundingLoading, setFundingLoading] = useState(null)
    const [showStripeModal, setShowStripeModal] = useState(false)
    const [stripePaymentData, setStripePaymentData] = useState(null)
    const [showPaymentAccountModal, setShowPaymentAccountModal] = useState(false)
    const [showPreferredPaymentModal, setShowPreferredPaymentModal] = useState(false)
    const [showManualPaymentModal, setShowManualPaymentModal] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [paymentId, setPaymentId] = useState(null)

    useEffect(() => {
        fetchData()
    }, [activeSection])

    // Handle PayPal return from approval
    useEffect(() => {
        const handlePayPalReturn = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const paymentId = urlParams.get('paymentId');
            const payerId = urlParams.get('PayerID');

            if (paymentId && payerId) {
                const pendingPayment = localStorage.getItem('pendingPayPalPayment');
                if (pendingPayment) {
                    try {
                        const paymentData = JSON.parse(pendingPayment);

                        await confirmPayPalPayment({
                            paymentId,
                            payerId,
                            dbPaymentId: paymentData.dbPaymentId
                        });

                        alert("Loan funded successfully via PayPal!");

                        // Clear pending payment
                        localStorage.removeItem('pendingPayPalPayment');

                        // Refresh data
                        fetchData();

                        // Clean URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } catch (error) {
                        console.error('Error confirming PayPal payment:', error);
                        alert("Failed to confirm PayPal payment. Please try again.");
                    }
                }
            }
        };

        handlePayPalReturn();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true)
            const [userDetails, loansRes, relationshipsRes, termsRes] = await Promise.all([
                me(),
                fetchLenderLoans(),
                fetchLenderRelationships(),
                fetchLenderTerms()
            ])

            setUserDetails(userDetails)
            setLoans(loansRes.loans || [])
            setRelationships(relationshipsRes.relationships || [])
            setLenderTerms(termsRes.lenderTerms || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Handle loan actions
    const handleLoanAction = async (loanId, action) => {
        try {
            if (action === "approve") {
                // Find the loan to set up funding modal
                const loan = loans.find(l => l.id === loanId)
                if (!loan) {
                    console.error('Loan not found')
                    return
                }
                setShowFundingModal(loan)
                // console.log(loan.agreedPaymentAccountId);
                // console.log(loan.borrower);


                const id = getPrefferedPaymentId(loan.borrower.id, loan.agreedPaymentMethod)
                setPaymentId(id)

                setSelectedPaymentMethod(loan.agreedPaymentMethod) // Reset to default
            } else if (action === "deny") {
                await denyLoan(loanId)
                const loansRes = await fetchLenderLoans()
                setLoans(loansRes.loans || [])
            }
        } catch (error) {
            console.error('Error handling loan action:', error)
            alert("Failed to process loan action. Please try again.")
        }
    }

    const handleFundLoan = async (loan) => {
        try {
            setFundingLoading(loan.id)

            // Handle manual payment methods (CashApp, Zelle)
            if (selectedPaymentMethod === 'CASHAPP' || selectedPaymentMethod === 'ZELLE') {
                // Create a manual payment entry
                const paymentResult = await processPayment({
                    loanId: loan.id,
                    amount: loan.amount,
                    method: selectedPaymentMethod,
                    payerRole: "LENDER",
                    receiverRole: "BORROWER"
                });

                if (paymentResult.success) {
                    // Set the payment for manual confirmation
                    setSelectedPayment(paymentResult.payment);
                    setShowManualPaymentModal(true);
                    setShowFundingModal(null);
                } else {
                    alert("Failed to create payment. Please try again.");
                }
                return;
            }

            // Handle PayPal with account setup message
            if (selectedPaymentMethod === 'PAYPAL') {
                // Check if user has PayPal account set up
                alert("Please ensure your PayPal account is properly configured in Payment Settings before proceeding.");
                // Continue with normal PayPal flow
            }

            // Handle Zelle with account setup message
            if (selectedPaymentMethod === 'ZELLE') {
                alert("Please ensure your Zelle account information is updated in Payment Settings to receive funds.");
            }

            // Process payment for other methods
            const paymentResult = await processPayment({
                loanId: loan.id,
                amount: loan.amount,
                method: selectedPaymentMethod,
                payerRole: "LENDER",
                receiverRole: "BORROWER"
            })

            // Handle PayPal approval redirect
            if (paymentResult.approvalUrl) {
                // Store payment details for confirmation after return
                localStorage.setItem('pendingPayPalPayment', JSON.stringify({
                    paymentId: paymentResult.paymentId,
                    dbPaymentId: paymentResult.id,
                    loanId: loan.id,
                    amount: loan.amount
                }));

                // Redirect to PayPal for approval
                window.location.href = paymentResult.approvalUrl;
                return;
            }

            // Handle internal wallet or other immediate completions
            if (selectedPaymentMethod === 'INTERNAL_WALLET' || paymentResult.confirmed) {
                alert("Loan funded successfully!");
            } else {
                alert("Payment processed successfully!");
            }

            // Refresh loans data
            const loansRes = await fetchLenderLoans()
            setLoans(loansRes.loans || [])

            setShowFundingModal(null)
        } catch (error) {
            console.error('Error funding loan:', error)
            alert("Failed to fund loan. Please try again.")
        } finally {
            setFundingLoading(null)
        }
    }

    const handleStripePaymentSuccess = async () => {
        alert("Loan funded successfully via CashApp!")

        // Refresh loans data
        const loansRes = await fetchLenderLoans()
        setLoans(loansRes.loans || [])

        setShowStripeModal(false)
        setStripePaymentData(null)
        setFundingLoading(null)
    }

    const handleStripePaymentError = (error) => {
        console.error('Stripe payment error:', error)
        alert("Payment failed. Please try again.")
        setFundingLoading(null)
    }

    // Handle relationship actions
    const handleRelationshipAction = async (relationshipId, action) => {
        try {
            const status = action === "confirm" ? "CONFIRMED" : "BLOCKED"
            await updateRelationship(relationshipId, { status })

            // Refresh relationships data
            const relationshipsRes = await fetchLenderRelationships()
            setRelationships(relationshipsRes.relationships || [])
        } catch (error) {
            console.error('Error handling relationship action:', error)
        }
    }

    const handleTermCreated = (newTerm) => {
        setLenderTerms(prev => [newTerm, ...prev])
        setShowCreateTermModal(false)
    }

    const handleTermUpdated = (updatedTerm) => {
        setLenderTerms(prev => prev.map(term => term.id === updatedTerm.id ? updatedTerm : term))
        setShowEditTermModal(false)
        setSelectedTerm(null)
    }

    const handleSendNotification = async (loan, type) => {
        try {
            const message = type === 'PAYMENT_OVERDUE'
                ? `Your loan payment of $${loan.totalPayable} is overdue.`
                : `Reminder: Your loan payment of $${loan.totalPayable} is due on ${new Date(loan.paybackDate).toLocaleDateString()}.`;

            await createNotification({
                userId: loan.borrowerId,
                loanId: loan.id,
                type: type,
                message: message
            });

            alert("Notification sent successfully!");
        } catch (error) {
            console.error('Error sending notification:', error);
            alert("Failed to send notification");
        }
    };

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }


    if (loading) return <div className="flex justify-center items-center h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900 text-white font-semibold">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-fern_green-300 border-t-fern_green-500 rounded-full animate-spin mb-4"></div>
            Loading...
        </div>
    </div>

    const fundedLoans = loans.filter((l) => l.status === "FUNDED")
    const activeLoansList = loans.filter(l => l.status === "ACTIVE");
    const completedLoans = loans.filter(l => l.status === "COMPLETED");
    const pendingRequests = loans.filter(l => l.status === "PENDING");
    const deniedRequests = loans.filter(l => l.status === "DENIED");
    const overdueLoans = loans.filter(l => l.status === "OVERDUE");
    const activeLoans = [...fundedLoans, ...activeLoansList, ...overdueLoans].filter(l => l.status !== "COMPLETED" && l.status !== "DENIED");
    const totalLent = [...fundedLoans, ...activeLoansList, ...completedLoans, ...overdueLoans].reduce((sum, l) => sum + l.amount, 0)
    const totalExpectedReturn = [...fundedLoans, ...activeLoansList, ...completedLoans, ...overdueLoans].reduce((sum, l) => sum + l.totalPayable, 0)
    // console.log(pendingRequests);

    const confirmedBorrowers = relationships.filter((rel) => rel.status === "CONFIRMED").length

    return (
        <div className="font-noto-serif-jp min-h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900">
            {/* Header */}
            <header className="flex items-center justify-between h-[10vh] w-full bg-gradient-to-r from-fern_green-800 to-fern_green-400 text-white shadow-xl p-6 fixed top-0 left-0 right-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    {/* <ShieldCheck className="w-8 h-8 text-blue-600" /> */}
                    <img src="/logo.svg" alt="logo" className="w-[7rem] h-[7rem]" />
                    <h2 className="text-xl font-bold text-fern_green-200">Lender Dashboard</h2>
                    {/* <span className="text-sm text-fern_green-500 font-medium">Secured by LoanShield™</span> */}
                </div>
                {/* <div className="flex items-center gap-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{lenderRole}</button>
                    <button
                        className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('userRole');
                            window.location.reload();
                        }}
                    >
                        Logout
                    </button>
                </div> */}
                <div className="flex items-center justify-center flex-col gap-2">
                    <div className="relative">
                        <button onClick={() => setShowProfile(!showProfile)} className="bg-gradient-to-r from-fern_green-500 to-fern_green-600 text-white px-6 py-3 rounded-xl hover:from-fern_green-400 hover:to-fern_green-500 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                            {userDetails?.fullName}
                        </button>
                    </div>
                    {showProfile && (
                        <div className="min-h-[15%] min-w-[12%] shadow-2xl z-20 absolute top-full right-0 rounded-2xl bg-gradient-to-b from-nyanza-900 to-celadon-900 border border-celadon-500 backdrop-blur-sm">
                            <div className="p-6 flex flex-col items-center justify-center">
                                <div className="w-[4rem] h-[4rem] flex items-center justify-center p-4 bg-gradient-to-r from-fern_green-500 to-mantis-500 text-white rounded-full mb-3 font-bold text-xl shadow-lg">{userDetails?.fullName[0]}</div>
                                <h3 className="text-lg font-semibold text-fern_green-400 mb-2">{`Name: ${userDetails?.fullName}`}</h3>
                                <p className="text-sm text-fern_green-300 mb-1">{`Email: ${userDetails?.email}`}</p>
                                {userDetails?.phoneNumber && (
                                    <p className="text-xs text-fern_green-300">{`Phone: ${userDetails?.phoneNumber}`}</p>
                                )}
                                <button
                                    onClick={() => {
                                        setShowPaymentAccountModal(true)
                                        setShowProfile(false)
                                    }}
                                    className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all duration-300 w-full text-center font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                                    Manage Payment Accounts
                                </button>
                                <button
                                    onClick={() => {
                                        handleLogout()
                                        window.location.reload()
                                    }}
                                    className="mt-3 bg-gradient-to-r from-fern_green-500 to-fern_green-600 text-white px-6 py-3 rounded-xl hover:from-fern_green-400 hover:to-fern_green-500 transition-all duration-300 w-full text-center font-medium shadow-lg hover:shadow-xl transform hover:scale-105">Logout</button>
                            </div>
                        </div>
                    )}
                </div>
            </header >

            <div className="flex min-h-[90vh] bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900"
                onClick={() => setShowProfile(false)}
            >
                {/* Sidebar */}
                <aside className="w-[20%] bg-gradient-to-b from-fern_green-800 to-fern_green-500 shadow-2xl p-6 fixed top-[10vh] left-0 bottom-0 border-r border-celadon-600 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white mb-6 drop-shadow">Lender Navigation</h2>
                    <nav className="space-y-3 text-md">
                        <SidebarBtn icon={Home} label="Overview" section="overview" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={Clock} label="Loan Requests" section="requests" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={CheckCircle} label="Active Loans" section="active" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={Users} label="Borrowers" section="borrowers" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={Settings} label="Loan Terms" section="loan-terms" activeSection={activeSection} setActiveSection={setActiveSection} />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 ml-[20%] mt-[10vh] min-h-[90vh]">
                    {activeSection === "overview" && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                                <StatCard icon={DollarSign} label="Total Lent" value={`$${totalLent.toFixed(2)}`} color="text-nyanza-200" subtitle="Principal amount" />
                                <StatCard icon={TrendingUp} label="Expected Return" value={`$${totalExpectedReturn.toFixed(2)}`} color="text-nyanza-200" subtitle="Including fees" />
                                <StatCard icon={CheckCircle} label="Active Loans" value={fundedLoans.length} color="text-nyanza-200" subtitle="Currently funded" />
                                <StatCard icon={Clock} label="Pending Requests" value={pendingRequests.length} color="text-nyanza-200" subtitle="Awaiting approval" />
                                <StatCard icon={Users} label="Confirmed Borrowers" value={confirmedBorrowers} color="text-nyanza-200" subtitle="Active relationships" />
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between border border-celadon-900">
                                <div>
                                    <h3 className="text-2xl font-semibold mb-2 text-fern_green-500">Welcome back, {userDetails?.fullName} 👋</h3>
                                    <p className="text-fern_green-400">
                                        You currently have <span className="font-semibold text-mantis-300">{activeLoans.length}</span> active loans
                                        and <span className="font-semibold text-mantis-300">{pendingRequests.length}</span> pending requests.
                                    </p>
                                    <p className="text-fern_green-300 text-sm mt-2">
                                        Keep track of your borrowers and lending performance right here.
                                    </p>
                                    {deniedRequests.length > 0 && (
                                        <p>You’ve denied {deniedRequests.length} loan request(s).</p>
                                    )}
                                </div>


                                <div className="mt-4 md:mt-0">
                                    <button
                                        onClick={() => setShowCreateTermModal(true)}
                                        className="px-6 py-3 bg-fern_green-300 text-white rounded-xl shadow-md hover:bg-fern_green-400 transition-all duration-300 font-medium flex items-center">
                                        <Plus className="w-5 h-5 mr-2" /> Create New Loan Term
                                    </button>
                                </div>
                            </div>

                        </>
                    )}

                    {activeSection === "requests" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Pending Loan Requests</h2>
                            {pendingRequests.length ? (
                                pendingRequests.map((loan) => (
                                    <div key={loan.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <h3 className="font-semibold text-fern_green-500 text-lg">Request from {loan.borrower.fullName}</h3>
                                                <p className="text-sm text-fern_green-400">{loan.borrower.email}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
                                            <div>
                                                <p className="text-sm text-fern_green-400">Amount</p>
                                                <p className="font-semibold text-text-mantis-100">${loan.amount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-fern_green-400">Fee</p>
                                                <p className="font-semibold text-text-mantis-100">${loan.feeAmount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-fern_green-400">Total Return</p>
                                                <p className="font-semibold text-text-mantis-100">${loan.totalPayable.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-fern_green-400">Due Date</p>
                                                <p className="font-semibold text-text-mantis-100">{new Date(loan.paybackDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleLoanAction(loan.id, "approve")}
                                                className="bg-fern_green-300 text-white px-5 py-2 rounded-lg hover:bg-fern_green-400 transition-all duration-200 shadow-sm font-medium"
                                            >
                                                Fund via Payment
                                            </button>
                                            <button
                                                onClick={() => handleLoanAction(loan.id, "deny")}
                                                className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium"
                                            >
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No pending loan requests found.</p>
                            )}
                        </div>
                    )}

                    {activeSection === "active" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Active Loans</h2>

                            {/* Manual Payment Confirmations */}
                            {(() => {
                                const pendingManualPayments = activeLoans.filter(loan =>
                                    loan.payments && loan.payments.some(payment =>
                                        payment.payerRole === 'BORROWER' &&
                                        payment.receiverRole === 'LENDER' &&
                                        (payment.manualConfirmationStatus === 'PENDING_CONFIRMATION' ||
                                            payment.manualConfirmationStatus === 'PENDING_UPLOAD') &&
                                        (!payment.lenderConfirmed || payment.manualConfirmationStatus === 'PENDING_UPLOAD')
                                    )
                                );

                                return pendingManualPayments.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-semibold text-yellow-300 mb-4">Manual Payments to Confirm</h3>
                                        {pendingManualPayments.map((loan) => {
                                            const pendingPayment = loan.payments.find(payment =>
                                                payment.payerRole === 'BORROWER' &&
                                                payment.receiverRole === 'LENDER' &&
                                                (payment.manualConfirmationStatus === 'PENDING_CONFIRMATION' ||
                                                    payment.manualConfirmationStatus === 'PENDING_UPLOAD') &&
                                                (!payment.lenderConfirmed || payment.manualConfirmationStatus === 'PENDING_UPLOAD')
                                            );

                                            return (
                                                <div key={loan.id} className="bg-gradient-to-r from-yellow-900 to-orange-900 p-6 rounded-xl shadow-md mb-5 border border-yellow-600 hover:shadow-lg transition-all duration-300">
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div>
                                                            <h3 className="font-semibold text-yellow-100 text-lg">Payment from {loan.borrower.fullName}</h3>
                                                            <p className="text-sm text-yellow-200">{loan.borrower.email}</p>
                                                        </div>
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            {pendingPayment?.manualConfirmationStatus === 'PENDING_UPLOAD'
                                                                ? 'Waiting for Payment Proof'
                                                                : 'Pending Confirmation'
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-yellow-800 bg-opacity-30 p-4 rounded-lg mb-5">
                                                        <div>
                                                            <p className="text-sm text-yellow-200">Payment Amount</p>
                                                            <p className="font-semibold text-yellow-100">${pendingPayment?.amount ? pendingPayment.amount.toFixed(2) : loan.totalPayable.toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-yellow-200">Payment Method</p>
                                                            <p className="font-semibold text-yellow-100">{pendingPayment?.method || 'Manual'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-yellow-200">Transaction ID</p>
                                                            <p className="font-semibold text-yellow-100">{pendingPayment?.transactionId || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {pendingPayment?.manualConfirmationStatus === 'PENDING_CONFIRMATION' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPayment({
                                                                        ...pendingPayment,
                                                                        type: 'confirm_received',
                                                                        loanId: loan.id,
                                                                        paymentId: pendingPayment?.id,
                                                                        borrowerName: loan.borrower.fullName,
                                                                        amount: pendingPayment?.amount || loan.totalPayable,
                                                                        paymentMethod: pendingPayment?.method || 'Manual',
                                                                        role: 'LENDER'
                                                                    });
                                                                    setShowManualPaymentModal(true);
                                                                }}
                                                                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center"
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Confirm Payment Received
                                                            </button>
                                                        )}

                                                        {pendingPayment?.manualConfirmationStatus === 'PENDING_UPLOAD' && (
                                                            <div className="bg-blue-100 text-blue-800 px-5 py-2 rounded-lg flex items-center text-sm font-medium">
                                                                <Clock className="w-4 h-4 mr-2" />
                                                                Waiting for borrower to upload payment proof
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => setShowLoanDetails(loan)}
                                                            className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium flex items-center"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {activeLoans.length ? (
                                activeLoans.map((loan) => (
                                    <div key={loan.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <h3 className="font-semibold text-fern_green-500 text-lg">Loan to {loan.borrower.fullName}</h3>
                                                <p className="text-sm text-fern_green-400">{loan.borrower.email}</p>
                                                {/* Show funding status for manual payments */}
                                                {loan.payments && loan.payments.some(p =>
                                                    p.payerRole === 'LENDER' &&
                                                    p.receiverRole === 'BORROWER' &&
                                                    p.manualConfirmationStatus === 'PENDING_UPLOAD'
                                                ) && (
                                                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Upload Payment Proof Required
                                                        </div>
                                                    )}
                                                {loan.payments && loan.payments.some(p =>
                                                    p.payerRole === 'LENDER' &&
                                                    p.receiverRole === 'BORROWER' &&
                                                    p.manualConfirmationStatus === 'PENDING_CONFIRMATION' &&
                                                    !p.lenderConfirmed
                                                ) && (
                                                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                                            Confirmation Required
                                                        </div>
                                                    )}
                                                {loan.status === 'ACTIVE' && (
                                                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Borrower Confirmed Receipt
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${LoanHealthColors[loan.health]}`}>
                                                {LoanHealthIcons[loan.health]} {loan.health}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
                                            <div>
                                                <p className="text-sm text-fern_green-400">Amount</p>
                                                <p className="font-semibold text-text-mantis-100">${loan.amount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-fern_green-400">Total Due</p>
                                                <p className="font-semibold text-text-mantis-100">${loan.totalPayable.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-fern_green-400">Due Date</p>
                                                <p className="font-semibold text-text-mantis-100">{new Date(loan.paybackDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-fern_green-400">Health</p>
                                                <p className="font-semibold text-text-mantis-100">{loan.health}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowLoanDetails(loan)}
                                                className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium flex items-center">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleSendNotification(loan, loan.health !== 'GOOD' ? 'PAYMENT_OVERDUE' : 'LOAN_APPROVED')}
                                                className="bg-fern_green-300 text-white px-5 py-2 rounded-lg hover:bg-fern_green-400 transition-all duration-200 shadow-sm font-medium flex items-center">
                                                <Bell className="w-4 h-4 mr-2" />
                                                Notify
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No active loans found.</p>
                            )}
                            <LoanDetailsModal
                                loan={showLoanDetails}
                                lenderDetails={userDetails}
                                onClose={() => setShowLoanDetails(null)}
                            />
                        </div>
                    )}



                    {activeSection === "borrowers" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Borrower Relationships</h2>
                            {relationships.length ? (
                                relationships.map((relationship) => {
                                    const borrowerLoans = loans.filter((loan) => loan.borrowerId === relationship.borrowerId)
                                    return (
                                        <div key={relationship.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-fern_green-300 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl">
                                                        {relationship.borrower.fullName[0]}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-fern_green-500 text-lg">{relationship.borrower.fullName}</h3>
                                                        <p className="text-sm text-fern_green-400">{relationship.borrower.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${relationship.status === "CONFIRMED"
                                                    ? "bg-celadon-900 text-fern_green-500 border border-celadon-400"
                                                    : relationship.status === "PENDING"
                                                        ? "bg-mantis-900 text-mantis-400 border border-mantis-400"
                                                        : "bg-fern_green-100 bg-opacity-10 text-fern_green-300 border border-fern_green-200"
                                                    }`}>
                                                    {relationship.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
                                                <div>
                                                    <p className="text-sm text-fern_green-400">Total Loans</p>
                                                    <p className="font-semibold text-text-mantis-100">{borrowerLoans.length}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-fern_green-400">Status</p>
                                                    <p className="font-semibold text-text-mantis-100">{relationship.status}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {relationship.status === "CONFIRMED" && (
                                                    <button
                                                        onClick={() => handleRelationshipAction(relationship.id, "block")}
                                                        className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium"
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                                {relationship.status === "BLOCKED" && (
                                                    <button
                                                        onClick={() => handleRelationshipAction(relationship.id, "confirm")}
                                                        className="bg-fern_green-300 text-white px-5 py-2 rounded-lg hover:bg-fern_green-400 transition-all duration-200 shadow-sm font-medium"
                                                    >
                                                        Unblock
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No borrower relationships found.</p>
                            )}
                        </div>
                    )}

                    {activeSection === "loan-terms" && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white border-b border-celadon-300 pb-2 drop-shadow">Lending Terms & Settings</h2>
                                <button
                                    onClick={() => setShowCreateTermModal(true)}
                                    className="bg-gradient-to-r from-fern_green-500 to-mantis-500 text-white px-8 py-4 rounded-xl shadow-xl hover:from-fern_green-400 hover:to-mantis-400 transition-all duration-300 font-medium flex items-center transform hover:scale-105 hover:shadow-2xl"
                                >
                                    <Plus className="w-5 h-5 mr-2 drop-shadow" />
                                    Create New Terms
                                </button>
                            </div>

                            {lenderTerms.length > 0 ? (
                                lenderTerms.map((term) => (
                                    <div key={term.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                                            <div className="bg-nyanza-700 p-3 rounded-lg">
                                                <p className="text-sm text-fern_green-400">Max Loan Amount</p>
                                                <p className="text-lg font-semibold text-text-mantis-100">${term.maxLoanAmount}</p>
                                            </div>
                                            <div className="bg-nyanza-700 p-3 rounded-lg">
                                                <p className="text-sm text-fern_green-400">Loan Multiple</p>
                                                <p className="text-lg font-semibold text-text-mantis-100">{term.loanMultiple}</p>
                                            </div>
                                            <div className="bg-nyanza-700 p-3 rounded-lg">
                                                <p className="text-sm text-fern_green-400">Max Payback Days</p>
                                                <p className="text-lg font-semibold text-text-mantis-100">{term.maxPaybackDays} days</p>
                                            </div>
                                            <div className="bg-nyanza-700 p-3 rounded-lg">
                                                <p className="text-sm text-fern_green-400">Multiple Loans</p>
                                                <p className="text-lg font-semibold text-text-mantis-100">{term.allowMultipleLoans ? "Yes" : "No"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 mb-4">
                                            <div className="bg-nyanza-700 p-3 rounded-lg">
                                                <p className="text-sm text-fern_green-400">Fee (&lt;7 days)</p>
                                                <p className="text-lg font-semibold text-text-mantis-100">${term.feePer10Short}/$10</p>
                                            </div>
                                            <div className="bg-nyanza-700 p-3 rounded-lg">
                                                <p className="text-sm text-fern_green-400">Fee (&gt;7 days)</p>
                                                <p className="text-lg font-semibold text-text-mantis-100">${term.feePer10Long}/$10</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedTerm(term);
                                                    setShowEditTermModal(true);
                                                }}
                                                className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium flex items-center">
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Terms
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedTerm(term);
                                                    setShowPreferredPaymentModal(true);
                                                }}
                                                className="bg-mantis-800 text-mantis-300 px-5 py-2 rounded-lg hover:bg-mantis-700 transition-all duration-200 font-medium flex items-center">
                                                <Settings className="w-4 h-4 mr-2" />
                                                Payment Preferences
                                            </button>
                                            <div className="text-md text-fern_green-400">
                                                Invite Token: {term.inviteToken && term.inviteToken.length > 0 ? (
                                                    <span className="font-medium text-sm cursor-pointer hover:underline"
                                                        onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_FRONTEND_URL}/signup/${term.inviteToken}`)}
                                                        on
                                                    >
                                                        <div className="cursor-pointer p-2 border rounded bg-fern_green-300 text-white hover:bg-fern_green-400 transition-all duration-200">Copy Invite Link</div>
                                                    </span>
                                                ) : "No invite token available"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-celadon-900 p-8 rounded-xl text-center border border-celadon-400">
                                    <p className="text-fern_green-300 mb-4">No lending terms created yet.</p>
                                    <button
                                        onClick={() => setShowCreateTermModal(true)}
                                        className="bg-fern_green-300 text-white px-6 py-3 rounded-xl shadow-md hover:bg-fern_green-400 transition-all duration-300 font-medium"
                                    >
                                        Create Your First Terms
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Create Term Modal */}
            < CreateTermModal
                isOpen={showCreateTermModal}
                onClose={() => setShowCreateTermModal(false)}
                onTermCreated={handleTermCreated}
            />

            {/* Edit Term Modal */}
            {
                selectedTerm && (
                    <EditTermModal
                        isOpen={showEditTermModal}
                        onClose={() => {
                            setShowEditTermModal(false);
                            setSelectedTerm(null);
                        }}
                        onTermUpdated={handleTermUpdated}
                        term={selectedTerm}
                    />
                )
            }

            {/* Funding Modal */}
            {showFundingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Fund Loan</h3>
                            <button
                                onClick={() => setShowFundingModal(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Loan Details:</p>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium">Amount: ${showFundingModal.amount.toFixed(2)}</p>
                                <p className="text-sm text-gray-600">To: {showFundingModal.borrower.fullName}</p>
                                <p className="text-sm text-gray-600">Email: {showFundingModal.borrower.email}</p>
                                <p className="text-sm text-gray-600">{showFundingModal.agreedPaymentMethod}: {paymentId}</p>

                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                            </label>
                            {/* <PaymentMethodSelector
                                selectedMethod={selectedPaymentMethod}
                                onMethodSelect={setSelectedPaymentMethod}
                                disabled={fundingLoading === showFundingModal.id}
                            /> */}

                            {paymentMethods.map((method) => (
                                method.id == showFundingModal.agreedPaymentMethod ?
                                    <button
                                        key={method.id}
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
                                    </button> : ""
                            ))}

                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFundingModal(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleFundLoan(showFundingModal)}
                                disabled={!selectedPaymentMethod || fundingLoading === showFundingModal.id}
                                className="flex-1 px-4 py-2 bg-fern_green-300 text-white rounded-lg hover:bg-fern_green-400 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {fundingLoading === showFundingModal.id ? 'Processing...' : 'Fund Loan'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Stripe Payment Modal */}
            {
                stripePaymentData && (
                    <StripePaymentModal
                        isOpen={showStripeModal}
                        onClose={() => {
                            setShowStripeModal(false);
                            setStripePaymentData(null);
                            setFundingLoading(null);
                        }}
                        amount={stripePaymentData.amount}
                        loanId={stripePaymentData.loanId}
                        payerRole={stripePaymentData.payerRole}
                        receiverRole={stripePaymentData.receiverRole}
                        onPaymentSuccess={handleStripePaymentSuccess}
                        onPaymentError={handleStripePaymentError}
                    />
                )
            }

            {/* CashApp Account Management Modal */}
            {
                showPaymentAccountModal && (
                    <PaymentAccountModal
                        isOpen={showPaymentAccountModal}
                        onClose={() => setShowPaymentAccountModal(false)}
                    />
                )
            }

            {/* Preferred Payment Methods Modal */}
            {
                selectedTerm && (
                    <PreferredPaymentMethodsModal
                        isOpen={showPreferredPaymentModal}
                        onClose={() => {
                            setShowPreferredPaymentModal(false);
                            setSelectedTerm(null);
                        }}
                        lenderTerm={selectedTerm}
                        onUpdate={(updatedTerm) => {
                            setLenderTerms(prev => prev.map(term =>
                                term.id === updatedTerm.id ? updatedTerm : term
                            ));
                            setSelectedTerm(updatedTerm);
                        }}
                    />
                )
            }

            {/* Manual Payment Confirmation Modal */}
            {
                selectedPayment && (
                    <ManualPaymentConfirmationModal
                        isOpen={showManualPaymentModal}
                        onClose={() => {
                            setShowManualPaymentModal(false);
                            setSelectedPayment(null);
                        }}
                        payment={selectedPayment}
                        userRole="LENDER"
                        onUpdate={() => {
                            // Refresh loans to get updated payment status
                            window.location.reload();
                        }}
                    />
                )
            }
        </div >
    )
}

// Sidebar Button Component
// eslint-disable-next-line no-unused-vars
function SidebarBtn({ icon: Icon, label, section, activeSection, setActiveSection }) {
    return (
        <button
            onClick={() => setActiveSection(section)}
            className={`w-full text-left px-6 py-4 rounded-xl flex items-center transition-all duration-300 transform hover:scale-105 ${activeSection === section
                ? "bg-gradient-to-r from-fern_green-400 to-mantis-200 text-white shadow-xl"
                : "text-white hover:bg-gradient-to-r hover:from-celadon-700 hover:to-fern_green-600 hover:text-white shadow-lg"
                }`}
        >
            <Icon className={`inline w-5 h-5 mr-3 ${activeSection === section ? "text-white drop-shadow" : "text-celadon-300"}`} />
            <span className="font-medium">{label}</span>
        </button>
    )
}

// Stats Card
// eslint-disable-next-line no-unused-vars
function StatCard({ icon: Icon, label, value, color, subtitle }) {
    const isOverdue = color === "text-red-500";
    return (
        <div className={`${isOverdue ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 animate-pulse' : 'bg-gradient-to-br from-white via-celadon-900 to-nyanza-900 border-celadon-300'} rounded-2xl shadow-xl p-6 flex items-center hover:shadow-2xl transition-all duration-300 hover:border-celadon-400 transform hover:scale-105 backdrop-blur-sm`}>
            <div className={`p-4 rounded-full ${isOverdue ? 'bg-gradient-to-r from-red-200 to-red-300' : 'bg-gradient-to-r from-fern_green-500 to-mantis-500'} shadow-lg`}>
                <Icon className={`w-8 h-8 ${isOverdue ? 'text-red-600' : 'text-white'} drop-shadow`} />
            </div>
            <div className="ml-4">
                <p className={`text-sm font-semibold ${isOverdue ? 'text-red-700' : 'text-fern_green-400'} mb-1`}>{label}</p>
                <p className={`text-2xl font-bold ${isOverdue ? 'text-red-800' : 'text-fern_green-400'}`}>{value}</p>
                {subtitle && <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-fern_green-300'}`}>{subtitle}</p>}
            </div>
        </div>
    )
}

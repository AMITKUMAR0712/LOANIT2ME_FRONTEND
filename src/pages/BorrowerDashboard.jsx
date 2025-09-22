import React, { useState, useEffect } from "react"
import {
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Plus,
    CreditCard,
    User,
    History,
    Home,
    ShieldCheck,
    User2,
    Bell,
    Eye,
    Smartphone,
    Wallet
} from "lucide-react"
import { fetchBorrowerLoans, fetchBorrowerRelationships, fetchNotifications, logout, markNotificationAsRead, me, processPayment, confirmPayPalPayment, uploadPaymentScreenshot, confirmManualPayment, getPaymentId, getPrefferedPaymentId } from "../lib/api"
import LoanApplicationForm from "../components/LoanApplicationForm"
import { XCircle as XCircleIcon } from "lucide-react"
import BorrowerLoanDetailsModal from "@/components/BorrowerLoanDetailsModal"
import PaymentAccountModal from "../components/PaymentAccountModal.jsx";
import ManualPaymentConfirmationModal from "../components/ManualPaymentConfirmationModal";
import PaymentMethodSelector from "@/components/PaymentMethodSelector"
import StripePaymentModal from "@/components/StripePaymentModal"
import { Link } from "react-router-dom"
import { PendingLoansSection } from "@/components/borrower/PendingLoansSection"
import { NotificationHistorySection } from "@/components/borrower/NotificationHistorySection"

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

export default function BorrowerDashboard() {
    const [showProfile, setShowProfile] = useState(false)
    const [userDetails, setUserDetails] = useState({})
    const [loans, setLoans] = useState([])
    const [lenders, setLenders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState("overview")
    const [showLoanRequestForm, setShowLoanRequestForm] = useState(false)
    const [selectedLender, setSelectedLender] = useState(null)
    const [selectedLenderTerm, setSelectedLenderTerm] = useState(null)
    const [selectedLenderForDetails, setSelectedLenderForDetails] = useState(null)

    const [notifications, setNotifications] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [showPaymentAccountModal, setShowPaymentAccountModal] = useState(false)

    // const [showLenderTerms, setShowLenderTerms] = useState(false)
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

                        alert("Payment processed successfully via PayPal!");

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
            const [UserDetails, loansRes, relationshipsRes, notificationsRes] = await Promise.all([
                me(),
                fetchBorrowerLoans(),
                fetchBorrowerRelationships(),
                fetchNotifications(),

            ])
            setUserDetails(UserDetails || {})
            setLoans(loansRes.loans || [])
            setNotifications(notificationsRes.notifications || [])
            // console.log(notificationsRes.notifications);

            // Convert relationships to lenders format for display using real lender terms (first term)
            const lendersData = (relationshipsRes.relationships || []).map(rel => {
                const firstTerm = (rel.lender.lenderTerms || [])[0] || null
                return {
                    id: rel.lender.id,
                    fullName: rel.lender.fullName,
                    email: rel.lender.email,
                    phoneNumber: rel.lender.phoneNumber,
                    role: rel.lender.role,
                    lenderTermId: firstTerm?.id || null,
                    lenderTerms: rel.lender.lenderTerms.map(term => ({
                        id: term.id,
                        maxLoanAmount: term.maxLoanAmount,
                        loanMultiple: term.loanMultiple,
                        maxPaybackDays: term.maxPaybackDays,
                        feePer10Short: term.feePer10Short,
                        feePer10Long: term.feePer10Long,
                        allowMultipleLoans: term.allowMultipleLoans,
                        preferredPaymentMethods: term.preferredPaymentMethods,
                    }))
                }
            })
            setLenders(lendersData)
            // console.log("Fetched lenders:", lendersData);

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId)
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, isRead: true } : notif
                )
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    const activeLoans = loans.filter(l => l.status === "FUNDED" || l.status === "ACTIVE")
    const overdueLoans = loans.filter(l => l.status === "OVERDUE")
    const completedLoans = loans.filter(l => l.status === "COMPLETED")
    const pendingLoans = loans.filter(l => l.status === "PENDING")
    const totalBorrowed = [...activeLoans, ...overdueLoans, ...completedLoans].reduce((sum, l) => sum + l.amount, 0)
    const totalOutstanding = [...activeLoans, ...overdueLoans].reduce((sum, l) => sum + l.totalPayable, 0)        //active and overdue loans


    // State: one selected method per term
    const [selectedMethods, setSelectedMethods] = useState({});

    const [borrowerPaymentAccounts, setBorrowerPaymentAccounts] = useState({})
    const [borrowerPaymentMethods, setBorrowerPaymentMethods] = useState({})

    const handleMethodToggle = async (termId, method) => {
        setSelectedMethods(() => ({
            [termId]: method,
        }));

        try {
            const res = await getPaymentId({ paymentMethod: method });

            if (res.success) {
                setBorrowerPaymentAccounts(() => ({
                    [termId]: res.data.id,
                }));
            } else {
                setBorrowerPaymentAccounts({});
            }
        } catch {
            alert(`Kindly add ${method} payment method`);
            setBorrowerPaymentAccounts({});
        }

        setBorrowerPaymentMethods(() => ({
            [termId]: method,
        }));
    };

    // console.log(borrowerPaymentAccounts)
    // console.log(borrowerPaymentMethods)


    // console.log(selectedMethods);

    // const paymentMethods = [
    //     { value: 'CASHAPP', label: 'CashApp', icon: '💸' },
    //     { value: 'PAYPAL', label: 'PayPal', icon: '💳' },
    //     { value: 'ZELLE', label: 'Zelle', icon: '🏦' },
    //     { value: 'INTERNAL_WALLET', label: 'Internal Wallet', icon: '💰' }
    // ];



    if (loading) return <div className="flex justify-center items-center h-screen bg-nyanza-900 text-fern_green-500 font-semibold">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-fern_green-300 border-t-fern_green-500 rounded-full animate-spin mb-4"></div>
            Loading...
        </div>
    </div>

    return (
        <div className=" font-noto-serif-jp min-h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900">
            {/* Header */}
            <header className="flex items-center justify-between h-[10vh] w-full bg-gradient-to-r from-fern_green-800 to-fern_green-400 text-white shadow-xl p-6 fixed top-0 left-0 right-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    {/* <ShieldCheck className="w-8 h-8 text-blue-600" /> */}
                    <img src="/logo.svg" alt="logo" className="w-[7rem] h-[7rem] drop-shadow-lg" />
                    {/* <h2 className="text-2xl font-bold">LoanIT2Me</h2> */}
                    <h2 className="text-xl font-bold text-fern_green-200 drop-shadow-md">Borrower Dashboard</h2>
                    {/* <span className="text-sm text-fern_green-500 font-medium">Secured by LoanShield™</span> */}
                </div>


                <div className="flex items-center justify-center gap-4">

                    {/* notifications */}
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications),
                                setShowProfile(false)
                        }}
                        className="bg-gradient-to-r from-mantis-500 to-celadon-500 text-white p-3 rounded-xl hover:from-mantis-400 hover:to-celadon-400 transition-all duration-300 relative shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Bell className="w-6 h-6 drop-shadow" />
                        {notifications.filter(n => !n.isRead).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-destructive to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                                {notifications.filter(n => !n.isRead).length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-gradient-to-b from-white to-nyanza-900 top-full rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto border border-celadon-300 backdrop-blur-sm">
                            <div className="p-4 border-b border-celadon-200 bg-gradient-to-r from-celadon-800 to-fern_green-700">
                                <h3 className="font-semibold text-white drop-shadow">Notifications</h3>
                            </div>
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No notifications</div>
                            ) :

                                (<div>
                                    {notifications.map(notification => (
                                        notification.isRead === false && <div
                                            key={notification.id}
                                            className={`p-3 border-b hover:bg-nyanza-900 transition-all duration-200 ${notification.isRead ? 'opacity-60' : 'bg-celadon-50'}`}
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium text-fern_green-400">{notification.message}</p>
                                                <span className="text-xs text-mantis-400">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                )}
                        </div>
                    )}

                    {/* user popup */}
                    <button onClick={() => {
                        setShowProfile(!showProfile),
                            setShowNotifications(false)
                    }}
                        className="bg-gradient-to-r from-fern_green-500 to-fern_green-600 text-white px-6 py-3 rounded-xl hover:from-fern_green-400 hover:to-fern_green-500 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                        {userDetails?.fullName}
                    </button>
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
            </header>

            {/* Main Content */}
            <div className="flex min-h-[90vh] bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900"
                onClick={() => {
                    setShowProfile(false),
                        setShowNotifications(false)
                }}
            >
                {/* Sidebar */}
                <aside className="w-[20%] bg-gradient-to-b from-fern_green-800 to-fern_green-500 shadow-2xl p-6 fixed top-[10vh] left-0 bottom-0 border-r border-celadon-600 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white mb-6 drop-shadow">Borrower Navigation</h2>
                    <nav className="space-y-3 text-md">
                        <SidebarBtn icon={Home} label="Overview" section="overview" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={Clock} label="Current Loans" section="current" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={AlertTriangle} label="Pending Loans" section="pending" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={History} label="Loan History" section="history" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={Bell} label="Notifications" section="notifications" activeSection={activeSection} setActiveSection={setActiveSection} />
                        <SidebarBtn icon={User} label="Available Lenders" section="lenders" activeSection={activeSection} setActiveSection={setActiveSection} />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 ml-[20%] mt-[10vh] min-h-[90vh]">
                    {/* Overview */}
                    {activeSection === "overview" && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <StatCard icon={DollarSign} label="Total Borrowed" value={`$${totalBorrowed.toFixed(2)}`} color="text-nyanza-200" />
                                <StatCard icon={User} label="Available Lenders" value={lenders.length} color="text-nyanza-200" />
                                <StatCard icon={AlertTriangle} label="Total Outstanding" value={`$${totalOutstanding.toFixed(2)}`} color="text-nyanza-200" />
                                <StatCard icon={Clock} label="Active Loans" value={activeLoans.length} color=" text-nyanza-200" />
                            </div>
                            {overdueLoans.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <StatCard icon={XCircle} label="Overdue Loans" value={overdueLoans.length} color="text-red-500" />
                                    <StatCard icon={AlertTriangle} label="Overdue Amount" value={`$${overdueLoans.reduce((sum, l) => sum + l.totalPayable, 0).toFixed(2)}`} color="text-red-500" />
                                </div>
                            )}
                            <div className="bg-gradient-to-r from-white via-nyanza-900 to-celadon-900 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between border border-celadon-300 backdrop-blur-sm">
                                <div>
                                    <h3 className="text-2xl font-semibold mb-2 text-fern_green-500 drop-shadow">Welcome back, {userDetails?.fullName} </h3>
                                    <p className="text-fern_green-400 font-medium">
                                        You currently have <span className="font-semibold text-mantis-300">{activeLoans.length}</span> active loan
                                        {activeLoans.length !== 1 && "s"}{overdueLoans.length > 0 && <span className="text-red-500">, <span className="font-semibold">{overdueLoans.length}</span> overdue loan{overdueLoans.length !== 1 && "s"}</span>} and
                                        <span className="font-semibold text-mantis-300"> ${totalOutstanding.toFixed(2)}</span> outstanding.
                                    </p>
                                    <p className="text-fern_green-300 text-sm mt-2">
                                        Explore lenders, request new loans, and keep track of your repayment history.
                                    </p>
                                </div>

                                <div className="mt-4 md:mt-0">
                                    <button
                                        onClick={() => setActiveSection("lenders")}
                                        className="px-8 py-4 bg-gradient-to-r from-fern_green-500 to-mantis-500 text-white rounded-2xl shadow-xl hover:from-fern_green-400 hover:to-mantis-400 transition-all duration-300 font-medium flex items-center transform hover:scale-105 hover:shadow-2xl">
                                        <Plus className="w-5 h-5 mr-2 drop-shadow" /> Request New Loan
                                    </button>
                                </div>
                            </div>

                            {(pendingLoans.length > 0 || overdueLoans.length > 0) && (
                                <div className="mt-6 space-y-4">
                                    {pendingLoans.length > 0 && (
                                        <div className="p-5 bg-celadon-900 bg-opacity-10 border border-celadon-300 rounded-xl shadow-sm">
                                            <p className="text-fern_green-500 text-sm font-medium flex items-center">
                                                <Clock className="w-5 h-5 mr-2 text-mantis-400" />
                                                You have {pendingLoans.length} pending loan request
                                                {pendingLoans.length > 1 ? "s" : ""} awaiting lender approval.
                                            </p>
                                        </div>
                                    )}
                                    {overdueLoans.length > 0 && (
                                        <div className="p-5 bg-red-100 bg-opacity-20 border border-red-300 rounded-xl shadow-sm">
                                            <p className="text-red-600 text-sm font-medium flex items-center">
                                                <XCircle className="w-5 h-5 mr-2 text-red-500" />
                                                <span className="font-bold">URGENT:</span> You have {overdueLoans.length} overdue loan
                                                {overdueLoans.length > 1 ? "s" : ""} requiring immediate payment!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Current Loans */}
                    {activeSection === "current" && (
                        <SectionLoans loans={[...activeLoans, ...overdueLoans]} title="Current Loans" />
                    )}

                    {/* Pending Loans */}
                    {activeSection === "pending" && (
                        <PendingLoansSection
                            loans={pendingLoans}
                            onNavigateToLenders={() => setActiveSection("lenders")}
                        />
                    )}

                    {/* Loan History */}
                    {activeSection === "history" && (
                        <SectionLoans loans={completedLoans} title="Loan History" isHistory />
                    )}

                    {/* Notifications */}
                    {activeSection === "notifications" && (
                        <NotificationHistorySection notifications={notifications} onMarkAsRead={handleMarkAsRead} />
                    )}

                    {/* Available Lenders */}
                    {activeSection === "lenders" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-white drop-shadow">Available Lenders</h2>
                                {selectedLenderForDetails && (
                                    <button
                                        onClick={() => setSelectedLenderForDetails(null)}
                                        className="px-6 py-3 bg-gradient-to-r from-celadon-600 to-fern_green-600 text-white rounded-xl hover:from-celadon-500 hover:to-fern_green-500 transition-all duration-300 font-medium shadow-lg transform hover:scale-105"
                                    >
                                        ← Back to Lender List
                                    </button>
                                )}
                            </div>

                            {!selectedLenderForDetails ? (
                                /* Lender List View */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {lenders.map(lender => (
                                        <div
                                            key={lender.id}
                                            className="bg-gradient-to-br from-white via-celadon-900 to-nyanza-900 p-6 rounded-2xl shadow-xl border border-celadon-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer backdrop-blur-sm"
                                            onClick={() => setSelectedLenderForDetails(lender)}
                                        >
                                            {/* {console.log(lender)} */}
                                            <div className="flex flex-col items-center text-center">
                                                <div className="bg-gradient-to-r from-fern_green-500 to-mantis-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mb-4">
                                                    {lender.fullName[0]}
                                                </div>
                                                <h3 className="font-bold text-fern_green-600 text-xl mb-2">{lender.fullName}</h3>
                                                <p className="text-sm text-fern_green-400 mb-2">{lender.email}</p>
                                                {lender.phoneNumber && (
                                                    <p className="text-xs text-fern_green-300 mb-4">{lender.phoneNumber}</p>
                                                )}
                                                <div className="bg-gradient-to-r from-mantis-200 to-celadon-200 text-white px-4 py-2 rounded-full text-sm shadow">
                                                    {lender.lenderTerms?.length || 0} Lending Option{lender.lenderTerms?.length !== 1 ? 's' : ''} Available
                                                </div>
                                                <div className="mt-4 text-sm text-fern_green-500 font-medium">
                                                    Click to view lending terms →
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Lender Details View */
                                <div className="bg-gradient-to-br from-white via-celadon-900 to-nyanza-900 p-8 rounded-2xl shadow-2xl border border-celadon-300 backdrop-blur-sm">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="bg-gradient-to-r from-fern_green-500 to-mantis-500 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                                            {selectedLenderForDetails.fullName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-fern_green-600 text-3xl mb-2">{selectedLenderForDetails.fullName}</h3>
                                            <p className="text-fern_green-400 text-lg mb-1">{selectedLenderForDetails.email}</p>
                                            {selectedLenderForDetails.phoneNumber && (
                                                <p className="text-fern_green-300">{selectedLenderForDetails.phoneNumber}</p>
                                            )}
                                        </div>
                                    </div>

                                    {selectedLenderForDetails.lenderTerms && selectedLenderForDetails.lenderTerms.length > 0 ? (
                                        <div>
                                            <h4 className="font-bold text-2xl text-white mb-6 drop-shadow">Available Lending Terms:</h4>
                                            <div className="space-y-6">
                                                {selectedLenderForDetails.lenderTerms.map((term, index) => (
                                                    <div key={index} className="border border-celadon-400 p-6 rounded-2xl bg-gradient-to-r from-nyanza-900 to-celadon-900 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                                                        {/* {console.log(selectedLenderForDetails.lenderTerms)} */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                            <div className="bg-gradient-to-r from-white to-celadon-900 p-4 rounded-xl shadow-lg">
                                                                <p className="text-fern_green-400 text-sm font-medium mb-1">Maximum Loan Amount</p>
                                                                <p className="font-bold text-fern_green-600 text-2xl">${term.maxLoanAmount}</p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-white to-celadon-900 p-4 rounded-xl shadow-lg">
                                                                <p className="text-fern_green-400 text-sm font-medium mb-1">Payback Period</p>
                                                                <p className="font-bold text-fern_green-600 text-2xl">{term.maxPaybackDays} days</p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-white to-celadon-900 p-4 rounded-xl shadow-lg">
                                                                <p className="text-fern_green-400 text-sm font-medium mb-1">Loan Multiple</p>
                                                                <p className="font-bold text-fern_green-600 text-2xl">{term.loanMultiple}x</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                            <div className="bg-gradient-to-r from-white to-celadon-900 p-4 rounded-xl shadow-lg">
                                                                <p className="text-fern_green-400 text-sm font-medium mb-1">Fee (Short Term)</p>
                                                                <p className="font-bold text-fern_green-600 text-xl">${term.feePer10Short} per $10</p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-white to-celadon-900 p-4 rounded-xl shadow-lg">
                                                                <p className="text-fern_green-400 text-sm font-medium mb-1">Fee (Long Term)</p>
                                                                <p className="font-bold text-fern_green-600 text-xl">${term.feePer10Long} per $10</p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-white to-celadon-900 p-4 rounded-xl shadow-lg">
                                                                <p className="text-fern_green-400 text-sm font-medium mb-1">Multiple Loans Policy</p>
                                                                <p className="font-bold text-fern_green-600 text-lg flex items-center">
                                                                    {term.allowMultipleLoans ? (
                                                                        <><CheckCircle className="w-6 h-6 mr-2 text-mantis-500" /> Allowed</>
                                                                    ) : (
                                                                        <><XCircle className="w-6 h-6 mr-2 text-red-500" /> Not Allowed</>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-white to-celadon-900 p-4 rounded-xl shadow-lg">
                                                                {/* {console.log(JSON.parse(term.preferredPaymentMethods))} */}
                                                                <p className="text-fern_green-400 text-sm font-medium mb-1">Preference Method</p>
                                                                <p className="font-bold text-fern_green-600 text-xl">{term.preferredPaymentMethods}</p>
                                                                {JSON.parse(term.preferredPaymentMethods).map((method) => (
                                                                    <label
                                                                        key={method}
                                                                        className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-fern_green/50 cursor-pointer transition-all duration-200 hover:bg-fern_green/5"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedMethods[term.id] === method}
                                                                            onChange={() => handleMethodToggle(term.id, method)}
                                                                            className="w-4 h-4 text-fern_green focus:ring-fern_green border-gray-300 rounded"
                                                                        />
                                                                        {/* <span className="text-2xl ml-3">{method}</span> */}
                                                                        <span className="ml-3 font-medium text-gray-700">{method}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end">
                                                            {/* {borrowerPaymentAccountId && borrowerPaymentMethod && */}
                                                            {borrowerPaymentAccounts[term.id] && borrowerPaymentMethods[term.id] &&
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedLender(selectedLenderForDetails);
                                                                        setShowLoanRequestForm(true);
                                                                        setSelectedLenderTerm(term);
                                                                    }}
                                                                    className="bg-gradient-to-r from-fern_green-500 to-mantis-500 text-white px-8 py-4 rounded-xl hover:from-fern_green-400 hover:to-mantis-400 transition-all duration-300 shadow-xl font-bold text-lg flex items-center transform hover:scale-105 hover:shadow-2xl"
                                                                >
                                                                    <Plus className="w-6 h-6 mr-2 drop-shadow" /> Request Loan with These Terms
                                                                </button>
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-xl p-6">
                                                <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                                                <p className="text-yellow-800 font-medium">This lender hasn't set up any lending terms yet.</p>
                                                <p className="text-yellow-700 text-sm mt-2">Please contact them directly or check back later.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Loan Application Form */}
            {showLoanRequestForm && borrowerPaymentAccounts[selectedLenderTerm.id] && borrowerPaymentMethods[selectedLenderTerm.id] && selectedLender && selectedLenderTerm && (
                <div className="fixed inset-0 bg-gradient-to-br from-fern_green-900/80 to-celadon-900/80 flex items-center justify-center z-50 overflow-auto backdrop-blur-lg">
                    <div className="bg-gradient-to-br from-white to-nyanza-900 rounded-2xl w-full h-full max-w-5xl shadow-2xl border border-celadon-300 backdrop-blur-sm">
                        <div className="flex justify-between items-center p-8 border-b border-celadon-300 bg-gradient-to-r from-celadon-800 to-fern_green-700">
                            <h2 className="text-2xl font-semibold text-white drop-shadow">Request Loan from {selectedLender.fullName}</h2>
                            <button
                                onClick={() => {
                                    setShowLoanRequestForm(false);
                                    setSelectedLender(null);
                                    setSelectedLenderTerm(null);
                                }}
                                className="text-white hover:text-celadon-200 transition-colors duration-300 p-2 rounded-full hover:bg-white/20"
                            >
                                <XCircle className="w-8 h-8 drop-shadow" />
                            </button>
                        </div>
                        <LoanApplicationForm
                            lender={selectedLender}
                            lenderTerm={selectedLenderTerm}
                            paymentAccountId={borrowerPaymentAccounts[selectedLenderTerm.id]}
                            paymentMethod={borrowerPaymentMethods[selectedLenderTerm.id]}
                            onLoanRequested={() => {
                                // Refresh loans data after successful request
                                fetchData();
                                // Close the form
                                setShowLoanRequestForm(false);
                                setSelectedLender(null);
                                setSelectedLenderTerm(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* CashApp Account Management Modal */}
            {showPaymentAccountModal && (
                <PaymentAccountModal
                    isOpen={showPaymentAccountModal}
                    onClose={() => setShowPaymentAccountModal(false)}
                />
            )}
        </div>
    )

}

// Stats Card
// eslint-disable-next-line no-unused-vars
function StatCard({ icon: Icon, label, value, color }) {
    const isOverdue = color === "text-red-500";
    return (
        <div className={`${isOverdue ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 animate-pulse' : 'bg-gradient-to-br from-white via-celadon-900 to-nyanza-900 border-celadon-300'} rounded-2xl shadow-xl p-6 flex items-center hover:shadow-2xl transition-all duration-300 hover:border-celadon-400 transform hover:scale-105 backdrop-blur-sm`}>
            <div className={`p-4 rounded-full ${isOverdue ? 'bg-gradient-to-r from-red-200 to-red-300' : 'bg-gradient-to-r from-fern_green-500 to-mantis-500'} shadow-lg`}>
                <Icon className={`w-8 h-8 ${isOverdue ? 'text-red-600' : 'text-white'} drop-shadow`} />
            </div>
            <div className="ml-4">
                <p className={`text-sm font-semibold ${isOverdue ? 'text-red-700' : 'text-fern_green-400'} mb-1`}>{label}</p>
                <p className={`text-2xl font-bold ${isOverdue ? 'text-red-800' : 'text-fern_green-400'} `}>{value}</p>
            </div>
        </div>
    )
}

// Section for Loans
function SectionLoans({ loans, title, isHistory }) {
    const [showLoanDetails, setShowLoanDetails] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASHAPP');
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [stripePaymentData, setStripePaymentData] = useState(null);
    const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentId, setPaymentId] = useState(null)


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



    const handlePayment = async (loan) => {
        try {
            setPaymentLoading(loan.id);

            // Calculate remaining amount to pay (only count confirmed payments)
            const totalConfirmedPaymentsBorrowerToLender = loan.payments
                ? loan.payments.reduce((sum, p) => p.confirmed && p.payerRole === 'BORROWER' && p.receiverRole === 'LENDER' ? sum + p.amount : sum, 0)
                : 0;
            const remainingAmount = loan.totalPayable - totalConfirmedPaymentsBorrowerToLender;

            // console.log(`Processing payment of $${remainingAmount} for loan ID: ${loan.id} via ${selectedPaymentMethod}`);

            if (remainingAmount <= 0) {
                alert("This loan has already been fully paid!");
                return;
            }

            // Handle manual payment methods (CashApp, Zelle)
            if (selectedPaymentMethod === 'CASHAPP' || selectedPaymentMethod === 'ZELLE') {
                // Create a manual payment entry
                const paymentResult = await processPayment({
                    loanId: loan.id,
                    amount: remainingAmount,
                    method: selectedPaymentMethod,
                    payerRole: "BORROWER",
                    receiverRole: "LENDER"
                });

                if (paymentResult.success) {
                    // Set the payment for manual confirmation
                    setSelectedPayment(paymentResult.payment);
                    setShowManualPaymentModal(true);
                    setShowPaymentModal(null);
                } else {
                    alert("Failed to create payment. Please try again.");
                }
                return;
            }

            // Handle PayPal with account setup message
            if (selectedPaymentMethod === 'PAYPAL') {
                // Show account setup message
                alert("Please ensure your PayPal account is properly configured in Payment Settings before proceeding.");

                const response = await processPayment({
                    loanId: loan.id,
                    amount: remainingAmount,
                    method: selectedPaymentMethod,
                    payerRole: "BORROWER",
                    receiverRole: "LENDER"
                });

                // Handle Zelle with account setup message  
                if (selectedPaymentMethod === 'ZELLE') {
                    alert("Please ensure your Zelle account information is updated in Payment Settings before proceeding.");
                }

                if (response.approvalUrl) {
                    // Store payment data for later confirmation
                    localStorage.setItem('pendingPayPalPayment', JSON.stringify({
                        dbPaymentId: response.id,
                        loanId: loan.id,
                        amount: remainingAmount
                    }));

                    // Redirect to PayPal
                    window.location.href = response.approvalUrl;
                    return;
                }
            }

            // Process payment for other methods (including internal wallet)
            const paymentResult = await processPayment({
                loanId: loan.id,
                amount: remainingAmount,
                method: selectedPaymentMethod,
                payerRole: "BORROWER",
                receiverRole: "LENDER"
            });

            // Handle internal wallet or other immediate completions
            if (selectedPaymentMethod === 'INTERNAL_WALLET' || paymentResult.confirmed) {
                alert("Payment processed successfully!");
            } else {
                alert("Payment initiated successfully!");
            }

            // Refresh the page or update the loan status
            window.location.reload();

        } catch (error) {
            console.error('Error processing payment:', error);
            alert("Failed to process payment. Please try again.");
        } finally {
            setPaymentLoading(null);
            setShowPaymentModal(null);
        }
    };

    const handleStripePaymentSuccess = async () => {
        alert("Payment processed successfully via CashApp!");

        // Refresh the page
        window.location.reload();

        setShowStripeModal(false);
        setStripePaymentData(null);
        setPaymentLoading(null);
    };

    const handleStripePaymentError = (error) => {
        console.error('Stripe payment error:', error);
        alert("Payment failed. Please try again.");
        setPaymentLoading(null);
    };

    const openPaymentModal = (loan) => {
        setShowPaymentModal(loan);
        setSelectedPaymentMethod(loan.agreedPaymentMethod); // Reset to default
        // console.log(loan.lender.id);

        const id = getPrefferedPaymentId(loan.lender.id, loan.agreedPaymentMethod)
        setPaymentId(id)
    };



    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">{title}</h2>

            {/* Manual Payment Confirmations for Borrowers */}
            {(() => {
                const pendingManualPayments = loans.filter(loan =>
                    loan.payments && loan.payments.some(payment =>
                        payment.payerRole === 'LENDER' &&
                        payment.receiverRole === 'BORROWER' &&
                        (payment.manualConfirmationStatus === 'PENDING_CONFIRMATION' ||
                            payment.manualConfirmationStatus === 'PENDING_UPLOAD') &&
                        (!payment.borrowerConfirmed || payment.manualConfirmationStatus === 'PENDING_UPLOAD')
                    )
                );

                return pendingManualPayments.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-yellow-300 mb-4">Manual Payments to Confirm</h3>
                        {pendingManualPayments.map((loan) => {
                            const pendingPayment = loan.payments.find(payment =>
                                payment.payerRole === 'LENDER' &&
                                payment.receiverRole === 'BORROWER' &&
                                (payment.manualConfirmationStatus === 'PENDING_CONFIRMATION' ||
                                    payment.manualConfirmationStatus === 'PENDING_UPLOAD') &&
                                (!payment.borrowerConfirmed || payment.manualConfirmationStatus === 'PENDING_UPLOAD')
                            );

                            return (
                                <div key={loan.id} className="bg-gradient-to-r from-yellow-900 to-orange-900 p-6 rounded-xl shadow-md mb-5 border border-yellow-600 hover:shadow-lg transition-all duration-300">
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <h3 className="font-semibold text-yellow-100 text-lg">Payment from {loan.lender.fullName}</h3>
                                            <p className="text-sm text-yellow-200">{loan.lender.email}</p>
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
                                        {(pendingPayment?.screenshotPath || pendingPayment?.confirmationScreenshot) && (
                                            <div>
                                                <p className="text-sm text-yellow-200">Proof Available</p>
                                                <p className="font-semibold text-yellow-100 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                    </svg>
                                                    Screenshot
                                                </p>
                                            </div>
                                        )}
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
                                                        lenderName: loan.lender.fullName,
                                                        amount: pendingPayment?.amount || loan.totalPayable,
                                                        paymentMethod: pendingPayment?.method || 'Manual',
                                                        role: 'BORROWER'
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
                                                Waiting for lender to upload payment proof
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

            {loans.length ? loans.map(loan => (
                <div key={loan.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <h3 className="font-semibold text-fern_green-500 text-lg">Loan from {loan.lender.fullName}</h3>
                            <p className="text-sm text-fern_green-400">{loan.lender.email}</p>
                            {loan.lender.phoneNumber && (
                                <p className="text-xs text-fern_green-300">{loan.lender.phoneNumber}</p>
                            )}
                            {/* Show funding status for manual payments */}
                            {loan.payments && loan.payments.some(p =>
                                p.payerRole === 'LENDER' &&
                                p.receiverRole === 'BORROWER' &&
                                p.manualConfirmationStatus === 'PENDING_UPLOAD'
                            ) && loan.status !== 'ACTIVE' && loan.status !== 'COMPLETED' && (
                                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Funding in Progress (Waiting for lender proof)
                                    </div>
                                )}
                            {loan.payments && loan.payments.some(p =>
                                p.payerRole === 'LENDER' &&
                                p.receiverRole === 'BORROWER' &&
                                p.manualConfirmationStatus === 'PENDING_CONFIRMATION' &&
                                !p.borrowerConfirmed
                            ) && loan.status !== 'ACTIVE' && loan.status !== 'COMPLETED' && (
                                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Funding Confirmation Required - Please Confirm Receipt
                                        {loan.payments.some(p =>
                                            p.payerRole === 'LENDER' &&
                                            p.receiverRole === 'BORROWER' &&
                                            (p.screenshotPath || p.confirmationScreenshot)
                                        ) && (
                                                <svg className="w-3 h-3 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                    </div>
                                )}
                            {/* Show repayment status - only for repayment payments */}
                            {loan.payments && loan.payments.some(p =>
                                p.payerRole === 'BORROWER' &&
                                p.receiverRole === 'LENDER' &&
                                p.manualConfirmationStatus === 'PENDING_CONFIRMATION' &&
                                !p.confirmed
                            ) && loan.status !== 'COMPLETED' && (
                                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Waiting for Lender Confirmation (Repayment)
                                        {loan.payments.some(p =>
                                            p.payerRole === 'BORROWER' &&
                                            p.receiverRole === 'LENDER' &&
                                            (p.screenshotPath || p.confirmationScreenshot)
                                        ) && (
                                                <svg className="w-3 h-3 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                    </div>
                                )}
                            {loan.status === 'ACTIVE' && (
                                <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Funding Confirmed - Loan Active
                                </div>
                            )}
                            {loan.status === 'COMPLETED' && (
                                <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Loan Completed
                                </div>
                            )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${LoanHealthColors[loan.health]}`}>
                            {LoanHealthIcons[loan.health]} {loan.health}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-nyanza-700 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-fern_green-400">Amount</p>
                            <p className="font-semibold text-text-mantis-100">${loan.amount.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-fern_green-400">Total Payable</p>
                            <p className="font-semibold text-text-mantis-100">${loan.totalPayable.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-fern_green-400">Due Date</p>
                            <p className="font-semibold text-text-mantis-100">{new Date(loan.paybackDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-fern_green-400">Status</p>
                            <p className="font-semibold text-text-mantis-100">{loan.status}</p>
                        </div>
                    </div>
                    {!isHistory && (
                        <div className="mt-5 flex gap-3 flex-wrap">
                            <button
                                onClick={() => openPaymentModal(loan)}
                                disabled={paymentLoading === loan.id}
                                className={`${paymentLoading === loan.id
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-fern_green-300 hover:bg-fern_green-400"
                                    } text-white px-5 py-2 rounded-lg flex items-center transition-all duration-200 shadow-sm font-medium`}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {paymentLoading === loan.id ? "Processing..." : "Make Payment"}
                            </button>

                            {/* Check for pending manual payments that need borrower confirmation */}
                            {loan.payments && loan.payments.some(p =>
                                p.payerRole === 'LENDER' &&
                                p.receiverRole === 'BORROWER' &&
                                (p.manualConfirmationStatus === 'PENDING_CONFIRMATION' || p.manualConfirmationStatus === 'PENDING_UPLOAD') &&
                                (!p.borrowerConfirmed || p.manualConfirmationStatus === 'PENDING_UPLOAD')
                            ) && (
                                    <button
                                        onClick={() => {
                                            const pendingPayment = loan.payments.find(p =>
                                                p.payerRole === 'LENDER' &&
                                                p.receiverRole === 'BORROWER' &&
                                                (p.manualConfirmationStatus === 'PENDING_CONFIRMATION' || p.manualConfirmationStatus === 'PENDING_UPLOAD') &&
                                                (!p.borrowerConfirmed || p.manualConfirmationStatus === 'PENDING_UPLOAD')
                                            );
                                            setSelectedPayment(pendingPayment);
                                            setShowManualPaymentModal(true);
                                        }}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg flex items-center transition-all duration-200 shadow-sm font-medium"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm Payment Received
                                    </button>
                                )}

                            <button
                                onClick={() => setShowLoanDetails(loan)}
                                className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium"
                            >View Details</button>
                        </div>
                    )}
                </div>
            )) : <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No {title.toLowerCase()} found.</p>}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Make Payment</h3>
                            <button
                                onClick={() => setShowPaymentModal(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Loan Details:</p>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                {(() => {
                                    // console.log("Calculating remaining amount for loan:", showPaymentModal);
                                    // console.log("Payments:", showPaymentModal.payments);

                                    const totalConfirmedPaymentsBorrowerToLender = showPaymentModal.payments
                                        ? showPaymentModal.payments.reduce((sum, p) => p.confirmed && p.payerRole === 'BORROWER' && p.receiverRole === 'LENDER' ? sum + p.amount : sum, 0)
                                        : 0;
                                    const remainingAmount = showPaymentModal.totalPayable - totalConfirmedPaymentsBorrowerToLender;

                                    return (
                                        <>
                                            <p className="font-medium">Amount Due: ${remainingAmount.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">Total Loan: ${showPaymentModal.totalPayable.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">Already Paid: ${totalConfirmedPaymentsBorrowerToLender.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">To: {showPaymentModal.lender.fullName}</p>
                                            <p className="text-sm text-gray-600">{showPaymentModal.agreedPaymentMethod}: {paymentId}</p>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                            </label>
                            {/* <PaymentMethodSelector
                                selectedMethod={selectedPaymentMethod}
                                onMethodSelect={setSelectedPaymentMethod}
                                disabled={paymentLoading === showPaymentModal.id}
                            /> */}

                            {paymentMethods.map((method) => (
                                method.id == showPaymentModal.agreedPaymentMethod ?
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
                                onClick={() => setShowPaymentModal(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePayment(showPaymentModal)}
                                disabled={!selectedPaymentMethod || paymentLoading === showPaymentModal.id}
                                className="flex-1 px-4 py-2 bg-fern_green-300 text-white rounded-lg hover:bg-fern_green-400 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {paymentLoading === showPaymentModal.id ? 'Processing...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BorrowerLoanDetailsModal
                loan={showLoanDetails}
                onClose={() => setShowLoanDetails(null)}
            />

            {/* Stripe Payment Modal */}
            {stripePaymentData && (
                <StripePaymentModal
                    isOpen={showStripeModal}
                    onClose={() => {
                        setShowStripeModal(false);
                        setStripePaymentData(null);
                        setPaymentLoading(null);
                    }}
                    amount={stripePaymentData.amount}
                    loanId={stripePaymentData.loanId}
                    payerRole={stripePaymentData.payerRole}
                    receiverRole={stripePaymentData.receiverRole}
                    onPaymentSuccess={handleStripePaymentSuccess}
                    onPaymentError={handleStripePaymentError}
                />
            )}

            {/* Manual Payment Confirmation Modal */}
            {selectedPayment && (
                <ManualPaymentConfirmationModal
                    isOpen={showManualPaymentModal}
                    onClose={() => {
                        setShowManualPaymentModal(false);
                        setSelectedPayment(null);
                    }}
                    payment={selectedPayment}
                    userRole="BORROWER"
                    onUpdate={() => {
                        // Refresh loans data to reflect the updated payment status
                        window.location.reload();
                    }}
                />
            )}
        </div>
    )
}

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

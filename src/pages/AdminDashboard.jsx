import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, DollarSign, CheckCircle, Handshake, Settings } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';
import UserManagement from '../components/admin/UserManagement';
import LoanManagement from '../components/admin/LoanManagement';
import RelationshipManagement from '../components/admin/RelationshipManagement';
import LenderTermManagement from '../components/admin/LenderTermManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import AuditLogManagement from '../components/admin/AuditLogManagement';
import NotificationManagement from '../components/admin/NotificationManagement';
import {
  me,
  fetchAdminUsers,
  fetchAdminLoans,
  fetchAdminRelationships,
  fetchAdminLenderTerms,
  logout,
} from '../lib/api';

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="bg-white rounded-xl border border-celadon-200 shadow-md p-6 flex items-center hover:shadow-lg transition-all duration-300 hover:border-celadon-300">
    <div className="p-3 rounded-full bg-celadon-900 bg-opacity-10">
      <Icon className={`w-8 h-8 text-fern_green-500`} />
    </div>
    <div className="ml-4">
      <p className="text-sm text-fern_green-300 font-medium">{label}</p>
      <p className="text-2xl font-bold text-mantis-100">{value}</p>
      {subtitle && <p className="text-xs text-fern_green-300">{subtitle}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLoans: 0,
    totalLent: 0,
    activeLoans: 0,
    totalLenderTerms: 0,
    confirmRelationships: 0,
    totalExpectedReturn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [loans, setLoans] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [UserDetails, usersRes, loansRes, relationshipsRes, lenderTermsRes] = await Promise.all([
          me(),
          fetchAdminUsers(),
          fetchAdminLoans(),
          fetchAdminRelationships(),
          fetchAdminLenderTerms(),
        ]);

        setUserDetails(UserDetails || {})
        setLoans(loansRes.loans);
        setStats({
          totalUsers: usersRes.users.length,
          totalLoans: loansRes.loans.length,
          totalLenderTerms: lenderTermsRes.lenderTerms.length,
          // totalLent: loansRes.loans.reduce((sum, loan) => sum + loan.amount, 0),
          activeLoans: loansRes.loans.filter((loan) => loan.status === 'FUNDED').length,
          confirmRelationships: relationshipsRes.relationships.filter((rel) => rel.status === 'CONFIRMED').length,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const fundedLoans = loans.filter((l) => l.status === "FUNDED")
  const completedLoans = loans.filter(l => l.status === "COMPLETED");
  const overdueLoans = loans.filter(l => l.status === "OVERDUE");

  const totalLentAmount = [...fundedLoans, ...completedLoans, ...overdueLoans].reduce((sum, l) => sum + l.amount, 0)
  const totalExpectedReturn = [...fundedLoans, ...completedLoans, ...overdueLoans].reduce((sum, l) => sum + l.totalPayable, 0)
  stats.totalExpectedReturn = totalExpectedReturn;
  stats.totalLent = totalLentAmount;

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className=" font-noto-serif-jp min-h-screen bg-gradient-to-br from-nyanza-900 via-celadon-900 to-fern_green-900">
      {/* Header */}
      <header className="flex items-center justify-between h-[10vh] w-full  bg-gradient-to-r from-fern_green-800 to-fern_green-400 text-white shadow-md p-6 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          {/* <ShieldCheck className="w-8 h-8 text-blue-600" /> */}
          <img src="/logo.svg" alt="logo" className="w-[7rem] h-[7rem]" />
          <h2 className="text-xl font-bold text-fern_green-200">Admin Dashboard</h2>
        </div>

        <div className="flex items-center justify-center gap-4">

          {/* user popup */}
          <button onClick={() => setShowProfile(!showProfile)}
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
                    handleLogout()
                    window.location.reload()
                  }}
                  className="mt-3 bg-gradient-to-r from-fern_green-500 to-fern_green-600 text-white px-6 py-3 rounded-xl hover:from-fern_green-400 hover:to-fern_green-500 transition-all duration-300 w-full text-center font-medium shadow-lg hover:shadow-xl transform hover:scale-105">Logout</button>
              </div>
            </div>
          )}

        </div>
      </header>

      <div className="flex min-h-[90vh] bg-nyanza-900"
        onClick={() => {
          setShowProfile(false)
        }}
      >
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        <main className="flex-1 p-6 ml-[20%] mt-[10vh] min-h-[90vh] overflow-hidden">
          {activeSection === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="text-nyanza-200" subtitle="Registered users" />
                <StatCard icon={DollarSign} label="Total Lent" value={`$${stats.totalLent.toFixed(2)}`} color="text-nyanza-200" subtitle="Across all loans" />
                <StatCard icon={CheckCircle} label="Active Loans" value={stats.activeLoans} color="text-nyanza-200" subtitle="Currently funded" />
                <StatCard icon={Handshake} label="Confirmed Relationships" value={stats.confirmRelationships} color="text-nyanza-200" subtitle="Awaiting confirmation" />
                <StatCard icon={Settings} label="Total Lender Terms" value={stats.totalLenderTerms} color="text-nyanza-200" subtitle="Active terms" />
              </div>
            </div>
          )}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'loans' && <LoanManagement />}
          {activeSection === 'relationships' && <RelationshipManagement />}
          {activeSection === 'lender-terms' && <LenderTermManagement />}
          {activeSection === 'payments' && <PaymentManagement />}
          {activeSection === 'audit-logs' && <AuditLogManagement />}
          {activeSection === 'notifications' && <NotificationManagement />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { me } from './lib/api'
import Register from './pages/Register'
import Login from './pages/Login'
import BorrowerDashboard from './pages/BorrowerDashboard'
import LenderDashboard from './pages/LenderDashboard'
import Invite from './pages/Invite'
import ReferralPage from './pages/ReferralPage'
import { Outlet } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'

function PrivateRoute({ allowedRoles }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await me() // Secure auth check
        // console.log(userData);

        if (userData?.userId) {
          setUserRole(userData?.role)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [location.pathname])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return userRole === 'ADMIN'
      ? <Navigate to="/admin-dashboard" replace /> : userRole === 'BORROWER'
        ? <Navigate to="/borrower-dashboard" replace /> : userRole === 'LENDER'
          ? <Navigate to="/lender-dashboard" replace /> : <Navigate to="/login" replace />
  }

  return <Outlet /> // Render nested routes
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/invite/:token" element={<Invite />} />
      <Route path="/signup" element={<ReferralPage />} />
      <Route path="/signup/:token" element={<ReferralPage />} />

      {/* Default "/" route redirects based on role */}
      <Route path="/" element={
        <PrivateRoute>
          <Navigate to={
            localStorage.getItem('userRole') === 'ADMIN'
              ? '/admin-dashboard' : localStorage.getItem('userRole') === 'BORROWER'
                ? '/borrower-dashboard' : localStorage.getItem('userRole') === 'LENDER'
                  ? '/lender-dashboard' : '/login'
          } replace />
        </PrivateRoute>
      } />

      {/* Admin-only section */}
      <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Borrower-only section */}
      <Route element={<PrivateRoute allowedRoles={['BORROWER']} />}>
        <Route path="/borrower-dashboard" element={<BorrowerDashboard />} />
      </Route>

      {/* Lender-only section */}
      <Route element={<PrivateRoute allowedRoles={['LENDER']} />}>
        <Route path="/lender-dashboard" element={<LenderDashboard />} />
      </Route>
    </Routes>
  )
}


export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import useAuthStore from './store/authSlice'
import PrivateRoute from './routes/PrivateRoute'

// ── Public pages ────────────────────────────────────────────────────────────
import Home from './pages/dashboard/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import OAuth2Callback from './pages/auth/OAuth2Callback'
import BookList from './pages/books/BookList'
import BookDetail from './pages/books/BookDetail'
import AboutUs from './pages/books/AboutUs'

// ── Authenticated pages ─────────────────────────────────────────────────────
import Profile from './pages/members/Profile'
import MemberList from './pages/members/MemberList'
import LoanDash from './pages/loans/LoanDash'
import LoanHistory from './pages/loans/LoanHistory'
import BorrowRequestQueue from './pages/loans/BorrowRequestQueue'
import LoanRequestPage from './pages/loans/LoanRequestPage'
import FineHistory from './pages/fines/FineHistory'
import LibrarianFineLookup from './pages/fines/LibrarianFineLookup'

// ── Admin pages ─────────────────────────────────────────────────────────────
import AdminDashboard from './pages/dashboard/AdminDashboard'
import AdminBookManage from './pages/books/admin/AdminBookManage'
import AdminDeletedBookManage from './pages/books/admin/AdminDeletedBookManage'
import AdminDigitalBookManage from './pages/books/admin/AdminDigitalBookManage'
import AdminCopyManage from './pages/books/admin/AdminCopyManage'
import AdminCategoryManage from './pages/books/admin/AdminCategoryManage'
import AdminClassificationManage from './pages/books/admin/AdminClassificationManage'
import AdminCategoryForm from './pages/books/admin/AdminCategoryForm'

// ── Librarian pages ─────────────────────────────────────────────────────────
import LibrarianDashboard from './pages/books/librarian/LibrarianDashboard'
import LibrarianBookCatalog from './pages/books/librarian/LibrarianBookCatalog'
import LibrarianInventory from './pages/books/librarian/LibrarianInventory'
import LibrarianDigitalBooks from './pages/books/librarian/LibrarianDigitalBooks'
import LibrarianGenres from './pages/books/librarian/LibrarianGenres'
import LibrarianClassifications from './pages/books/librarian/LibrarianClassifications'
import LibrarianBookForm from './pages/books/librarian/LibrarianBookForm'
import LibrarianInventoryForm from './pages/books/librarian/LibrarianInventoryForm'
import LibrarianDigitalBookForm from './pages/books/librarian/LibrarianDigitalBookForm'
import LibrarianGenreForm from './pages/books/librarian/LibrarianGenreForm'
import LibrarianClassificationForm from './pages/books/librarian/LibrarianClassificationForm'
import AdminBookForm from './pages/books/admin/AdminBookForm'
import AdminDigitalBookForm from './pages/books/admin/AdminDigitalBookForm'
import AdminCopyForm from './pages/books/admin/AdminCopyForm'

function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BookList />} />
        <Route path="/books/:bookId" element={<BookDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />

        {/* ── Authenticated (any role) ────────────────────────────── */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/loans" element={<PrivateRoute><LoanHistory /></PrivateRoute>} />
        <Route path="/loans/request" element={<PrivateRoute><LoanRequestPage /></PrivateRoute>} />
        <Route path="/fines" element={<PrivateRoute><FineHistory /></PrivateRoute>} />

        {/* ── Admin routes ────────────────────────────────────────── */}
        <Route path="/admin" element={<PrivateRoute requiredRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/books" element={<PrivateRoute requiredRoles={['admin']}><AdminBookManage /></PrivateRoute>} />
        <Route path="/admin/books/deleted" element={<PrivateRoute requiredRoles={['admin']}><AdminDeletedBookManage /></PrivateRoute>} />
        <Route path="/admin/books/add" element={<PrivateRoute requiredRoles={['admin']}><AdminBookForm mode="add" /></PrivateRoute>} />
        <Route path="/admin/books/:bookId/edit" element={<PrivateRoute requiredRoles={['admin']}><AdminBookForm mode="edit" /></PrivateRoute>} />
        <Route path="/admin/digital-books" element={<PrivateRoute requiredRoles={['admin']}><AdminDigitalBookManage /></PrivateRoute>} />
        <Route path="/admin/digital-books/add" element={<PrivateRoute requiredRoles={['admin']}><AdminDigitalBookForm mode="add" /></PrivateRoute>} />
        <Route path="/admin/digital-books/:bookId/edit" element={<PrivateRoute requiredRoles={['admin']}><AdminDigitalBookForm mode="edit" /></PrivateRoute>} />
        <Route path="/admin/copies" element={<PrivateRoute requiredRoles={['admin']}><AdminCopyManage /></PrivateRoute>} />
        <Route path="/admin/copies/add" element={<PrivateRoute requiredRoles={['admin']}><AdminCopyForm mode="add" /></PrivateRoute>} />
        <Route path="/admin/copies/:copyId/edit" element={<PrivateRoute requiredRoles={['admin']}><AdminCopyForm mode="edit" /></PrivateRoute>} />
        <Route path="/admin/categories" element={<PrivateRoute requiredRoles={['admin']}><AdminCategoryManage /></PrivateRoute>} />
        <Route path="/admin/categories/add" element={<PrivateRoute requiredRoles={['admin']}><AdminCategoryForm mode="add" /></PrivateRoute>} />
        <Route path="/admin/categories/:categoryId/edit" element={<PrivateRoute requiredRoles={['admin']}><AdminCategoryForm mode="edit" /></PrivateRoute>} />
        <Route path="/admin/members" element={<PrivateRoute requiredRoles={['admin']}><MemberList /></PrivateRoute>} />
        <Route path="/admin/borrow-requests" element={<PrivateRoute requiredRoles={['admin']}><BorrowRequestQueue /></PrivateRoute>} />

        {/* ── Librarian routes ────────────────────────────────────── */}
        <Route path="/librarian" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianDashboard /></PrivateRoute>} />
        <Route path="/librarian/books" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianBookCatalog /></PrivateRoute>} />
        <Route path="/librarian/books/add" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianBookForm mode="add" /></PrivateRoute>} />
        <Route path="/librarian/books/:bookId/edit" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianBookForm mode="edit" /></PrivateRoute>} />
        <Route path="/librarian/inventory" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianInventory /></PrivateRoute>} />
        <Route path="/librarian/inventory/add" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianInventoryForm mode="add" /></PrivateRoute>} />
        <Route path="/librarian/inventory/:copyId/edit" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianInventoryForm mode="edit" /></PrivateRoute>} />
        <Route path="/librarian/digital-books" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianDigitalBooks /></PrivateRoute>} />
        <Route path="/librarian/digital-books/add" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianDigitalBookForm mode="add" /></PrivateRoute>} />
        <Route path="/librarian/digital-books/:resourceId/edit" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianDigitalBookForm mode="edit" /></PrivateRoute>} />
        <Route path="/librarian/genres" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianGenres /></PrivateRoute>} />
        <Route path="/librarian/genres/add" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianGenreForm mode="add" /></PrivateRoute>} />
        <Route path="/librarian/genres/:genreId/edit" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianGenreForm mode="edit" /></PrivateRoute>} />
        <Route path="/librarian/classifications" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianClassifications /></PrivateRoute>} />
        <Route path="/librarian/classifications/add" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianClassificationForm mode="add" /></PrivateRoute>} />
        <Route path="/librarian/classifications/:classificationId/edit" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianClassificationForm mode="edit" /></PrivateRoute>} />
        <Route path="/librarian/members" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><MemberList /></PrivateRoute>} />
        <Route path="/librarian/loans" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LoanDash /></PrivateRoute>} />
        <Route path="/librarian/loans/returns" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LoanDash /></PrivateRoute>} />
        <Route path="/librarian/loans/history" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LoanDash /></PrivateRoute>} />
        <Route path="/librarian/borrow-requests" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><BorrowRequestQueue /></PrivateRoute>} />
        <Route path="/librarian/fines" element={<PrivateRoute requiredRoles={['admin', 'librarian']}><LibrarianFineLookup /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

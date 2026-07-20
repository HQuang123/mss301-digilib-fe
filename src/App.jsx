import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import useAuthStore from './store/authSlice'
import PrivateRoute from './routes/PrivateRoute'

// ── Public pages ────────────────────────────────────────────────────────────
import Home from './pages/dashboard/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import OAuth2Callback from './pages/auth/OAuth2Callback'
import BookList from './pages/books/BookList'
import BookDetail from './pages/books/BookDetail'
import AboutUs from './pages/books/AboutUs'

// ── Authenticated pages ─────────────────────────────────────────────────────
import Profile from './pages/members/Profile'
import MemberList from './pages/members/MemberList'
import LoanDash from './pages/loans/LoanDash'
import LoanHistory from './pages/loans/LoanHistory'

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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/books" element={<AdminBookManage />} />
        <Route path="/admin/books/deleted" element={<AdminDeletedBookManage />} />
        <Route path="/admin/books/add" element={<Navigate to="/admin/books" replace />} />
        <Route path="/admin/books/:bookId/edit" element={<Navigate to="/admin/books" replace />} />
        <Route path="/admin/digital-books" element={<AdminDigitalBookManage />} />
        <Route path="/admin/digital-books/add" element={<Navigate to="/admin/digital-books" replace />} />
        <Route path="/admin/digital-books/:resourceId/edit" element={<Navigate to="/admin/digital-books" replace />} />
        <Route path="/admin/copies" element={<AdminCopyManage />} />
        <Route path="/admin/copies/add" element={<Navigate to="/admin/copies" replace />} />
        <Route path="/admin/copies/:copyId/edit" element={<Navigate to="/admin/copies" replace />} />
        <Route path="/admin/categories" element={<AdminCategoryManage />} />
        <Route path="/admin/categories/add" element={<Navigate to="/admin/categories" replace />} />
        <Route path="/admin/categories/:categoryId/edit" element={<Navigate to="/admin/categories" replace />} />
        <Route path="/admin/classifications" element={<AdminClassificationManage />} />
        <Route path="/librarian" element={<LibrarianDashboard />} />
        <Route path="/librarian/books" element={<LibrarianBookCatalog />} />
        <Route path="/librarian/books/add" element={<LibrarianBookForm mode="add" />} />
        <Route path="/librarian/books/:bookId/edit" element={<LibrarianBookForm mode="edit" />} />
        <Route path="/librarian/inventory" element={<LibrarianInventory />} />
        <Route path="/librarian/inventory/add" element={<LibrarianInventoryForm mode="add" />} />
        <Route path="/librarian/inventory/:copyId/edit" element={<LibrarianInventoryForm mode="edit" />} />
        <Route path="/librarian/digital-books" element={<LibrarianDigitalBooks />} />
        <Route path="/librarian/digital-books/add" element={<LibrarianDigitalBookForm mode="add" />} />
        <Route path="/librarian/digital-books/:resourceId/edit" element={<LibrarianDigitalBookForm mode="edit" />} />
        <Route path="/librarian/genres" element={<LibrarianGenres />} />
        <Route path="/librarian/genres/add" element={<LibrarianGenreForm mode="add" />} />
        <Route path="/librarian/genres/:genreId/edit" element={<LibrarianGenreForm mode="edit" />} />
        <Route path="/librarian/classifications" element={<LibrarianClassifications />} />
        <Route path="/librarian/classifications/add" element={<LibrarianClassificationForm mode="add" />} />
        <Route path="/librarian/classifications/:classificationId/edit" element={<LibrarianClassificationForm mode="edit" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />

        {/* ── Authenticated (any role) ────────────────────────────── */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/loans" element={<PrivateRoute><LoanHistory /></PrivateRoute>} />

        {/* ── Admin routes ────────────────────────────────────────── */}
        <Route path="/admin" element={<PrivateRoute requiredRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/books" element={<PrivateRoute requiredRoles={['admin']}><AdminBookManage /></PrivateRoute>} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App

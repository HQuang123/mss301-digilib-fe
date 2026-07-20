import AdminBookForm from '../admin/AdminBookForm'
import LibrarianLayout from './LibrarianLayout'

function LibrarianBookForm({ mode = 'add' }) {
  return (
    <AdminBookForm
      mode={mode}
      LayoutComponent={LibrarianLayout}
      active="catalog"
      listPath="/librarian/books"
    />
  )
}

export default LibrarianBookForm

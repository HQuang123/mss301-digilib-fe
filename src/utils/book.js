export function createBookNameMap(data) {
  const books = Array.isArray(data) ? data : data?.content || []
  return new Map(books.map((book) => [
    String(book.bookId),
    book.title?.trim() || 'Chưa có tên sách',
  ]))
}

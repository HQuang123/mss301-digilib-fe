import axiosClient from './axiosClient'

export const getBooks = ({ page = 0, size = 12, sort = 'createdAt,desc' } = {}) =>
  axiosClient.get('/api/catalog/books', {
    params: { page, size, sort },
  })

export const getDeletedBooks = ({ page = 0, size = 12, sort = 'createdAt,desc' } = {}) =>
  axiosClient.get('/api/catalog/books/deleted', {
    params: { page, size, sort },
  })

export const getBookById = (bookId) => axiosClient.get(`/api/catalog/books/${bookId}`)

export const createBook = (payload) => axiosClient.post('/api/catalog/books', payload)

export const updateBook = (bookId, payload) => axiosClient.put(`/api/catalog/books/${bookId}`, payload)

export const updateBookStatus = (bookId, payload) =>
  axiosClient.put(`/api/catalog/books/${bookId}/status`, payload)

export const deleteBook = (bookId, userId) =>
  axiosClient.delete(`/api/catalog/books/${bookId}`, {
    params: userId ? { userId } : undefined,
  })

export const restoreBook = (bookId, userId) =>
  axiosClient.put(`/api/catalog/books/${bookId}/restore`, null, {
    params: userId ? { userId } : undefined,
  })

export const getBookCopiesByBookId = ({ bookId, page = 0, size = 50, sort = 'copyId,asc' }) =>
  axiosClient.get(`/api/catalog/books/${bookId}/copies`, {
    params: { page, size, sort },
  })

export const getBookCopies = ({ page = 0, size = 10, sort = 'copyId,asc' } = {}) =>
  axiosClient.get('/api/catalog/book-copies', {
    params: { page, size, sort },
  })

export const getDeletedBookCopies = ({ page = 0, size = 10, sort } = {}) =>
  axiosClient.get('/api/catalog/book-copies/deleted', {
    params: { page, size, ...(sort ? { sort } : {}) },
  })

export const getBookCopyById = (copyId) =>
  axiosClient.get(`/api/catalog/book-copies/${copyId}`)

export const createBookCopy = (bookId, payload) =>
  axiosClient.post(`/api/catalog/books/${bookId}/copies`, payload)

export const updateBookCopy = (copyId, payload) =>
  axiosClient.put(`/api/catalog/book-copies/${copyId}`, payload)

export const deleteBookCopy = (copyId, userId) =>
  axiosClient.delete(`/api/catalog/book-copies/${copyId}`, {
    params: userId ? { userId } : undefined,
  })

export const restoreBookCopy = (copyId, userId) =>
  axiosClient.put(`/api/catalog/book-copies/${copyId}/restore`, null, {
    params: userId ? { userId } : undefined,
  })

export const searchBookCopies = ({ keyword, page = 0, size = 10, sort = 'copyId,asc' }) =>
  axiosClient.get('/api/catalog/book-copies/search', {
    params: { keyword, page, size, sort },
  })

export const uploadBookCover = ({ bookId, file, userId }) => {
  const formData = new FormData()
  formData.append('file', file)

  return axiosClient.post(`/api/catalog/books/${bookId}/cover`, formData, {
    params: userId ? { userId } : undefined,
  })
}

export const searchBooks = ({ keyword, page = 0, size = 12, sort = 'createdAt,desc' }) =>
  axiosClient.get('/api/catalog/books/search', {
    params: { keyword, page, size, sort },
  })

export const getCategories = ({ page = 0, size = 100, sort = 'categoryId,asc' } = {}) =>
  axiosClient.get('/api/catalog/categories', {
    params: { page, size, sort },
  })

export const getDeletedCategories = ({ page = 0, size = 100, sort } = {}) =>
  axiosClient.get('/api/catalog/categories/deleted', {
    params: { page, size, ...(sort ? { sort } : {}) },
  })

export const getCategoryById = (categoryId) =>
  axiosClient.get(`/api/catalog/categories/${categoryId}`)

export const createCategory = (payload) =>
  axiosClient.post('/api/catalog/categories', payload)

export const updateCategory = (categoryId, payload) =>
  axiosClient.put(`/api/catalog/categories/${categoryId}`, payload)

export const deleteCategory = (categoryId) =>
  axiosClient.delete(`/api/catalog/categories/${categoryId}`)

export const restoreCategory = (categoryId) =>
  axiosClient.put(`/api/catalog/categories/${categoryId}/restore`)

export const searchCategories = ({ keyword, page = 0, size = 100, sort = 'categoryId,asc' }) =>
  axiosClient.get('/api/catalog/categories/search', {
    params: { keyword, page, size, sort },
  })

export const getClassifications = ({ page = 0, size = 100, sort = 'classificationId,asc' } = {}) =>
  axiosClient.get('/api/catalog/classifications', {
    params: { page, size, sort },
  })

export const getDeletedClassifications = ({ page = 0, size = 100, sort } = {}) =>
  axiosClient.get('/api/catalog/classifications/deleted', {
    params: { page, size, ...(sort ? { sort } : {}) },
  })

export const getClassificationById = (classificationId) =>
  axiosClient.get(`/api/catalog/classifications/${classificationId}`)

export const createClassification = (payload) =>
  axiosClient.post('/api/catalog/classifications', payload)

export const updateClassification = (classificationId, payload) =>
  axiosClient.put(`/api/catalog/classifications/${classificationId}`, payload)

export const deleteClassification = (classificationId) =>
  axiosClient.delete(`/api/catalog/classifications/${classificationId}`)

export const restoreClassification = (classificationId) =>
  axiosClient.put(`/api/catalog/classifications/${classificationId}/restore`)

export const searchClassifications = ({ keyword, page = 0, size = 100, sort = 'classificationId,asc' }) =>
  axiosClient.get('/api/catalog/classifications/search', {
    params: { keyword, page, size, sort },
  })

export const getDigitalResources = ({ page = 0, size = 10, sort = 'resourceId,asc' } = {}) =>
  axiosClient.get('/api/catalog/digital-resources', {
    params: { page, size, sort },
  })

export const getDeletedDigitalResources = ({ page = 0, size = 10, sort = 'resourceId,asc' } = {}) =>
  axiosClient.get('/api/catalog/digital-resources/deleted', {
    params: { page, size, sort },
  })

export const getDigitalResourceById = (resourceId) =>
  axiosClient.get(`/api/catalog/digital-resources/${resourceId}`)

export const createDigitalResource = (bookId, payload) =>
  axiosClient.post(`/api/catalog/books/${bookId}/digital-resources`, payload)

export const uploadDigitalResourceFile = ({ bookId, file, accessPermission, userId }) => {
  const formData = new FormData()
  formData.append('file', file)

  return axiosClient.post(`/api/catalog/books/${bookId}/digital-resources/upload`, formData, {
    params: {
      accessPermission,
      ...(userId ? { userId } : {}),
    },
  })
}

export const replaceDigitalResourceFile = ({ resourceId, file, accessPermission, userId }) => {
  const formData = new FormData()
  formData.append('file', file)

  return axiosClient.put(`/api/catalog/digital-resources/${resourceId}/upload`, formData, {
    params: {
      accessPermission,
      ...(userId ? { userId } : {}),
    },
  })
}

export const updateDigitalResource = (resourceId, payload) =>
  axiosClient.put(`/api/catalog/digital-resources/${resourceId}`, payload)

export const deleteDigitalResource = (resourceId, userId) =>
  axiosClient.delete(`/api/catalog/digital-resources/${resourceId}`, {
    params: userId ? { userId } : undefined,
  })

export const restoreDigitalResource = (resourceId, bookId, userId) =>
  axiosClient.put(`/api/catalog/digital-resources/${resourceId}/restore`, null, {
    params: {
      bookId,
      ...(userId ? { userId } : {}),
    },
  })

import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getCategories = () => api.get('/categories').then(r => r.data)
export const createCategory = (name) => api.post('/categories', { name }).then(r => r.data)

export const getProducts = () => api.get('/products').then(r => r.data)
export const createProduct = (data) => api.post('/products', data).then(r => r.data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data)
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data)

export const getSales = () => api.get('/sales').then(r => r.data)
export const getSale = (id) => api.get(`/sales/${id}`).then(r => r.data)
export const createSale = (data) => api.post('/sales', data).then(r => r.data)

export const getDashboard = () => api.get('/dashboard').then(r => r.data)
export const getAnalytics = () => api.get('/analytics').then(r => r.data)

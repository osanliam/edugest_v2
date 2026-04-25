# Ejemplos Avanzados - Web Artifacts Builder

Ejemplos para casos de uso específicos y técnicas avanzadas.

---

## 📊 1. Dashboard con Datos en Vivo

### Caso de Uso
Mostrar métricas que se actualizan sin recargar.

```tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function LiveDashboard() {
  const [data, setData] = useState([
    { time: '00:00', users: 400 },
    { time: '04:00', users: 520 },
    { time: '08:00', users: 680 },
  ])

  // Simular actualización cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => [
        ...prevData.slice(1),
        {
          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          users: Math.floor(Math.random() * 1000) + 400,
        },
      ])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const currentUsers = data[data.length - 1]?.users || 0

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Monitor en Vivo</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Usuarios Activos Ahora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-blue-600">{currentUsers}</div>
            <p className="text-gray-600 mt-2">Se actualiza cada 5 segundos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas 24 Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" fill="#3b82f6" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 🔐 2. Formulario con Validación Avanzada

### Caso de Uso
Validación en cliente sin enviar al servidor.

```tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  username: string
}

interface Errors {
  email?: string
  password?: string
  confirmPassword?: string
  username?: string
}

export default function AdvancedForm() {
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = (): boolean => {
    const newErrors: Errors = {}

    // Email
    if (!form.email) {
      newErrors.email = 'Email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido'
    }

    // Username
    if (!form.username) {
      newErrors.username = 'Usuario es requerido'
    } else if (form.username.length < 3) {
      newErrors.username = 'Mínimo 3 caracteres'
    }

    // Password
    if (!form.password) {
      newErrors.password = 'Contraseña es requerida'
    } else if (form.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres'
    } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(form.password)) {
      newErrors.password = 'Debe contener mayúscula y número'
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Limpiar error cuando el usuario empiece a editar
    if (errors[name as keyof Errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      setSubmitted(true)
      setTimeout(() => {
        setForm({ email: '', password: '', confirmPassword: '', username: '' })
        setSubmitted(false)
      }, 2000)
    }
  }

  const FormField = ({ name, label, type = 'text', value, error }: any) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Input
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          className={`w-full ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {error && <AlertCircle className="absolute right-3 top-2.5 w-5 h-5 text-red-500" />}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Crear Cuenta</h1>

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">Cuenta creada exitosamente</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField name="username" label="Usuario" value={form.username} error={errors.username} />
        <FormField name="email" label="Email" type="email" value={form.email} error={errors.email} />
        <FormField
          name="password"
          label="Contraseña"
          type="password"
          value={form.password}
          error={errors.password}
        />
        <FormField
          name="confirmPassword"
          label="Confirmar Contraseña"
          type="password"
          value={form.confirmPassword}
          error={errors.confirmPassword}
        />

        <Button type="submit" className="w-full">
          Crear Cuenta
        </Button>
      </form>

      {/* Password strength indicator */}
      {form.password && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium mb-2">Fortaleza:</p>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i < (form.password.length >= 8 ? (form.password.length >= 12 ? 3 : 2) : 1)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 🛒 3. Carrito de Compras

### Caso de Uso
Gestionar estado complejo con múltiples acciones.

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

const PRODUCTS = [
  { id: '1', name: 'Laptop Pro', price: 1299.99 },
  { id: '2', name: 'Ratón Inalámbrico', price: 29.99 },
  { id: '3', name: 'Teclado Mecánico', price: 149.99 },
  { id: '4', name: 'Monitor 4K', price: 399.99 },
  { id: '5', name: 'Cable USB-C', price: 12.99 },
]

export default function ShoppingCart() {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id)
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
    } else {
      setCart(prevCart =>
        prevCart.map(item => (item.id === id ? { ...item, quantity } : item))
      )
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Productos */}
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold mb-8">Tienda</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRODUCTS.map(product => (
              <Card key={product.id} className="p-6">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-4">${product.price}</p>
                <Button
                  onClick={() => addToCart(product)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Agregar al Carrito
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Carrito ({cart.length})
              </h2>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Carrito vacío</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-start border-b pb-4">
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-gray-600 text-sm">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Impuesto (10%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-6 bg-green-600 hover:bg-green-700">
                    Proceder al Pago
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔄 4. Filtros Avanzados

### Caso de Uso
Sistema de filtrado complejo con múltiples criterios.

```tsx
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'

interface Product {
  id: string
  name: string
  category: string
  price: number
  rating: number
  inStock: boolean
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'Laptop', category: 'Electronics', price: 1200, rating: 4.5, inStock: true },
  { id: '2', name: 'Phone', category: 'Electronics', price: 800, rating: 4, inStock: true },
  { id: '3', name: 'Desk', category: 'Furniture', price: 300, rating: 3.5, inStock: false },
  { id: '4', name: 'Chair', category: 'Furniture', price: 200, rating: 4, inStock: true },
  { id: '5', name: 'Monitor', category: 'Electronics', price: 400, rating: 4.5, inStock: true },
]

const CATEGORIES = ['Electronics', 'Furniture']

export default function AdvancedFilters() {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [rating, setRating] = useState(0)
  const [inStock, setInStock] = useState(false)

  const filtered = useMemo(() => {
    return PRODUCTS.filter(product => {
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false
      if (categories.length > 0 && !categories.includes(product.category)) return false
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false
      if (product.rating < rating) return false
      if (inStock && !product.inStock) return false
      return true
    })
  }, [search, categories, priceRange, rating, inStock])

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filtros */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <h2 className="text-xl font-bold">Filtros</h2>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nombre del producto..."
              />
            </div>

            {/* Categorías */}
            <div>
              <h3 className="font-semibold mb-3">Categorías</h3>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center">
                    <Checkbox
                      checked={categories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                    />
                    <label className="ml-2 text-sm cursor-pointer">{cat}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Precio */}
            <div>
              <h3 className="font-semibold mb-3">Precio</h3>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={2000}
                  step={50}
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
                <p className="text-sm text-gray-600">
                  ${priceRange[0]} - ${priceRange[1]}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="font-semibold mb-3">Calificación Mínima</h3>
              <select
                value={rating}
                onChange={e => setRating(Number(e.target.value))}
                className="w-full border rounded-md p-2 text-sm"
              >
                <option value={0}>Todas</option>
                <option value={3}>3+ estrellas</option>
                <option value={4}>4+ estrellas</option>
                <option value={4.5}>4.5+ estrellas</option>
              </select>
            </div>

            {/* Stock */}
            <div className="flex items-center">
              <Checkbox checked={inStock} onCheckedChange={setInStock} />
              <label className="ml-2 text-sm cursor-pointer">Solo en stock</label>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-6">
            Productos ({filtered.length})
          </h2>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No se encontraron productos</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(product => (
                <Card key={product.id} className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{product.category}</p>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-2xl font-bold text-blue-600 mb-1">${product.price}</p>
                      <p className="text-sm">⭐ {product.rating}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      product.inStock
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'En stock' : 'Agotado'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 🎯 Tips para Estos Ejemplos

### Rendimiento
```tsx
// ✅ Usa useMemo para filtrados complejos
const filtered = useMemo(() => {
  // Lógica de filtrado
  return results
}, [dependencies])
```

### Estado Complejo
```tsx
// ✅ Usa useReducer para múltiples acciones
const [state, dispatch] = useReducer(reducer, initialState)
```

### Integración API (opcional)
```tsx
// ✅ Fetch de datos reales
useEffect(() => {
  const fetchData = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data)
  }
  fetchData()
}, [])
```

---

**¡Úsa estos ejemplos como punto de partida para tus propios artifacts!**

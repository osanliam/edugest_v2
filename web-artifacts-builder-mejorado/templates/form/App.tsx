import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Form() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: '',
    subscribe: false,
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, subscribe: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Datos enviados:', formData)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-3xl">Formulario de Contacto</CardTitle>
            <CardDescription>Completa todos los campos para continuar</CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {submitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Mensaje enviado correctamente</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  required
                  className="w-full"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="juan@example.com"
                  required
                  className="w-full"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soporte">Soporte técnico</SelectItem>
                    <SelectItem value="ventas">Ventas</SelectItem>
                    <SelectItem value="general">Consulta general</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Cuéntanos en detalle..."
                  required
                  className="w-full min-h-32"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={formData.subscribe}
                  onCheckedChange={handleCheckboxChange}
                  id="subscribe"
                />
                <label htmlFor="subscribe" className="text-sm text-gray-700 cursor-pointer">
                  Deseo recibir actualizaciones por email
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
                >
                  Enviar mensaje
                </Button>
                <Button
                  type="reset"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setFormData({ name: '', email: '', category: '', message: '', subscribe: false })
                  }
                >
                  Limpiar
                </Button>
              </div>
            </form>

            {/* Información adicional */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> Responderemos tu mensaje en un plazo máximo de 24 horas hábiles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

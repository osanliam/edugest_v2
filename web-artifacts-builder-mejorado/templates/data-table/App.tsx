import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react'

interface DataRow {
  id: string
  nombre: string
  email: string
  estado: 'activo' | 'inactivo' | 'pendiente'
  fecha: string
  valor: number
}

const initialData: DataRow[] = [
  { id: '1', nombre: 'Ana García', email: 'ana@example.com', estado: 'activo', fecha: '2024-01-15', valor: 1250 },
  { id: '2', nombre: 'Carlos López', email: 'carlos@example.com', estado: 'activo', fecha: '2024-01-20', valor: 2100 },
  { id: '3', nombre: 'María Rodríguez', email: 'maria@example.com', estado: 'pendiente', fecha: '2024-02-01', valor: 890 },
  { id: '4', nombre: 'Juan Martínez', email: 'juan@example.com', estado: 'inactivo', fecha: '2024-02-10', valor: 1500 },
  { id: '5', nombre: 'Laura Sánchez', email: 'laura@example.com', estado: 'activo', fecha: '2024-02-15', valor: 3200 },
  { id: '6', nombre: 'Pedro Díaz', email: 'pedro@example.com', estado: 'activo', fecha: '2024-02-20', valor: 1800 },
  { id: '7', nombre: 'Sofia Herrera', email: 'sofia@example.com', estado: 'pendiente', fecha: '2024-02-25', valor: 2500 },
  { id: '8', nombre: 'Miguel Ángel', email: 'miguel@example.com', estado: 'inactivo', fecha: '2024-03-01', valor: 950 },
]

type SortKey = keyof DataRow
type SortDirection = 'asc' | 'desc' | null

export default function DataTable() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredData = useMemo(() => {
    let result = initialData

    // Filtrar por búsqueda
    if (search) {
      result = result.filter(row =>
        row.nombre.toLowerCase().includes(search.toLowerCase()) ||
        row.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter(row => row.estado === statusFilter)
    }

    // Ordenar
    if (sortBy && sortDir) {
      result.sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]

        if (typeof aVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
        }
        return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      })
    }

    return result
  }, [search, sortBy, sortDir, statusFilter])

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      if (sortDir === 'asc') {
        setSortDir('desc')
      } else if (sortDir === 'desc') {
        setSortDir(null)
        setSortBy(null)
      }
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortBy !== column) return <div className="w-4 h-4" />
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800'
      case 'inactivo':
        return 'bg-gray-100 text-gray-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="border-b bg-white">
            <CardTitle>Tabla de Datos</CardTitle>
            <CardDescription>Gestiona y busca información con filtros avanzados</CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Controles */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Busca por nombre o email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-white"
                >
                  <option value="all">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="pendiente">Pendiente</option>
                </select>

                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => toggleSort('nombre')}
                        className="flex items-center gap-2 hover:text-gray-900"
                      >
                        Nombre
                        <SortIcon column="nombre" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => toggleSort('email')}
                        className="flex items-center gap-2 hover:text-gray-900"
                      >
                        Email
                        <SortIcon column="email" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => toggleSort('estado')}
                        className="flex items-center gap-2 hover:text-gray-900"
                      >
                        Estado
                        <SortIcon column="estado" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => toggleSort('fecha')}
                        className="flex items-center gap-2 hover:text-gray-900"
                      >
                        Fecha
                        <SortIcon column="fecha" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      <button
                        onClick={() => toggleSort('valor')}
                        className="flex items-center gap-2 ml-auto hover:text-gray-900"
                      >
                        Valor
                        <SortIcon column="valor" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map(row => (
                      <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{row.nombre}</td>
                        <td className="px-6 py-4 text-gray-600">{row.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.estado)}`}>
                            {row.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{row.fecha}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">${row.valor}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No se encontraron resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen */}
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>Mostrando {filteredData.length} de {initialData.length} registros</span>
              <span>Total: ${filteredData.reduce((sum, row) => sum + row.valor, 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

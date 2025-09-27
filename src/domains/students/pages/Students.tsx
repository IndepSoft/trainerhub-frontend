import { PageHeader } from '@/shared/components/PageHeader'
import { Plus, UserPlus } from 'lucide-react'

export default function Students() {


  const handleAddStudent = () => {
    console.log('Agregar estudiante')
  }
  
  const handleInviteStudent = () => {
    console.log('Invitar estudiante')
  }


  return (
    <div className="students-page">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Title>Estudiantes</PageHeader.Title>
            <p className="text-sm text-gray-600 mt-1">Gestiona tus estudiantes y su progreso (2/2)</p>
          </div>
          
          <PageHeader.Actions>
            
            <button
              onClick={handleInviteStudent}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invitar Estudiante</span>
            </button>
            
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Estudiante</span>
            </button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>
      
      <div className="page-content">
        {/* Lista de estudiantes */}
      </div>
    </div>
  )
}
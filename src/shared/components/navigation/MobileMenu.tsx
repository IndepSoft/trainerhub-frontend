import { useState, useEffect } from 'react'
import { X, Menu } from 'lucide-react'
import { getMobileRoutes } from '@/app/config/navigation.config'
import { NavItem } from './NavItem'
import { PersonCard } from '../PersonCard'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const mobileRoutes = getMobileRoutes()

  const toggleMenu = () => {
    if (!isOpen) {
      setIsVisible(true)
      setTimeout(() => setIsOpen(true), 10)
    } else {
      setIsOpen(false)
      setTimeout(() => setIsVisible(false), 300)
    }
  }

  const closeMenu = () => {
    setIsOpen(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      {isVisible && (
        <>
          <div
            className={`fixed inset-0 bg-black z-40 md:hidden transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-50' : 'opacity-0'}`}
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div
            className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    TrainerHub
                  </h2>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                  aria-label="Close mobile menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-4 border-b from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div>
                    <PersonCard />
                  </div>
                </div>
              </div>

              {/* Contenido - Navegación Dinámica */}
              <nav className="flex-1 px-2 py-4 overflow-y-auto">
                <div className="space-y-1">
                  {mobileRoutes.map((route, index) => (
                    <div
                      key={route.id}
                      className={`transform transition-all duration-300 ease-out 
                                                ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
                      style={{
                        transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                      }}
                    >
                      <NavItem
                        to={route.href}
                        icon={route.icon}
                        badge={route.badge}
                        disabled={route.disabled}
                        onClick={closeMenu}
                        className="w-full justify-start px-4 py-3 text-base font-medium rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {route.label}
                        </span>
                      </NavItem>
                    </div>
                  ))}
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t bg-gray-50 p-4">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium text-gray-700">
                  <span>v1.0.0</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

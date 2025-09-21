import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export default function RootLayout() {
  const location = useLocation()
  
  const hideNavRoutes = ['/register', '/login']
  const shouldHideNav = hideNavRoutes.includes(location.pathname)
  
  return (
    <div className="min-h-dvh flex flex-col">
      {!shouldHideNav && (
        <header className="bg-gray-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">
                  TrainerHub
                </Link>
              </div>
              
              <nav className="hidden md:block">
                <div className="flex items-center space-x-6">
                  <Link 
                    to="/dashboard" 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/about" 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    About
                  </Link>
                </div>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  type="button"
                  className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
                  aria-label="Toggle menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={`flex-1 ${!shouldHideNav ? 'p-6' : ''}`}>
        <div className={!shouldHideNav ? 'max-w-7xl mx-auto' : ''}>
          <Outlet />
        </div>
      </main>

      {/* Footer - solo se muestra en rutas específicas */}
      {!shouldHideNav && (
        <footer className="bg-gray-100 border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-600">
              © 2025 TrainerHub. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
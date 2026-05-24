import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserCircle, Receipt, LogOut, Menu, X } from 'lucide-react';

export default function DashboardLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const isAdmin = user?.rol === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Gestión de Cobros</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:block text-sm text-slate-600">
              {user?.nombre} ({user?.rol})
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex relative">
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-white border-r transform transition-transform duration-200 ease-out
            lg:transform-none lg:transition-none
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-16 lg:mt-0 pt-4 lg:pt-0 min-h-[calc(100vh-73px)] lg:min-h-screen
          `}
        >
          <nav className="space-y-1 px-3">
            {isAdmin && (
              <>
                <Link to="/users" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-3" />
                    Usuarios
                  </Button>
                </Link>
                <Link to="/clients" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <UserCircle className="w-4 h-4 mr-3" />
                    Clientes
                  </Button>
                </Link>
                <Link to="/payments" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Receipt className="w-4 h-4 mr-3" />
                    Registrar Pago
                  </Button>
                </Link>
              </>
            )}

            {!isAdmin && (
              <Link to="/payments" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Receipt className="w-4 h-4 mr-3" />
                  Registrar Pago
                </Button>
              </Link>
            )}
          </nav>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 min-h-[calc(100vh-73px)] lg:min-h-screen p-4 sm:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
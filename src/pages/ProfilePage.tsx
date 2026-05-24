import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Loader2, Save, Lock } from 'lucide-react';

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({ nombre: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.users.getProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: api.users.updateProfile,
    onSuccess: (updatedUser) => {
      setProfileSuccess('Perfil actualizado correctamente');
      setProfileError('');
      localStorage.setItem('user', JSON.stringify(updatedUser));
      queryClient.setQueryData(['profile'], updatedUser);
    },
    onError: (err: Error) => setProfileError(err.message),
  });

  const changePasswordMutation = useMutation({
    mutationFn: api.users.changePassword,
    onSuccess: () => {
      setPasswordSuccess('Contraseña cambiada correctamente');
      setPasswordError('');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: Error) => setPasswordError(err.message),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    updateProfileMutation.mutate({
      nombre: profileForm.nombre,
      email: profileForm.email,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <User className="w-6 h-6 text-slate-600" />
        <h2 className="text-xl sm:text-2xl font-bold">Mi Perfil</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Rol</p>
            <p className="font-semibold">{user?.rol}</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}
            {profileSuccess && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{profileSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={profileForm.nombre}
                  onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                  placeholder={user?.nombre}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder={user?.email}
                  className="w-full"
                />
              </div>
            </div>

            <Button type="submit" disabled={updateProfileMutation.isPending} size="sm">
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            {passwordSuccess && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{passwordSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>
            </div>

            <Button type="submit" disabled={changePasswordMutation.isPending} size="sm">
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cambiando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
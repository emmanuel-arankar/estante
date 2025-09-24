import { useState, useEffect } from 'react';
import { Form, useNavigate, redirect, useActionData, useNavigation, Link } from 'react-router-dom';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import type { ActionFunctionArgs } from 'react-router-dom';

// Ícones
import { ArrowLeft, Save, User, MapPin, Link as LinkIcon, Check, X, Loader2 } from 'lucide-react';

// Componentes
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '../components/ui/rich-text-editor';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

// Serviços e Utilitários
import { auth, db } from '../services/firebase';
import { syncDenormalizedUserData } from '../services/denormalizedFriendships';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';

// Zod Schema com a nova regra para o nickname
const editProfileSchema = z.object({
  displayName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  nickname: z.string()
    .min(3, 'O apelido deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9-._]+$/, 'Formato de apelido inválido.'), // <-- ATUALIZADO: Permite "."
  bio: z.string().max(500, 'A bio deve ter no máximo 500 caracteres').optional(),
  location: z.string().max(50).optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

// ACTION para lidar com a submissão do formulário
export const editProfileAction = async ({ request }: ActionFunctionArgs) => {
  // ... (código da action continua o mesmo da versão anterior)
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const user = auth.currentUser;

  if (!user) {
    return redirect('/login');
  }

  try {
    editProfileSchema.parse(data);

    const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
    if (currentUserDoc.exists() && currentUserDoc.data().nickname !== data.nickname) {
      const q = query(collection(db, 'users'), where('nickname', '==', data.nickname));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('Este apelido já está em uso.');
      }
    }

    let birthDate = null;
    const { birthDay, birthMonth, birthYear } = data;
    if (birthDay && birthMonth && birthYear) {
      birthDate = new Date(parseInt(birthYear as string), parseInt(birthMonth as string) - 1, parseInt(birthDay as string));
      if (isNaN(birthDate.getTime())) throw new Error('Data de nascimento inválida.');
    }

    await updateProfile(user, { displayName: data.displayName as string });
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      displayName: data.displayName,
      nickname: data.nickname,
      bio: data.bio || '',
      location: data.location || '',
      website: data.website || '',
      birthDate: birthDate,
      updatedAt: serverTimestamp(),
    });

    await syncDenormalizedUserData(user.uid);
    toastSuccessClickable('Perfil atualizado com sucesso!');
    return redirect(`/profile/me`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.';
    toastErrorClickable(errorMessage);
    return { error: errorMessage };
  }
};


// COMPONENTE com toda a UI e lógica restauradas
export const EditProfile = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [bioContent, setBioContent] = useState(profile?.bio || '');
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [nicknameCheckTimeout, setNicknameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Efeito para popular o estado inicial quando o perfil é carregado
  useEffect(() => {
    if (profile) {
      setBioContent(profile.bio || '');
      setNickname(profile.nickname || '');
    }
  }, [profile]);

  // Função para verificar disponibilidade do nickname
  const checkNicknameAvailability = async (name: string): Promise<boolean> => {
      const q = query(collection(db, 'users'), where('nickname', '==', name));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          return querySnapshot.docs[0].id === auth.currentUser?.uid;
      }
      return true;
  };
  
  // Handler para mudança do nickname com debounce e formatação
  const handleNicknameChange = (value: string) => {
      const formatted = value.replace(/\s/g, '-').replace(/[^a-z0-9-._]/g, '').toLowerCase();
      setNickname(formatted);

      if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
      if (formatted.length < 3 || formatted === profile?.nickname) {
          setNicknameStatus('idle');
          return;
      }

      setNicknameStatus('checking');
      const timeout = setTimeout(async () => {
          const isAvailable = await checkNicknameAvailability(formatted);
          setNicknameStatus(isAvailable ? 'available' : 'taken');
      }, 500);
      setNicknameCheckTimeout(timeout);
  };
  
  const getNicknameStatusIcon = () => {
    if (nickname === profile?.nickname || nickname.length < 3) return null;
    switch (nicknameStatus) {
      case 'checking': return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
      case 'available': return <Check className="h-4 w-4 text-green-600" />;
      case 'taken': return <X className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const birthDate = profile?.birthDate instanceof Date ? profile.birthDate : (profile?.birthDate ? (profile.birthDate as any).toDate() : null);
  const initialBirthDay = birthDate ? String(birthDate.getDate()) : undefined;
  const initialBirthMonth = birthDate ? String(birthDate.getMonth() + 1) : undefined;
  const initialBirthYear = birthDate ? String(birthDate.getFullYear()) : undefined;
  
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  if (loading) return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!profile) { navigate('/login'); return null; }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader><div className="flex items-center space-x-4"><Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button><CardTitle className="text-2xl">Editar Perfil</CardTitle></div></CardHeader>
            <CardContent>
              {actionData?.error && <p className="text-sm text-red-600 mb-4">{actionData.error}</p>}
              <Form method="post" className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="displayName" className="text-sm font-medium">Nome</label>
                  <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="displayName" name="displayName" type="text" defaultValue={profile.displayName || ''} required className="pl-10" /></div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="nickname" className="text-sm font-medium">Apelido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <Input id="nickname" name="nickname" type="text" value={nickname} onChange={(e) => handleNicknameChange(e.target.value)} required className="pl-10 pr-10" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">{getNicknameStatusIcon()}</div>
                  </div>
                  <p className="text-xs text-gray-500">Seu identificador único. Use apenas letras minúsculas, números, '.', '-' e '_'.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <input type="hidden" name="bio" value={bioContent} />
                  <RichTextEditor content={bioContent} onChange={setBioContent} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Nascimento</label>
                  <div className="flex space-x-2">
                    <Select name="birthDay" defaultValue={initialBirthDay}><SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger><SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                    <Select name="birthMonth" defaultValue={initialBirthMonth}><SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
                    <Select name="birthYear" defaultValue={initialBirthYear}><SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">Localização</label>
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="location" name="location" type="text" defaultValue={profile.location || ''} className="pl-10" /></div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium">Website</label>
                  <div className="relative"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="website" name="website" type="url" defaultValue={profile.website || ''} className="pl-10" /></div>
                </div>
                <div className="flex justify-end items-center gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-full">Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting || nicknameStatus === 'taken' || nicknameStatus === 'checking'} className="bg-emerald-600 hover:bg-emerald-700 rounded-full w-40">
                    {isSubmitting ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Salvar</>}
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
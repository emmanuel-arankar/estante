import { Suspense, useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { LoaderFunctionArgs } from "react-router-dom";

// Ícones
import {
    MapPin, Link as LinkIcon, Calendar, BookOpen, Users, Edit3, Cake,
    UserPlus, UserCheck, MessageCircle, Camera
} from 'lucide-react';

// Componentes
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ProfilePhotoMenu } from '../components/profile/ProfilePhotoMenu';
import { PhotoViewer } from '../components/profile/PhotoViewer';
import { AvatarEditorModal } from '../components/ui/avatar-editor-modal';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

// Serviços e Hooks
import { useAuth } from '../hooks/useAuth';
import { useFriendshipStatus } from '../hooks/useDenormalizedFriends';
import { db } from '../services/firebase';
import { sendDenormalizedFriendRequest } from '../services/denormalizedFriendships';
import { getUserAvatars } from '../services/firestore';
import { User as UserModel } from '../models';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';

export const profileLoader = async ({ params }: LoaderFunctionArgs): Promise<UserModel | null> => {
  const { nickname } = params;
  if (!nickname || nickname === 'me') {
    return null;
  }
  const q = query(collection(db, 'users'), where('nickname', '==', nickname));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Response("Not Found", { status: 404, statusText: "Utilizador não encontrado." });
  }
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  const convertDate = (date: any) => date?.toDate ? date.toDate() : (date ? new Date(date) : null);
  return {
    id: doc.id,
    ...data,
    joinedAt: convertDate(data.joinedAt),
    createdAt: convertDate(data.createdAt),
    updatedAt: convertDate(data.updatedAt),
    birthDate: convertDate(data.birthDate),
  } as UserModel;
};

export const Profile = () => {
  const loadedProfile = useLoaderData() as UserModel | null;
  const { user: currentUser, profile: currentProfile, loading: authLoading } = useAuth();
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();

  if (nickname === 'me') {
    if (authLoading) {
      return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
    }
    if (!currentProfile) {
      navigate('/login');
      return null;
    }
    return <ProfileContent profile={currentProfile} isOwnProfile={true} />;
  }
  
  if (!loadedProfile) return null;
  const isOwnProfile = currentUser?.uid === loadedProfile.id;
  return <ProfileContent profile={loadedProfile} isOwnProfile={isOwnProfile} />;
};

const ProfileContent = ({ profile, isOwnProfile }: { profile: UserModel; isOwnProfile: boolean }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAvatarData, setCurrentAvatarData] = useState<{ uploadedAt?: Date; id?: string; }>({});
  
  const friendshipStatus = useFriendshipStatus(profile.id);

  useEffect(() => {
    const fetchAvatarData = async () => {
      if (!profile.id) return;
      try {
        const avatars = await getUserAvatars(profile.id);
        const currentAvatar = avatars.find(avatar => avatar.isCurrent);
        if (currentAvatar) {
          setCurrentAvatarData({ uploadedAt: currentAvatar.uploadedAt, id: currentAvatar.id });
        }
      } catch (error) {
        console.error('Erro ao buscar dados do avatar:', error);
      }
    };
    fetchAvatarData();
  }, [profile.id]);

  const handleSendFriendRequest = async () => {
    if (!currentUser || !profile) return;
    setActionLoading(true);
    try {
      await sendDenormalizedFriendRequest(currentUser.uid, profile.id);
      toastSuccessClickable('Solicitação de amizade enviada!');
    } catch (error) {
      toastErrorClickable('Erro ao enviar solicitação.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpdate = () => {
    setShowPhotoEditor(false);
    window.location.reload();
  };

  const getFriendshipButton = () => {
    if (actionLoading) return <Button className="rounded-full" disabled><LoadingSpinner size="sm" /></Button>;
    switch (friendshipStatus) {
      case 'friends':
        return (
          <>
            <Button variant="outline" className="rounded-full"><UserCheck className="h-4 w-4 mr-2" />Amigos</Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate(`/chat/${profile.id}`)}><MessageCircle className="h-4 w-4 mr-2" />Mensagem</Button>
          </>
        );
      case 'request_sent':
        return <Button variant="outline" className="rounded-full" disabled><UserPlus className="h-4 w-4 mr-2" />Solicitação Enviada</Button>;
      case 'request_received':
        return <Button asChild className="rounded-full bg-green-600 hover:bg-green-700"><Link to="/friends">Responder Solicitação</Link></Button>;
      default:
        return <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={handleSendFriendRequest}><UserPlus className="h-4 w-4 mr-2" />Adicionar Amigo</Button>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative">
                  {isOwnProfile ? (
                    <ProfilePhotoMenu
                      currentPhotoURL={profile.photoURL}
                      onView={() => setShowPhotoViewer(true)}
                      onEdit={() => setShowPhotoEditor(true)}
                      trigger={
                        <div className="relative cursor-pointer group">
                          <OptimizedAvatar src={profile.photoURL} alt={profile.displayName} fallback={profile.displayName} size="xl" />
                          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      }
                    />
                  ) : (
                     <OptimizedAvatar src={profile.photoURL} alt={profile.displayName} fallback={profile.displayName} size="xl" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.displayName}</h1>
                      <p className="text-gray-600 mb-2">@{profile.nickname}</p>
                      {profile.bio && <div className="text-gray-700 mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: profile.bio }} />}
                    </div>
                    {isOwnProfile ? (
                      <Button variant="outline" className="rounded-full" onClick={() => navigate('/profile/edit')}><Edit3 className="h-4 w-4 mr-2" />Editar Perfil</Button>
                    ) : (
                      <div className="flex space-x-2 mt-4 md:mt-0">{getFriendshipButton()}</div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    {profile.location && <div className="flex items-center"><MapPin className="h-4 w-4 mr-3 text-gray-400" /><span>{profile.location}</span></div>}
                    {profile.website && <div className="flex items-center"><LinkIcon className="h-4 w-4 mr-3 text-gray-400" /><a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{profile.website}</a></div>}
                    {profile.birthDate && <div className="flex items-center"><Cake className="h-4 w-4 mr-3 text-gray-400" /><span>Nasceu em {format(profile.birthDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span></div>}
                    <div className="flex items-center"><Calendar className="h-4 w-4 mr-3 text-gray-400" /><span>Membro {formatDistanceToNow(profile.joinedAt, { addSuffix: true, locale: ptBR })}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="books">Livros</TabsTrigger>
              <TabsTrigger value="reviews">Resenhas</TabsTrigger>
              <TabsTrigger value="friends">Amigos</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-6">
               <Card>
                <CardHeader><CardTitle>Posts Recentes</CardTitle></CardHeader>
                <CardContent className="text-center py-12"><BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p>Nenhum post para mostrar ainda.</p></CardContent>
              </Card>
            </TabsContent>
             <TabsContent value="books" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Estante de Livros</CardTitle></CardHeader>
                <CardContent className="text-center py-12"><BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p>Nenhum livro na estante ainda.</p></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Resenhas</CardTitle></CardHeader>
                <CardContent className="text-center py-12"><BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p>Nenhuma resenha ainda.</p></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="friends" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Amigos</CardTitle></CardHeader>
                <CardContent className="text-center py-12"><Users className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p>Nenhum amigo para mostrar.</p></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Atividade Recente</CardTitle></CardHeader>
                <CardContent className="text-center py-12"><Users className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p>Nenhuma atividade recente.</p></CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {showPhotoViewer && profile.photoURL && (
        <PhotoViewer
          imageUrl={profile.photoURL}
          onClose={() => setShowPhotoViewer(false)}
          userAvatar={profile.photoURL}
          userName={profile.displayName}
          userId={profile.id}
          avatarId={currentAvatarData.id}
          postDate={currentAvatarData.uploadedAt ? format(currentAvatarData.uploadedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Data não disponível"}
        />
      )}
      
      {showPhotoEditor && (
        <AvatarEditorModal
          currentPhotoURL={profile.photoURL}
          onSave={handlePhotoUpdate}
          onCancel={() => setShowPhotoEditor(false)}
        />
      )}
    </div>
  );
};
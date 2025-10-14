import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle2, Clock, Sparkles, Gift, MessageSquare, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Notificacoes() {
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications(user?.id);

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">Minhas Notificações</h1>
            <p className="text-muted-foreground">Acompanhe suas notificações e atualizações</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notificações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications?.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhuma notificação encontrada
                  </p>
                </div>
              ) : (
                notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer
                      transition-all duration-300
                      ${notification.is_read 
                        ? 'border-border hover:bg-muted/50' 
                        : 'border-primary/30 bg-primary/5 hover:bg-primary/10 shadow-sm shadow-primary/20'
                      }
                    `}
                  >
                    <div className={`
                      p-3 rounded-lg transition-all duration-300
                      ${notification.is_read ? 'bg-muted' : 'bg-primary/20'}
                    `}>
                      {notification.type === 'confirmation' ? (
                        <CheckCircle2 className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      ) : notification.type === 'reminder' ? (
                        <Clock className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      ) : notification.type === 'promotion' ? (
                        <Gift className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      ) : (
                        <Bell className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${!notification.is_read && 'text-primary'}`}>
                          {notification.title}
                        </span>
                        <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                          {notification.is_read ? 'Lida' : 'Nova'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

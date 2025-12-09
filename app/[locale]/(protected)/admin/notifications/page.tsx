'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    link?: string | null;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const { notifications } = await res.json();
                setNotifications(notifications);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationIds: string[]) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds }),
            });

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        notificationIds.includes(n.id) ? { ...n, is_read: true } : n
                    )
                );
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const deleteNotifications = async (notificationIds: string[]) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds }),
            });

            if (res.ok) {
                setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
            }
        } catch (error) {
            console.error('Failed to delete notifications:', error);
        }
    };

    const markAllAsRead = () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            markAsRead(unreadIds);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'error':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'success':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="h-6 w-6" />
                        Notifications
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {notifications.filter(n => !n.is_read).length} unread
                    </p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <Button onClick={markAllAsRead} variant="outline" size="sm">
                        <Check className="h-4 w-4 mr-2" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No notifications yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`transition-all ${!notification.is_read ? 'border-l-4 border-l-sky-500 bg-sky-50/30' : ''
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{notification.title}</h3>
                                            <Badge variant="outline" className={getTypeColor(notification.type)}>
                                                {notification.type}
                                            </Badge>
                                            {!notification.is_read && (
                                                <Badge variant="default" className="bg-sky-600">
                                                    New
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                                            {notification.link && (
                                                <Link
                                                    href={notification.link}
                                                    className="text-sky-600 hover:underline font-medium"
                                                >
                                                    View Details →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => markAsRead([notification.id])}
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteNotifications([notification.id])}
                                            title="Delete"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

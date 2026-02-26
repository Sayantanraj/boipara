import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface Notification {
  type: string;
  message: string;
  timestamp: Date;
}

export const useRealTime = (userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io('http://localhost:3001');
    newSocket.emit('join-customer', userId);

    newSocket.on('order-created', (data) => {
      setNotifications(prev => [...prev, {
        type: 'order',
        message: `Order #${data.orderId} created successfully`,
        timestamp: new Date()
      }]);
    });

    newSocket.on('order-update', (data) => {
      setNotifications(prev => [...prev, {
        type: 'order',
        message: `Order #${data.orderId} status updated to ${data.status}`,
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('stock-alert', (data) => {
      setNotifications(prev => [...prev, {
        type: 'stock',
        message: data.message,
        timestamp: new Date()
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return { socket, notifications, clearNotifications };
};
import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, X, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../types';

const Header = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Check for new notifications every 5 minutes
    const interval = setInterval(checkForNewNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  };

  const checkForNewNotifications = () => {
    try {
      // Load all required data
      const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]');
      const purchaseBills = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
      const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
      
      const newNotifications: Notification[] = [];
      const today = new Date();
      
      // Check credit sales payments
      salesBills
        .filter(bill => bill.paymentType === 'credit')
        .forEach(bill => {
          const customer = customers.find(c => c.id === bill.custCode);
          if (!customer) return;

          const billDate = new Date(bill.date);
          const daysSinceBill = Math.floor((today.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Get payments for this bill
          const payments = bookEntries
            .filter(entry => entry.custCode === bill.custCode)
            .reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);
          
          const remainingAmount = parseFloat(bill.total) - payments;
          
          if (remainingAmount > 0) {
            if (daysSinceBill >= 30) {
              newNotifications.push({
                id: `payment_due_${bill.id}_${Date.now()}`,
                type: 'payment_due',
                title: 'Payment Overdue',
                message: `Payment of ₹${remainingAmount.toLocaleString()} from ${customer.name} is overdue by ${daysSinceBill - 30} days`,
                date: new Date().toISOString(),
                read: false,
                data: {
                  amount: remainingAmount,
                  customerId: customer.id,
                  customerName: customer.name,
                  dueDate: billDate.toISOString()
                }
              });
            } else if (daysSinceBill >= 25) {
              newNotifications.push({
                id: `payment_reminder_${bill.id}_${Date.now()}`,
                type: 'payment_due',
                title: 'Payment Due Soon',
                message: `Payment of ₹${remainingAmount.toLocaleString()} from ${customer.name} is due in ${30 - daysSinceBill} days`,
                date: new Date().toISOString(),
                read: false,
                data: {
                  amount: remainingAmount,
                  customerId: customer.id,
                  customerName: customer.name,
                  dueDate: billDate.toISOString()
                }
              });
            }
          }
        });

      // Check purchase payments
      purchaseBills.forEach(bill => {
        const supplier = suppliers.find(s => s.id === bill.supplierCode);
        if (!supplier) return;

        const billDate = new Date(bill.date);
        const daysSinceBill = Math.floor((today.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Get payments for this bill
        const payments = bookEntries
          .filter(entry => entry.supplierCode === bill.supplierCode)
          .reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);
        
        const remainingAmount = parseFloat(bill.total) - payments;
        
        if (remainingAmount > 0 && daysSinceBill >= 7) {
          newNotifications.push({
            id: `supplier_payment_${bill.id}_${Date.now()}`,
            type: 'payment_due',
            title: 'Supplier Payment Due',
            message: `Payment of ₹${remainingAmount.toLocaleString()} to ${supplier.name} is pending for ${daysSinceBill} days`,
            date: new Date().toISOString(),
            read: false,
            data: {
              amount: remainingAmount,
              supplierId: supplier.id,
              supplierName: supplier.name,
              dueDate: billDate.toISOString()
            }
          });
        }
      });

      if (newNotifications.length > 0) {
        const updatedNotifications = [...notifications, ...newNotifications];
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.filter(n => !n.read).length);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem('notifications', '[]');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-16 glass-card border-b border-gray-200/50 flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 relative"
          >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border z-50">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Mark all as read
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(notification => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className={`w-4 h-4 ${
                                notification.type === 'payment_due' 
                                  ? 'text-red-500' 
                                  : 'text-blue-500'
                              }`} />
                              <span className="font-medium">{notification.title}</span>
                            </div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(notification.date).toLocaleDateString()}
                            </div>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200/50">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Guest'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
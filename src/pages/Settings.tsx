import React, { useState, useEffect } from 'react';
import { Store, Printer, Lock, Bell, CreditCard, Plus, X, Edit2, Trash2, Building2, Mail, Phone, MapPin, CheckCircle, AlertCircle, FileText, ScrollText } from 'lucide-react';
import type { Business, PrinterSettings } from '../types';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [activePrinterTab, setActivePrinterTab] = useState('cash');
  const [auditSettings, setAuditSettings] = useState<AuditSettings>(() => {
    const saved = localStorage.getItem('auditSettings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      autoAudit: false,
      frequency: 'weekly',
      categories: {
        inventory: true,
        sales: true,
        purchases: true,
        payments: true
      },
      thresholds: {
        stockVariance: 5,
        paymentDelay: 30,
        creditLimit: 80
      }
    };
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => {
    const savedSettings = localStorage.getItem('printerSettings');
    const defaultSettings: PrinterSettings = {
      cash: {
        paperSize: 'thermal-80mm',
        headerText: '',
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
        showItemDetails: true,
        showTotalInWords: true,
        footerText: 'Thank you for your business!',
        copies: 1
      },
      credit: {
        paperSize: 'a4',
        headerText: '',
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
        showItemDetails: true,
        showTotalInWords: true,
        showDueDate: true,
        showTermsAndConditions: true,
        termsAndConditions: '1. Goods once sold will not be taken back\n2. Interest @18% p.a. will be charged on overdue bills',
        copies: 2
      }
    };
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [businessForm, setBusinessForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    password: '',
    role: 'manager'
  });

  useEffect(() => {
    // Load business data
    const businessData = localStorage.getItem('business');
    
    if (businessData) {
      const parsedBusiness = JSON.parse(businessData);
      setBusiness(parsedBusiness);
      setBusinessForm({
        name: parsedBusiness.name,
        email: parsedBusiness.email,
        phone: parsedBusiness.phone,
        address: parsedBusiness.address
      });
    }

    // Load users
    const usersData = localStorage.getItem('users');
    if (usersData) {
      setUsers(JSON.parse(usersData));
    }
  }, []);

  // Save printer settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('printerSettings', JSON.stringify(printerSettings));
    } catch (error) {
      console.error('Error saving printer settings:', error);
    }
  }, [printerSettings]);
  
  useEffect(() => {
    localStorage.setItem('auditSettings', JSON.stringify(auditSettings));
  }, [auditSettings]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUserData = {
      id: Date.now().toString(),
      username: newUser.username,
      name: newUser.name,
      password: newUser.password,
      role: newUser.role,
      active: true,
      businessId: business?.id,
      lastLogin: null
    };

    const updatedUsers = [...users, newUserData];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setIsAddUserModalOpen(false);
    setNewUser({ username: '', name: '', password: '', role: 'manager' });
  };

  const handleUpdateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    const updatedBusiness = {
      ...business,
      ...businessForm
    };

    localStorage.setItem('business', JSON.stringify(updatedBusiness));
    setBusiness(updatedBusiness);
    setIsEditing(false);
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate email verification
    const mockCode = '123456'; // In a real app, this would be sent to the user's email
    
    if (verificationCode === mockCode) {
      setVerificationStatus('success');
      setTimeout(() => {
        setIsVerifyEmailModalOpen(false);
        setVerificationStatus(null);
        setVerificationCode('');
      }, 2000);
    } else {
      setVerificationStatus('error');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate current password
    const currentUser = users.find(u => u.id === JSON.parse(localStorage.getItem('user') || '{}').id);
    if (!currentUser || currentUser.password !== passwordForm.currentPassword) {
      alert('Current password is incorrect');
      return;
    }

    // Validate new password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    // Update password
    const updatedUsers = users.map(user => 
      user.id === currentUser.id 
        ? { ...user, password: passwordForm.newPassword }
        : user
    );

    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setIsChangePasswordModalOpen(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    alert('Password changed successfully');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex gap-6 px-6">
            {[
              { icon: Store, label: 'Business', id: 'business' },
              { icon: Printer, label: 'Printer', id: 'printer' },
              { icon: FileText, label: 'Audit', id: 'audit' },
              { icon: Lock, label: 'Security', id: 'security' },
              { icon: CreditCard, label: 'Payment' },
            ].map(({ icon: Icon, label, id = label.toLowerCase() }) => (
              <button
                key={label}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-4 text-sm font-medium border-b-2 ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {label}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'business' && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Business Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateBusiness}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={businessForm.name}
                          onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                          className="input-field pl-10"
                          disabled={!isEditing}
                          required
                        />
                        <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={businessForm.email}
                          onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                          className="input-field pl-10"
                          disabled={!isEditing}
                          required
                        />
                        <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={businessForm.phone}
                          onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                          className="input-field pl-10"
                          disabled={!isEditing}
                          required
                        />
                        <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <div className="relative">
                        <textarea
                          value={businessForm.address}
                          onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                          className="input-field pl-10 min-h-[80px]"
                          disabled={!isEditing}
                          required
                        />
                        <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setBusinessForm({
                            name: business?.name || '',
                            email: business?.email || '',
                            phone: business?.phone || '',
                            address: business?.address || ''
                          });
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Save Changes
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Printer Settings</h2>
                
                <div className="bg-white rounded-xl border">
                  <div className="border-b">
                    <nav className="flex gap-6 px-6">
                      <button
                        onClick={() => setActivePrinterTab('cash')}
                        className={`px-4 py-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                          activePrinterTab === 'cash'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <ScrollText className="w-5 h-5" />
                        Cash Bill Format
                      </button>
                      <button
                        onClick={() => setActivePrinterTab('credit')}
                        className={`px-4 py-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                          activePrinterTab === 'credit'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <ScrollText className="w-5 h-5" />
                        Credit Bill Format
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {activePrinterTab === 'cash' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Cash Bill Settings</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Paper Size
                            </label>
                            <select
                              value={printerSettings.cash.paperSize}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, paperSize: e.target.value }
                              }))}
                              className="input-field"
                            >
                              <option value="thermal-58mm">58mm Thermal</option>
                              <option value="thermal-80mm">80mm Thermal</option>
                              <option value="fanfold-6x8">Fanfold 6x8 inch</option>
                              <option value="a4">A4</option>
                              <option value="a5">A5</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Header Text
                            </label>
                            <input
                              type="text"
                              value={printerSettings.cash.headerText}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, headerText: e.target.value }
                              }))}
                              className="input-field"
                              placeholder="Enter header text"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Number of Copies
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="3"
                              value={printerSettings.cash.copies}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, copies: parseInt(e.target.value) }
                              }))}
                              className="input-field"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.cash.showLogo}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, showLogo: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Business Logo
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.cash.showAddress}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, showAddress: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Business Address
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.cash.showPhone}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, showPhone: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Phone Number
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.cash.showEmail}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, showEmail: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Email Address
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.cash.showItemDetails}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, showItemDetails: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Detailed Item Information
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.cash.showTotalInWords}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                cash: { ...prev.cash, showTotalInWords: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Total Amount in Words
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Footer Text
                          </label>
                          <input
                            type="text"
                            value={printerSettings.cash.footerText}
                            onChange={(e) => setPrinterSettings(prev => ({
                              ...prev,
                              cash: { ...prev.cash, footerText: e.target.value }
                            }))}
                            className="input-field"
                            placeholder="Enter footer text"
                          />
                        </div>
                      </div>
                    )}

                    {activePrinterTab === 'credit' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Credit Bill Settings</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Paper Size
                            </label>
                            <select
                              value={printerSettings.credit.paperSize}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, paperSize: e.target.value }
                              }))}
                              className="input-field"
                            >
                              <option value="a4">A4</option>
                              <option value="a5">A5</option>
                              <option value="fanfold-6x8">Fanfold 6x8 inch</option>
                              <option value="legal">Legal</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Header Text
                            </label>
                            <input
                              type="text"
                              value={printerSettings.credit.headerText}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, headerText: e.target.value }
                              }))}
                              className="input-field"
                              placeholder="Enter header text"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Number of Copies
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="3"
                              value={printerSettings.credit.copies}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, copies: parseInt(e.target.value) }
                              }))}
                              className="input-field"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showLogo}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showLogo: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Business Logo
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showAddress}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showAddress: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Business Address
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showPhone}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showPhone: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Phone Number
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showEmail}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showEmail: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Email Address
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showItemDetails}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showItemDetails: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Detailed Item Information
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showTotalInWords}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showTotalInWords: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Total Amount in Words
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showDueDate}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showDueDate: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Due Date
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={printerSettings.credit.showTermsAndConditions}
                              onChange={(e) => setPrinterSettings(prev => ({
                                ...prev,
                                credit: { ...prev.credit, showTermsAndConditions: e.target.checked }
                              }))}
                              className="rounded text-blue-600"
                            />
                            Show Terms and Conditions
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Terms and Conditions
                          </label>
                          <textarea
                            value={printerSettings.credit.termsAndConditions}
                            onChange={(e) => setPrinterSettings(prev => ({
                              ...prev,
                              credit: { ...prev.credit, termsAndConditions: e.target.value }
                            }))}
                            className="input-field min-h-[100px]"
                            placeholder="Enter terms and conditions"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Audit Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                    <div>
                      <h3 className="font-medium">Enable Auditing</h3>
                      <p className="text-sm text-gray-500">Turn on automatic auditing of business operations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={auditSettings.enabled}
                        onChange={(e) => setAuditSettings(prev => ({
                          ...prev,
                          enabled: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {auditSettings.enabled && (
                    <>
                      <div className="p-4 bg-white rounded-xl border">
                        <h3 className="font-medium mb-4">Audit Categories</h3>
                        <div className="space-y-3">
                          {Object.entries(auditSettings.categories).map(([key, value]) => (
                            <label key={key} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => setAuditSettings(prev => ({
                                  ...prev,
                                  categories: {
                                    ...prev.categories,
                                    [key]: e.target.checked
                                  }
                                }))}
                                className="rounded text-blue-600"
                              />
                              <span className="capitalize">{key}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-xl border">
                        <h3 className="font-medium mb-4">Audit Frequency</h3>
                        <select
                          value={auditSettings.frequency}
                          onChange={(e) => setAuditSettings(prev => ({
                            ...prev,
                            frequency: e.target.value as AuditSettings['frequency']
                          }))}
                          className="input-field"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="p-4 bg-white rounded-xl border">
                        <h3 className="font-medium mb-4">Audit Thresholds</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm mb-1">Stock Variance (%)</label>
                            <input
                              type="number"
                              value={auditSettings.thresholds.stockVariance}
                              onChange={(e) => setAuditSettings(prev => ({
                                ...prev,
                                thresholds: {
                                  ...prev.thresholds,
                                  stockVariance: parseInt(e.target.value)
                                }
                              }))}
                              className="input-field"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Payment Delay (days)</label>
                            <input
                              type="number"
                              value={auditSettings.thresholds.paymentDelay}
                              onChange={(e) => setAuditSettings(prev => ({
                                ...prev,
                                thresholds: {
                                  ...prev.thresholds,
                                  paymentDelay: parseInt(e.target.value)
                                }
                              }))}
                              className="input-field"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Credit Limit Alert (%)</label>
                            <input
                              type="number"
                              value={auditSettings.thresholds.creditLimit}
                              onChange={(e) => setAuditSettings(prev => ({
                                ...prev,
                                thresholds: {
                                  ...prev.thresholds,
                                  creditLimit: parseInt(e.target.value)
                                }
                              }))}
                              className="input-field"
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                        <div>
                          <h3 className="font-medium">Auto Audit</h3>
                          <p className="text-sm text-gray-500">Automatically run audits based on frequency</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={auditSettings.autoAudit}
                            onChange={(e) => setAuditSettings(prev => ({
                              ...prev,
                              autoAudit: e.target.checked
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Account Security</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                    <div>
                      <h3 className="font-medium">Email Verification</h3>
                      <p className="text-sm text-gray-500">Verify your email address to enhance account security</p>
                    </div>
                    <button
                      onClick={() => setIsVerifyEmailModalOpen(true)}
                      className="btn-primary"
                    >
                      Verify Email
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                    <div>
                      <h3 className="font-medium">Change Password</h3>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                    <button
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="btn-primary"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">User Management</h2>
                  <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                </div>

                <div className="bg-white rounded-xl border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4">{user.name}</td>
                          <td className="px-6 py-4">{user.username}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <Edit2 className="w-4 h-4 text-gray-500" />
                              </button>
                              {user.role !== 'admin' && (
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Verification Modal */}
      {isVerifyEmailModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Verify Email Address</h2>
              <button
                onClick={() => {
                  setIsVerifyEmailModalOpen(false);
                  setVerificationStatus(null);
                  setVerificationCode('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyEmail}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={verificationEmail}
                    onChange={(e) => setVerificationEmail(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="input-field"
                    placeholder="Enter verification code"
                    required
                  />
                </div>

                {verificationStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    Email verified successfully!
                  </div>
                )}

                {verificationStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    Invalid verification code. Please try again.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyEmailModalOpen(false);
                    setVerificationStatus(null);
                    setVerificationCode('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Verify Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Change Password</h2>
              <button
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-field"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New User</h2>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
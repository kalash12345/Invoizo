export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: 'regular' | 'vip' | 'wholesale';
  creditLimit: number;
}

export interface PrinterSettings {
  cash: {
    paperSize: string;
    headerText: string;
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showItemDetails: boolean;
    showTotalInWords: boolean;
    footerText: string;
    copies: number;
  };
  credit: {
    paperSize: string;
    headerText: string;
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showItemDetails: boolean;
    showTotalInWords: boolean;
    showDueDate: boolean;
    showTermsAndConditions: boolean;
    termsAndConditions: string;
    copies: number;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  currency: string;
  registrationDate: Date;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager';
  active: boolean;
  lastLogin?: Date;
  businessId: string;
}

export interface Notification {
  id: string;
  type: 'payment_due' | 'payment_received' | 'credit_limit';
  title: string;
  message: string;
  date: string;
  read: boolean;
  data?: {
    amount?: number;
    customerId?: string;
    customerName?: string;
    supplierId?: string;
    supplierName?: string;
    dueDate?: string;
  };
}

export interface AuditSettings {
  enabled: boolean;
  autoAudit: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  categories: {
    inventory: boolean;
    sales: boolean;
    purchases: boolean;
    payments: boolean;
  };
  thresholds: {
    stockVariance: number;
    paymentDelay: number;
    creditLimit: number;
  };
}

export interface AuthState {
  user: User | null;
  business: Business | null;
  isAuthenticated: boolean;
}
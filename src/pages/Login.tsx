import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User as UserIcon, Building2, Mail, Phone, MapPin } from 'lucide-react';
import type { Business, User as UserType } from '../types';

const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    business: {
      name: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      currency: 'INR'
    },
    admin: {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const businessData = localStorage.getItem('business');
    const usersData = localStorage.getItem('users');
    
    if (!businessData || !usersData) {
      setError('No business registered. Please sign up first.');
      return;
    }

    const users = JSON.parse(usersData);
    const user = users.find(u => u.username === loginData.username);

    if (user && user.password === loginData.password) {
      const { password, ...userWithoutPassword } = user;
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.admin.password !== signupData.admin.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Create business
    const business: Business = {
      id: Date.now().toString(),
      ...signupData.business,
      registrationDate: new Date()
    };

    // Create admin user
    const adminUser: UserType & { password: string } = {
      id: Date.now().toString(),
      username: signupData.admin.username,
      name: signupData.admin.name,
      role: 'admin',
      active: true,
      businessId: business.id,
      password: signupData.admin.password
    };

    // Save business and user data
    localStorage.setItem('business', JSON.stringify(business));
    localStorage.setItem('users', JSON.stringify([adminUser]));

    // Auto login
    const { password, ...userWithoutPassword } = adminUser;
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Invoizo
            </h1>
            <p className="text-gray-600 mt-2">
              {isSignup ? 'Register your business' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {isSignup ? (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Business Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signupData.business.name}
                        onChange={(e) => setSignupData({
                          ...signupData,
                          business: { ...signupData.business, name: e.target.value }
                        })}
                        className="input-field pl-10"
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
                        value={signupData.business.email}
                        onChange={(e) => setSignupData({
                          ...signupData,
                          business: { ...signupData.business, email: e.target.value }
                        })}
                        className="input-field pl-10"
                        required
                      />
                      <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={signupData.business.phone}
                      onChange={(e) => setSignupData({
                        ...signupData,
                        business: { ...signupData.business, phone: e.target.value }
                      })}
                      className="input-field pl-10"
                      required
                    />
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={signupData.business.country}
                      onChange={(e) => setSignupData({
                        ...signupData,
                        business: { ...signupData.business, country: e.target.value }
                      })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="SG">Singapore</option>
                      <option value="AE">UAE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={signupData.business.currency}
                      onChange={(e) => setSignupData({
                        ...signupData,
                        business: { ...signupData.business, currency: e.target.value }
                      })}
                      className="input-field"
                      required
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="CAD">Canadian Dollar (C$)</option>
                      <option value="AUD">Australian Dollar (A$)</option>
                      <option value="SGD">Singapore Dollar (S$)</option>
                      <option value="AED">UAE Dirham (د.إ)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <textarea
                      value={signupData.business.address}
                      onChange={(e) => setSignupData({
                        ...signupData,
                        business: { ...signupData.business, address: e.target.value }
                      })}
                      className="input-field pl-10 min-h-[80px]"
                      required
                    />
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Admin Account</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signupData.admin.name}
                        onChange={(e) => setSignupData({
                          ...signupData,
                          admin: { ...signupData.admin, name: e.target.value }
                        })}
                        className="input-field pl-10"
                        required
                      />
                      <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signupData.admin.username}
                        onChange={(e) => setSignupData({
                          ...signupData,
                          admin: { ...signupData.admin, username: e.target.value }
                        })}
                        className="input-field pl-10"
                        required
                      />
                      <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={signupData.admin.password}
                        onChange={(e) => setSignupData({
                          ...signupData,
                          admin: { ...signupData.admin, password: e.target.value }
                        })}
                        className="input-field pl-10"
                        required
                      />
                      <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={signupData.admin.confirmPassword}
                        onChange={(e) => setSignupData({
                          ...signupData,
                          admin: { ...signupData.admin, confirmPassword: e.target.value }
                        })}
                        className="input-field pl-10"
                        required
                      />
                      <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button type="submit" className="btn-primary w-full">
                  Register Business
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignup(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="input-field pl-10"
                    required
                  />
                  <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="input-field pl-10"
                    required
                  />
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button type="submit" className="btn-primary w-full">
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignup(true)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Need to register your business? Sign up
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
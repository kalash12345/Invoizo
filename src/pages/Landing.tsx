import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import {
  BarChart3,
  Box,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  Package,
  Rocket,
  ShieldCheck,
  Users2
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: LayoutDashboard,
      title: 'Intuitive Dashboard',
      description: 'Get a complete overview of your business with real-time analytics and insights.'
    },
    {
      icon: FileText,
      title: 'Smart Invoicing',
      description: 'Create and manage professional invoices with automated calculations and tax handling.'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, set reorder points, and manage multiple warehouses effortlessly.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Reports',
      description: 'Generate detailed reports with customizable filters and export capabilities.'
    },
    {
      icon: Users2,
      title: 'Customer Management',
      description: 'Maintain customer profiles, track interactions, and manage relationships effectively.'
    },
    {
      icon: CreditCard,
      title: 'Payment Tracking',
      description: 'Monitor payments, manage credits, and handle multiple payment methods.'
    }
  ];

  const benefits = [
    'Reduce manual data entry by 80%',
    'Save 10+ hours per week on accounting tasks',
    'Real-time financial insights',
    'Secure cloud-based storage',
    'Automated tax calculations',
    'Multi-user access control'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 z-0" />
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-64 h-64 bg-blue-500/5 rounded-full"
            style={{ top: '10%', left: '5%' }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute w-96 h-96 bg-purple-500/5 rounded-full"
            style={{ bottom: '10%', right: '5%' }}
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-20 md:py-28">
            <div className="text-center">
              <motion.h1 
                className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Simplify Your Business Operations
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Streamline your invoicing, inventory, and business management with our all-in-one solution.
              </motion.p>
              <motion.div 
                className="flex gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 
                  hover:shadow-blue-500/30 hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Get Started
                </button>
                <button className="px-8 py-3 bg-white text-gray-700 rounded-xl font-medium shadow-lg 
                hover:bg-gray-50 transition-all duration-200 flex items-center gap-2">
                  <Globe2 className="w-5 h-5" />
                  Live Demo
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Grow</h2>
          <p className="text-lg text-gray-600">Powerful features to help you manage every aspect of your business</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div 
                  className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Icon className="w-6 h-6 text-blue-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Transform Your Business Operations
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg 
                shadow-blue-500/20 hover:shadow-blue-500/30 hover:bg-blue-700 transition-all duration-200"
              >
                Start Free Trial
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
                  <Building2 className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-branch Support</h3>
                  <p className="text-gray-600 text-sm">Manage multiple locations from a single dashboard</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl">
                  <Box className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Management</h3>
                  <p className="text-gray-600 text-sm">Real-time inventory tracking and alerts</p>
                </div>
              </div>
              <div className="space-y-6 mt-12">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
                  <p className="text-gray-600 text-sm">Enterprise-grade security for your data</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl">
                  <Users2 className="w-8 h-8 text-orange-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                  <p className="text-gray-600 text-sm">Work together seamlessly with role-based access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div 
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust Invoizo for their daily operations.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-white text-blue-600 rounded-xl font-medium shadow-lg 
            hover:bg-gray-50 transition-all duration-200"
          >
            Get Started Now
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
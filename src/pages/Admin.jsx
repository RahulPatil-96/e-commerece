import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Mail, Users, Palette, ArrowLeft } from 'lucide-react';
import AdminOverview from '@/components/admin/AdminOverview';
import ProductManager from '@/components/admin/ProductManager';
import OrdersManager from '@/components/admin/OrdersManager';
import InquiriesManager from '@/components/admin/InquiriesManager';
import UsersManager from '@/components/admin/UsersManager';
import CustomizationRulesManager from '@/components/admin/CustomizationRulesManager';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'inquiries', label: 'B2B Inquiries', icon: Mail },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'customization', label: 'Customization', icon: Palette },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-medium">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your store, products, and orders</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-4 h-4" /> Storefront
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {tab === 'overview' && <AdminOverview onNavigate={setTab} />}
        {tab === 'products' && <ProductManager />}
        {tab === 'orders' && <OrdersManager />}
        {tab === 'inquiries' && <InquiriesManager />}
        {tab === 'users' && <UsersManager />}
        {tab === 'customization' && <CustomizationRulesManager />}
      </div>
    </div>
  );
}

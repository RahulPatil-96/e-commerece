import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Mail, Users, Palette, FolderTree, Ticket, ArrowLeft } from 'lucide-react';
import AdminOverview from '@/components/admin/AdminOverview';
import ProductManager from '@/components/admin/ProductManager';
import OrdersManager from '@/components/admin/OrdersManager';
import InquiriesManager from '@/components/admin/InquiriesManager';
import UsersManager from '@/components/admin/UsersManager';
import CustomizationRulesManager from '@/components/admin/CustomizationRulesManager';
import CategoryManager from '@/components/admin/CategoryManager';
import SiteContentManager from '@/components/admin/SiteContentManager';
import CouponManager from '@/components/admin/CouponManager';
import PageMeta from '@/components/PageMeta';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'inquiries', label: 'B2B Inquiries', icon: Mail },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'customization', label: 'Customization', icon: Palette },
  { id: 'site-content', label: 'Site Content', icon: LayoutDashboard },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      <PageMeta title="Admin Control Center" description="Manage Arihant products, orders, B2B inquiries, and site content." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-accent">System Online</span>
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Admin Control Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full border border-border/80 bg-card hover:bg-secondary transition-all shadow-soft"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
        </div>
      </div>

      {/* Modern Floating Navigation Tabs */}
      <div className="flex gap-2 p-1.5 rounded-3xl bg-secondary/60 border border-border/80 overflow-x-auto no-scrollbar shadow-soft">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-lift'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <t.icon className={`w-4 h-4 ${active ? 'text-accent' : ''}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Canvas */}
      <div className="animate-fade-in pt-2">
        {tab === 'overview' && <AdminOverview onNavigate={setTab} />}
        {tab === 'products' && <ProductManager />}
        {tab === 'categories' && <CategoryManager />}
        {tab === 'orders' && <OrdersManager />}
        {tab === 'coupons' && <CouponManager />}
        {tab === 'inquiries' && <InquiriesManager />}
        {tab === 'users' && <UsersManager />}
        {tab === 'customization' && <CustomizationRulesManager />}
        {tab === 'site-content' && <SiteContentManager />}
      </div>
    </div>
  );
}

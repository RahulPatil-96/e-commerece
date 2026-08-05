import { useEffect, useState } from 'react';
import { Mail, Phone, Building2, Calendar } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['new', 'contacted', 'quoted', 'closed'];

const statusColor = (s) => ({
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  contacted: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  quoted: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  closed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
}[s] || 'bg-secondary text-muted-foreground border-border/60');

export default function InquiriesManager() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    apiClient.entities.B2BInquiry.list('-created_date', 200)
      .then((data) => setInquiries(Array.isArray(data) ? data : []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const updateStatus = async (id, status) => {
    await apiClient.entities.B2BInquiry.update(id, { status });
    toast({ title: 'Inquiry status updated' });
    fetch();
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-secondary animate-pulse rounded-3xl" />)}</div>;
  }

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border/80 rounded-3xl shadow-soft">
        <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-serif-display text-2xl font-bold">No B2B Inquiries</p>
        <p className="text-xs text-muted-foreground mt-1">Corporate quote requests submitted by enterprise clients will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((i) => (
        <div key={i.id} className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-soft hover:shadow-card transition-all duration-300">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-foreground">{i.company_name}</h3>
                  <p className="text-xs font-semibold text-muted-foreground">{i.contact_name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-medium pt-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-accent" />{i.email}</span>
                {i.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-accent" />{i.phone}</span>}
              </div>

              {(i.products || i.quantity) && (
                <div className="flex flex-wrap gap-3 text-xs pt-1">
                  {i.products && (
                    <span className="px-3 py-1 rounded-full bg-secondary border border-border/60 text-foreground font-medium">
                      Product: {i.products}
                    </span>
                  )}
                  {i.quantity && (
                    <span className="px-3 py-1 rounded-full bg-accent-soft text-accent font-bold">
                      Qty: {i.quantity}
                    </span>
                  )}
                  {i.gst_number && (
                    <span className="px-3 py-1 rounded-full bg-secondary border border-border/60 text-muted-foreground font-medium">
                      GST: {i.gst_number}
                    </span>
                  )}
                </div>
              )}

              {i.message && (
                <p className="text-xs text-muted-foreground/90 font-light bg-secondary/40 p-3 rounded-2xl border border-border/40 leading-relaxed">
                  "{i.message}"
                </p>
              )}

              <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Submitted: {i.created_date ? new Date(i.created_date).toLocaleString('en-IN') : ''}
              </p>
            </div>

<div className="shrink-0">
              <Select
                value={i.status || 'new'}
                onValueChange={(val) => updateStatus(i.id, val)}
              >
                <SelectTrigger className={`w-36 h-10 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border ${statusColor(i.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
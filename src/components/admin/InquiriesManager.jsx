import { useEffect, useState } from 'react';
import { Mail, Phone, Building2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';

const STATUSES = ['new', 'contacted', 'quoted', 'closed'];

const statusColor = (s) => ({
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-purple-100 text-purple-800',
  closed: 'bg-green-100 text-green-800',
}[s] || 'bg-secondary text-muted-foreground');

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
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-secondary animate-pulse rounded-sm" />)}</div>;
  }

  if (inquiries.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">No B2B inquiries yet.</div>;
  }

  return (
    <div className="space-y-4">
      {inquiries.map(i => (
        <div key={i.id} className="bg-card border border-border rounded-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">{i.company_name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(i.status)}`}>{i.status}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{i.contact_name}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{i.email}</span>
                {i.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{i.phone}</span>}
              </div>
              {(i.products || i.quantity) && (
                <div className="flex flex-wrap gap-4 text-sm pt-1">
                  {i.products && <span><span className="text-muted-foreground">Products:</span> {i.products}</span>}
                  {i.quantity && <span><span className="text-muted-foreground">Qty:</span> {i.quantity}</span>}
                  {i.gst_number && <span><span className="text-muted-foreground">GST:</span> {i.gst_number}</span>}
                </div>
              )}
              {i.message && <p className="text-sm text-muted-foreground pt-1">{i.message}</p>}
              <p className="text-xs text-muted-foreground/60 pt-1">{i.created_date ? new Date(i.created_date).toLocaleString('en-IN') : ''}</p>
            </div>
            <div className="shrink-0">
              <select
                value={i.status || 'new'}
                onChange={e => updateStatus(i.id, e.target.value)}
                className={`text-xs font-medium px-3 py-2 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${statusColor(i.status)}`}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
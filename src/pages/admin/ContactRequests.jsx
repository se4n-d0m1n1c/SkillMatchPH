import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';

const fetchContactRequests = async () => {
  const { data, error } = await supabase
    .from('admin_contact_requests')
    .select('id, profile_id, requester_email, reason, status, created_at, resolved_at, requester:profiles!profile_id(first_name, last_name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

const formatDate = (value) => new Date(value).toLocaleString('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const ContactRequests = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const targetStudentId = location.state?.highlightRequestStudentId || searchParams.get('student');
  const { data: requests = [], error, isLoading, isValidating, mutate } = useSWR(
    'admin-contact-requests',
    fetchContactRequests,
    { refreshInterval: 30_000 },
  );
  const [activeTab, setActiveTab] = useState('open');
  const [resolvingId, setResolvingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);

  useEffect(() => {
    if (!targetStudentId || isLoading) return undefined;

    const targetRequest = requests.find((request) => request.profile_id === targetStudentId);
    if (!targetRequest) return undefined;

    setActiveTab(targetRequest.status);
    setHighlightedRequestId(targetRequest.id);
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`contact-request-${targetRequest.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    const highlightTimer = window.setTimeout(() => setHighlightedRequestId(null), 4000);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [isLoading, location.key, requests, targetStudentId]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-contact-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_contact_requests' }, () => mutate())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  const openCount = requests.filter((request) => request.status === 'open').length;
  const visibleRequests = requests.filter((request) => request.status === activeTab);

  const resolveRequest = async (requestId) => {
    setResolvingId(requestId);
    setActionError('');
    const { error: resolveError } = await supabase.rpc('resolve_admin_contact_request', {
      target_request_id: requestId,
    });
    setResolvingId(null);

    if (resolveError) {
      setActionError(resolveError.message || 'Unable to resolve this request.');
      return;
    }

    await mutate();
  };

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Contact Requests</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review students who asked a school administrator for password help.</p>
        </div>
        <button type="button" className="invite-create-btn" onClick={() => mutate()} disabled={isValidating}>
          {isValidating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Refresh
        </button>
      </header>

      <div className="request-tabs" role="tablist" aria-label="Contact request status">
        <button type="button" role="tab" aria-selected={activeTab === 'open'} className={activeTab === 'open' ? 'active' : ''} onClick={() => setActiveTab('open')}>
          <Clock3 size={17} /> Open <span>{openCount}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'resolved'} className={activeTab === 'resolved' ? 'active' : ''} onClick={() => setActiveTab('resolved')}>
          <CheckCircle2 size={17} /> Resolved
        </button>
      </div>

      {actionError ? <p className="admin-action-error">{actionError}</p> : null}

      <div className="data-table-container contact-request-table">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Email</th><th>Request</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className="table-state">Loading contact requests…</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="table-state error">Run the admin_contact_requests.sql migration to enable this page.</td></tr>
            ) : visibleRequests.length === 0 ? (
              <tr><td colSpan="6" className="table-state">No {activeTab} contact requests.</td></tr>
            ) : visibleRequests.map((request) => {
              const name = [request.requester?.first_name, request.requester?.last_name].filter(Boolean).join(' ') || 'Student';
              return (
                <tr
                  key={request.id}
                  id={`contact-request-${request.id}`}
                  className={highlightedRequestId === request.id ? 'contact-request-row-highlighted' : ''}
                >
                  <td><strong>{name}</strong></td>
                  <td><a className="request-email-link" href={`mailto:${request.requester_email}`}><Mail size={15} />{request.requester_email}</a></td>
                  <td>Password assistance</td>
                  <td>{formatDate(request.created_at)}</td>
                  <td><span className={`request-status ${request.status}`}>{request.status}</span></td>
                  <td>
                    {request.status === 'open' ? (
                      <button type="button" className="request-resolve-btn" onClick={() => resolveRequest(request.id)} disabled={resolvingId === request.id}>
                        {resolvingId === request.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        Mark resolved
                      </button>
                    ) : request.resolved_at ? formatDate(request.resolved_at) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactRequests;

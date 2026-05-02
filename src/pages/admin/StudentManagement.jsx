import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Edit, Trash2, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      
      setStudents(students.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    } catch (err) {
      alert('Error approving student: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      
      setStudents(students.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
    } catch (err) {
      alert('Error rejecting student: ' + err.message);
    }
  };

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-management">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Student Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and manage student profiles.</p>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="social-btn"
            style={{ paddingLeft: '3rem', width: '300px', cursor: 'text' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="data-table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading students...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>User ID</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td style={{ fontWeight: 600 }}>{student.full_name || 'N/A'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{student.id}</td>
                  <td>{new Date().toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '20px', 
                      background: student.status === 'approved' ? 'rgba(74, 222, 128, 0.1)' : 
                                 student.status === 'rejected' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(251, 191, 36, 0.1)', 
                      color: student.status === 'approved' ? '#4ade80' : 
                             student.status === 'rejected' ? '#ff4d4d' : '#fbbf24',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize'
                    }}>
                      {student.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      {student.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(student.id)}
                            className="action-btn" 
                            style={{ color: 'var(--accent-teal)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(student.id)}
                            className="action-btn" 
                            style={{ color: '#ff4d4d', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button className="action-btn"><Edit size={16} /></button>
                      <button className="action-btn delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;

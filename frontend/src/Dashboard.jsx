// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, LogOut, LayoutDashboard, Loader2, 
  MapPin, Plus, X, ClipboardCheck, AlertCircle, Users 
} from 'lucide-react'; 

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState('fields'); 
  const [fields, setFields] = useState([]);
  const [appUsers, setAppUsers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  
  // FORM STATES
  const [newField, setNewField] = useState({ name: '', crop_type: '', planting_date: '', current_stage: 'Planted' });
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'agent' }); // Added full_name
  const [updateData, setUpdateData] = useState({ new_stage: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // --- DATA FETCHING ENGINE ---
  const fetchData = async () => {
    if (fields.length === 0 && appUsers.length === 0) setIsLoading(true);
    
    try {
      const token = localStorage.getItem('shamba_token');
      if (!token) { navigate('/'); return; }
      
      const header = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch Fields
      const fieldsRes = await axios.get('http://localhost:5000/api/fields', header);
      setFields(fieldsRes.data);

      // Fetch Users (Admin Only)
      if (currentTab === 'users') {
        try {
          const usersRes = await axios.get('http://localhost:5000/api/users', header);
          setAppUsers(usersRes.data);
        } catch (e) { 
          console.log("Not an admin or error fetching users."); 
        }
      }

    } catch (err) { 
      console.error("Data Sync Error:", err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [navigate, currentTab]);

  // --- BUSINESS LOGIC CALCULATIONS ---
  const totalFields = fields.length;
  const atRiskFields = fields.filter(f => f.computed_status === 'At Risk').length;
  const readyToHarvest = fields.filter(f => 
    f.current_stage && f.current_stage.toLowerCase().includes('ready')
  ).length;

  // --- EVENT HANDLERS ---
  const handleCreateField = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('shamba_token');
      await axios.post('http://localhost:5000/api/fields', newField, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setNewField({ name: '', crop_type: '', planting_date: '', current_stage: 'Planted' });
      fetchData(); 
    } catch (err) { alert("Error saving plot."); } finally { setIsSubmitting(false); }
  };

  const handleLogUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('shamba_token');
      await axios.post(`http://localhost:5000/api/fields/${selectedField.id}/updates`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsUpdateModalOpen(false);
      setUpdateData({ new_stage: '', notes: '' });
      fetchData(); 
    } catch (err) { alert("Error updating field."); } finally { setIsSubmitting(false); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('shamba_token');
      // Sending full_name along with email and role
      await axios.post('http://localhost:5000/api/users/register', newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsUserModalOpen(false);
      setNewUser({ email: '', full_name: '', role: 'agent' }); 
      fetchData(); 
    } catch (err) { alert("Failed to add user."); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={40} className="animate-spin" color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px', backgroundColor: '#f8fafc' }}>
      
      {/* 1. HEADER NAVIGATION */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sprout size={28} color="var(--primary)" />
          <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>Shamba Tracker</h1>
        </div>
        
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
            <TabBtn active={currentTab === 'fields'} onClick={() => setCurrentTab('fields')} icon={<LayoutDashboard size={16}/>} label="Dashboard" />
            <TabBtn active={currentTab === 'users'} onClick={() => setCurrentTab('users')} icon={<Users size={16}/>} label="Team" />
        </div>

        <button onClick={() => { localStorage.removeItem('shamba_token'); navigate('/'); }} style={{ width: 'auto', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        
        {/* --- TAB: FIELD MANAGEMENT --- */}
        {currentTab === 'fields' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <StatCard icon={<MapPin color="#2563eb" />} label="TOTAL PLOTS" value={totalFields} bg="#eff6ff" />
                <StatCard icon={<AlertCircle color="#ea580c" />} label="AT RISK" value={atRiskFields} bg="#fff7ed" />
                <StatCard icon={<Sprout color="#16a34a" />} label="READY" value={readyToHarvest} bg="#f0fdf4" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Field Overview</h2>
                <button onClick={() => setIsModalOpen(true)} style={{ width: 'auto', padding: '10px 20px' }}>
                  <Plus size={18} /> New Plot
                </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
                <table>
                    <thead><tr><th>Plot Name</th><th>Crop</th><th>Stage</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {fields.map(field => (
                            <tr key={field.id}>
                                <td style={{ fontWeight: '600' }}>{field.name}</td>
                                <td>{field.crop_type}</td>
                                <td><span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>{field.current_stage}</span></td>
                                <td>
                                  <span style={{ 
                                    backgroundColor: field.computed_status === 'Active' ? '#dcfce7' : '#fef08a', 
                                    color: field.computed_status === 'Active' ? '#166534' : '#854d0e', 
                                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' 
                                  }}>
                                    {field.computed_status}
                                  </span>
                                </td>
                                <td>
                                  <button onClick={() => { setSelectedField(field); setUpdateData({new_stage: field.current_stage, notes: ''}); setIsUpdateModalOpen(true); }} 
                                    style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                                    Update
                                  </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </>
        )}

        {/* --- TAB: TEAM MANAGEMENT --- */}
        {currentTab === 'users' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Team Directory</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage access levels for your agricultural agents.</p>
                </div>
                <button onClick={() => setIsUserModalOpen(true)} style={{ width: 'auto', padding: '10px 20px' }}>
                    <Plus size={18} /> Add Member
                </button>
            </div>
            
            <table>
                <thead><tr><th>Name</th><th>Email Address</th><th>Role</th><th>Joined Date</th></tr></thead>
                <tbody>
                    {appUsers.length > 0 ? appUsers.map(user => (
                        <tr key={user.id}>
                            <td style={{ fontWeight: '600' }}>{user.full_name || 'System User'}</td>
                            <td style={{ color: '#64748b' }}>{user.email}</td>
                            <td>
                              <span style={{ 
                                textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', fontWeight: '700', 
                                color: user.role === 'admin' ? '#2563eb' : '#64748b',
                                backgroundColor: user.role === 'admin' ? '#eff6ff' : '#f1f5f9',
                                padding: '4px 8px', borderRadius: '6px'
                              }}>
                                {user.role}
                              </span>
                            </td>
                            <td style={{ color: '#64748b' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                    )) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Syncing team data...</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: NEW PLOT --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Register New Plot</h3>
              <X onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer', color: '#94a3b8' }} />
            </div>
            <form onSubmit={handleCreateField} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input placeholder="Plot Identifier" required value={newField.name} onChange={(e) => setNewField({...newField, name: e.target.value})} />
              <input placeholder="Crop Variety" required value={newField.crop_type} onChange={(e) => setNewField({...newField, crop_type: e.target.value})} />
              <input type="date" required value={newField.planting_date} onChange={(e) => setNewField({...newField, planting_date: e.target.value})} />
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Planting'}</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: UPDATE INSPECTION --- */}
      {isUpdateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Update Plot</h3>
              <X onClick={() => setIsUpdateModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            <form onSubmit={handleLogUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <select value={updateData.new_stage} onChange={(e) => setUpdateData({...updateData, new_stage: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <option value="Planted">Planted</option>
                <option value="Growing">Growing</option>
                <option value="Ready for Harvest">Ready for Harvest</option>
                <option value="Harvested">Harvested</option>
              </select>
              <textarea placeholder="Inspection Notes..." required value={updateData.notes} onChange={(e) => setUpdateData({...updateData, notes: e.target.value})} style={{ padding: '12px', borderRadius: '8px', minHeight: '120px', border: '1px solid #e2e8f0' }} />
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Log Inspection'}</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD TEAM MEMBER --- */}
      {isUserModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Add Team Member</h3>
              <X onClick={() => setIsUserModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input 
                placeholder="Full Name" 
                required 
                value={newUser.full_name} 
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} 
              />
              <input 
                type="email" 
                placeholder="agent@shambarecords.com" 
                required 
                value={newUser.email} 
                onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
              />
              <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <option value="agent">Field Agent</option>
                <option value="admin">Administrator</option>
              </select>
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Invite Member'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} style={{ width: 'auto', padding: '8px 20px', background: active ? 'white' : 'transparent', color: active ? 'var(--primary)' : '#64748b', border: 'none', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: active ? '600' : '500' }}>
        {icon} {label}
    </button>
);

const StatCard = ({ icon, label, value, bg }) => (
  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ backgroundColor: bg, padding: '12px', borderRadius: '10px' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>{label}</p>
      <h3 style={{ fontSize: '24px', fontWeight: '800' }}>{value}</h3>
    </div>
  </div>
);

export default Dashboard;
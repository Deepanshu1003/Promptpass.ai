import React, { useState, useEffect } from 'react';
import PracticeSession from './PracticeSession';

// THE LOGO: A fusion of a Brain (Mind) and Book (Knowledge) with the .ai extension
export const AppLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Brain Silhouette Hemispheres */}
        <path d="M12 5a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0v-3a5 5 0 0 0-5-5Z" />
        {/* The "Book Spine" Center Line */}
        <path d="M12 7v11" stroke="#fff" strokeWidth="1.5" />
        {/* The "Pages" horizontal lines inside the brain */}
        <path d="M9 10h6M9 13h6M9 16h6" stroke="#fff" strokeWidth="1" opacity="0.7" />
        {/* The AI Neural Node at the apex */}
        <circle cx="12" cy="4" r="1.2" fill="#38bdf8" stroke="none" />
      </svg>
      {/* Zero-gap .ai branding attached directly to the logo icon */}
      <span style={{ 
        fontSize: '1.6rem', 
        fontWeight: '900', 
        color: '#38bdf8', 
        marginLeft: '-2px', 
        letterSpacing: '-1.5px',
        fontFamily: 'system-ui'
      }}>.ai</span>
    </div>
  </div>
);

export default function App() {
  const [activePlanId, setActivePlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/plans');
      setPlans(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const fileInput = e.target.question_bank?.files?.[0];
    console.log("[DEBUG] handleUpload called", {
      plan_title: e.target.plan_title?.value,
      file: fileInput ? { name: fileInput.name, size: fileInput.size, type: fileInput.type } : null,
    });
    setIsUploading(true);
    const formData = new FormData(e.target);
    for (const [key, value] of formData.entries()) {
      console.log("[DEBUG] formData entry", key, value instanceof File ? { name: value.name, size: value.size, type: value.type } : value);
    }
    try {
      const response = await fetch('http://localhost:8000/api/upload', { method: 'POST', body: formData });
      console.log("[DEBUG] upload fetch response", response.status, response.statusText);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error("[DEBUG] Failed to parse upload response as JSON", text, jsonErr);
        throw new Error(`Invalid JSON response: ${response.status} ${response.statusText}`);
      }
      console.log("[DEBUG] upload response data", data);
      if (response.ok && data.exam_plan_id) {
        await fetchPlans();
        setActivePlanId(data.exam_plan_id);
      } else {
        alert("Upload failed: " + (data.detail || JSON.stringify(data)));
      }
    } catch (err) {
      console.error("[DEBUG] upload request failed", err);
      alert("Network error. Check the browser console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("This will permanently delete this study workspace. Proceed?")) return;
    await fetch(`http://localhost:8000/api/plans/${id}`, { method: 'DELETE' });
    fetchPlans();
  };

  if (activePlanId) {
    return (
      <PracticeSession 
        planId={activePlanId} 
        plans={plans} 
        onSwitch={(id) => setActivePlanId(id)} 
        onBack={() => setActivePlanId(null)} 
      />
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Navigation / Header */}
      <nav style={{ 
        background: '#0f172a', 
        padding: '1rem 4rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AppLogo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ 
              margin: '0 0 0 15px', 
              fontSize: '1.8rem', 
              color: '#fff', 
              fontWeight: '800', 
              letterSpacing: '-0.8px' 
            }}>
              PromptPass
            </h1>
            <span style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              border: '1px solid rgba(226,232,240,0.25)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              v0
            </span>
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
          AI-Powered Certification Mastery
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '60px auto', padding: '0 20px' }}>
        
        {/* Workspace Grid Section */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#1e293b', margin: 0 }}>My Study Workspaces</h2>
            <span style={{ background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
              {plans.length} Sessions Active
            </span>
          </div>

          {plans.length === 0 ? (
             <div style={{ 
               background: '#fff', 
               padding: '60px', 
               borderRadius: '24px', 
               textAlign: 'center', 
               border: '2px dashed #cbd5e1', 
               color: '#64748b' 
             }}>
               <p style={{ fontSize: '1.1rem' }}>No study sessions found. Upload a PDF bank to initialize PromptPass AI.</p>
             </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '25px' 
            }}>
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  onClick={() => setActivePlanId(plan.id)}
                  style={{ 
                    background: '#fff', 
                    padding: '28px', 
                    borderRadius: '20px', 
                    border: '1px solid #e2e8f0', 
                    cursor: 'pointer', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                    position: 'relative',
                    transition: 'all 0.3s ease' 
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#38bdf8';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a', lineHeight: '1.4' }}>{plan.title}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                        Created {new Date(plan.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, plan.id)} 
                      style={{ 
                        background: '#fef2f2', 
                        border: 'none', 
                        padding: '10px', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', color: '#0ea5e9', fontSize: '0.9rem', fontWeight: '700' }}>
                    Open Session →
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upload Form Section */}
        <section style={{ 
          background: '#fff', 
          padding: '45px', 
          borderRadius: '24px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '10px' }}>Initialize New Workspace</h2>
          <p style={{ color: '#64748b', marginBottom: '35px', fontSize: '1.05rem' }}>Upload a PDF question bank to generate an AI-powered interactive study environment.</p>
          
          <form onSubmit={handleUpload} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1.5', minWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>WORKSPACE NAME</label>
              <input 
                name="plan_title" 
                placeholder="e.g., AWS Solutions Architect (SAA-C03)" 
                required 
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '2px solid #f1f5f9', 
                  background: '#f8fafc',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: '0.2s'
                }} 
                onFocus={e => e.target.style.borderColor = '#38bdf8'}
                onBlur={e => e.target.style.borderColor = '#f1f5f9'}
              />
            </div>
            
            <div style={{ flex: '1', minWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>PDF SOURCE</label>
              <input 
                type="file" 
                name="question_bank" 
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  border: '2px dashed #cbd5e1', 
                  background: '#f8fafc',
                  cursor: 'pointer' 
                }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={isUploading} 
              style={{ 
                width: '100%', 
                marginTop: '10px',
                padding: '18px', 
                background: isUploading ? '#94a3b8' : '#0f172a', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '14px', 
                cursor: isUploading ? 'wait' : 'pointer', 
                fontWeight: '800',
                fontSize: '1.1rem',
                transition: '0.2s',
                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)'
              }}
              onMouseOver={e => !isUploading && (e.target.style.background = '#1e293b')}
              onMouseOut={e => !isUploading && (e.target.style.background = '#0f172a')}
            >
              {isUploading ? '⚙️ EXTRACTING KNOWLEDGE...' : 'GENERATE WORKSPACE'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
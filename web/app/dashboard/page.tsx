'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeEvent } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface AttendanceRow {
  [key: string]: string;
}

interface EventStats {
  attendance: number;
  late: number;
  absence: number;
}

type TabType = '세션' | '대외활동' | '특별세션';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<{ 
    events: string[], 
    attendanceData: AttendanceRow[], 
    activeEvent: { name: string, activatedAt: string } | null,
    categories: Record<string, string>
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('세션');
  const [newEventName, setNewEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [viewingQR, setViewingQR] = useState<string | null>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    const auth = localStorage.getItem('dashboard_auth');
    if (auth === 'true') setIsAuthenticated(true);
    fetchData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Blockchain10b$') {
      setIsAuthenticated(true);
      localStorage.setItem('dashboard_auth', 'true');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || '데이터를 불러오지 못했습니다.');
      }
    } catch (err) {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (eventName: string) => {
    setProcessingEvent(eventName);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, setActive: true }),
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      alert('활성화 실패');
    } finally {
      setProcessingEvent(null);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('세션을 마감하시겠습니까? 남은 인원은 자동으로 "지각" 처리됩니다.')) return;
    setProcessingEvent('deactivating');
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deactivate: true }),
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      alert('마감 실패');
    } finally {
      setProcessingEvent(null);
    }
  };

  const handleAddEvent = async () => {
    if (!newEventName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventName: newEventName.trim(),
          category: activeTab 
        }),
      });
      if (response.ok) {
        setNewEventName('');
        await fetchData();
      } else {
        const result = await response.json();
        setError(result.error || '이벤트 추가 실패');
      }
    } catch (err) {
      setError('서버 통신 실패');
    } finally {
      setLoading(false);
    }
  };

  const getStats = (eventName: string): EventStats => {
    if (!data) return { attendance: 0, late: 0, absence: 0 };
    return data.attendanceData.reduce((acc, row) => {
      const status = row[eventName];
      if (status === 'Attendence') acc.attendance++;
      else if (status === 'Late') acc.late++;
      else if (status === 'Absence') acc.absence++;
      return acc;
    }, { attendance: 0, late: 0, absence: 0 });
  };

  const filteredEvents = data?.events.filter(event => {
    const category = data.categories[event];
    if (category) return category === activeTab;
    
    // Fallback for old events
    if (activeTab === '세션') return !event.includes('대외') && !event.includes('특별');
    return event.includes(activeTab);
  }) || [];

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card">
          <h1>Dashboard Login</h1>
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password" autoFocus />
            <button type="submit">Access Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !data) return <div className="container" style={{ color: 'white' }}>로딩 중...</div>;

  return (
    <div className="container container-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, textAlign: 'left' }}>이벤트 관리</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            placeholder={`새 ${activeTab} 이름`}
            style={{ marginBottom: 0, width: '200px', height: '45px' }}
          />
          <button onClick={handleAddEvent} disabled={loading} style={{ width: 'auto', height: '45px', padding: '0 20px' }}>
            추가
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        {(['세션', '대외활동', '특별세션'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              width: 'auto',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? 'var(--primary-color)' : 'white',
              padding: '10px 25px',
              borderRadius: '12px',
              border: activeTab === tab ? 'none' : '1px solid rgba(255,255,255,0.2)',
              boxShadow: 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredEvents.map(event => {
          const stats = getStats(event);
          const isActive = event === data?.activeEvent?.name;
          const isProcessing = event === processingEvent;

          return (
            <div key={event} className="card" style={{ padding: '2rem', border: isActive ? '2px solid #10b981' : '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'white' }}>{event}</h3>
                {isActive && <span className="event-label" style={{ background: '#10b981', color: 'white' }}>활성</span>}
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>출석</div>
                  <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#10b981' }}>{stats.attendance}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>지각</div>
                  <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#fbbf24' }}>{stats.late}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>결석</div>
                  <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#ef4444' }}>{stats.absence}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isActive ? (
                  <button 
                    onClick={handleDeactivate} 
                    disabled={processingEvent === 'deactivating'}
                    style={{ background: '#ef4444', color: 'white' }}
                  >
                    {processingEvent === 'deactivating' ? '마감 중...' : '세션 마감 (미출석자 지각처리)'}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSetActive(event)} 
                    disabled={!!data?.activeEvent || isProcessing}
                  >
                    {isProcessing ? '처리 중...' : '세션 활성화'}
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => setViewingQR(viewingQR === event ? null : event)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }}>
                    {viewingQR === event ? 'QR 닫기' : 'QR 보기'}
                  </button>
                  <a href={`${baseUrl}/?event=${encodeURIComponent(encodeEvent(event))}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem', width: '100%' }}>링크 테스트</button>
                  </a>
                </div>

                {viewingQR === event && (
                  <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '16px', textAlign: 'center' }}>
                    <QRCodeSVG value={`${baseUrl}/?event=${encodeURIComponent(encodeEvent(event))}`} size={180} includeMargin={true} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  PlusCircle, 
  Image as ImageIcon, 
  Gavel, 
  Users,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { db } from '../db/db';

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const [metrics, setMetrics] = useState({ openCases: 0, inCourt: 0, habitualCount: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const loadFromLocal = async () => {
      try {
        const cachedMetrics = await db.system.get('dashboard_metrics');
        const cachedActivity = await db.system.get('recent_activity');
        if (cachedMetrics?.value) setMetrics(cachedMetrics.value);
        if (cachedActivity?.value) setRecentActivity(cachedActivity.value);
      } catch (err) {
        console.warn('[DB] Dashboard cache load failed:', err);
      }
    };

    const fetchMetrics = async () => {
      try {
        const [
          { count: openCases },
          { count: inCourt },
          { count: habitualCount },
          { data: logs },
        ] = await Promise.all([
          supabase.from('cases').select('*', { count: 'exact', head: true }).not('status', 'in', '("Closed","Concluded")'),
          supabase.from('court_assessment').select('*', { count: 'exact', head: true }).eq('is_closed', false),
          supabase.from('habitual_register').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
          supabase.from('system_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
        ]);
        
        const newMetrics = { openCases: openCases || 0, inCourt: inCourt || 0, habitualCount: habitualCount || 0 };
        setMetrics(newMetrics);
        setRecentActivity(logs || []);
        
        // Cache for next time
        await db.system.put({ key: 'dashboard_metrics', value: newMetrics });
        await db.system.put({ key: 'recent_activity', value: logs || [] });
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      }
    };

    loadFromLocal();
    fetchMetrics();

    // Real-time subscriptions to keep dashboard metrics live
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'court_assessment' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habitual_register' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_logs' }, fetchMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const quickActions = [
    { name: t('dashboard.quickActions.createCase'), icon: PlusCircle, path: '/cases?create=true', color: 'var(--primary-color)', desc: t('dashboard.quickActions.investigationDesc') },
    { name: t('dashboard.quickActions.viewAlbum'), icon: ImageIcon, path: '/photos', color: 'var(--success-color)', desc: t('dashboard.quickActions.photoDesc') },
    { name: t('dashboard.quickActions.courtOverview'), icon: Gavel, path: '/court', color: 'var(--warning-color)', desc: t('dashboard.quickActions.courtDesc') },
    { name: t('dashboard.quickActions.habitualRecords'), icon: Users, path: '/habituals', color: 'var(--danger-color)', desc: t('dashboard.quickActions.habitualDesc') },
  ];

  return (
    <div className="u-stack" style={{ gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">
            {t('dashboard.title')}
          </h1>
          <span className="page-title-tagline">
            {t('dashboard.deptName')}
          </span>
        </div>
      </div>
      
      {/* Key Metrics */}
      <h3 className="section-subtitle">{t('dashboard.corePerformance')}</h3>
      <div className="grid-responsive">
        <Card hoverable>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard.metrics.openCases')}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--primary-color)' }}>{metrics.openCases}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(41, 128, 185, 0.1)', borderRadius: '8px' }}>
              <TrendingUp size={20} color="var(--primary-color)" />
            </div>
          </div>
        </Card>
        
        <Card hoverable>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard.metrics.inCourt')}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--success-color)' }}>{metrics.inCourt}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(39, 174, 96, 0.1)', borderRadius: '8px' }}>
              <Clock size={20} color="var(--success-color)" />
            </div>
          </div>
        </Card>
        
        <Card hoverable>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard.activeHabituals')}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--danger-color)' }}>{metrics.habitualCount}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '8px' }}>
              <AlertCircle size={20} color="var(--danger-color)" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <h3 className="section-subtitle">{t('dashboard.quickActions.title')}</h3>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} to={action.path} style={{ textDecoration: 'none' }}>
                <Card 
                  hoverable 
                  padding="20px" 
                  className="module-card"
                  style={{ height: '100%', borderLeft: `4px solid ${action.color}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="icon-container" style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px', 
                      background: `${action.color}15`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: action.color
                    }}>
                      <Icon size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{action.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{action.desc}</div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div style={{ paddingBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          {t('dashboard.recentActivity')}
        </h2>
        <Card padding="0">
          {recentActivity.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('dashboard.noActivity')}
            </div>
          ) : (
            recentActivity.map((log) => (
              <div key={log.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                      {log.action} — {log.table_name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {t('dashboard.byOfficer')}: {log.profiles?.full_name || 'Unknown Officer'}
                    </div>
                  </div>
                  <span className="badge badge-blue">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

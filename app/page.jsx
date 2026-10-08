'use client';

import React, { useState, useEffect } from 'react';

export default function HackathonDemoDashboard() {
  const [gatewayStatus, setGatewayStatus] = useState({ wallet_balance_ngn: 2000000, daily_headroom_ngn: 200000 });
  const [marketStatus, setMarketStatus] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [aiTrace, setAiTrace] = useState([]);
  const [activeTab, setActiveTab] = useState('retail');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { refreshAllData(); }, []);

  const refreshAllData = async () => {
    try {
      const gwRes = await fetch('/api/gateway');
      setGatewayStatus(await gwRes.json());
      const mkRes = await fetch('/api/market');
      setMarketStatus(await mkRes.json());
    } catch (e) { console.error(e); }
  };

  const triggerAiAgent = () => {
    setIsLoading(true);
    setAiTrace([
      "[Agent] Analyzing stock tracking levels...",
      "[Agent] Warning: 'sku_noodles_carton' running low (14 units on hand).",
      "[Agent] Dispatching restock purchase intent for 30 cartons to MandatePay..."
    ]);
    setTimeout(async () => {
      try {
        const res = await fetch('/api/gateway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer key_agent_restock' },
          body: JSON.stringify({ amount_minor: 360000, currency: 'NGN', payee_id: 'pay_market_escrow' })
        });
        const d = await res.json();
        setAuditLogs(prev => [{ ts: new Date().toLocaleTimeString(), payee: 'pay_market_escrow', amount: '₦3,600.00', decision: d.decision, reason: d.reason || 'None (Auto Allowed)' }, ...prev]);
        setAiTrace(p => [...p, `[Gateway Decision] ${d.decision} - Status: ${d.reason || 'Executed and settled.'}`]);
        refreshAllData();
      } catch (e) { console.error(e); }
      setIsLoading(false);
    }, 1200);
  };

  const toggleKillSwitch = async () => {
    await fetch('/api/gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer tok_owner_ada' },
      body: JSON.stringify({ action: 'TOGGLE_KILL_SWITCH' })
    });
    refreshAllData();
  };

  const runAttack = async (id, payee, amount, label) => {
    setAiTrace(p => [...p, `[Attack Suite] Triggering vector ${id}: ${label}...`]);
    const res = await fetch('/api/gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer key_agent_restock' },
      body: JSON.stringify({ amount_minor: amount, currency: 'NGN', payee_id: payee })
    });
    const d = await res.json();
    setAuditLogs(prev => [{ ts: new Date().toLocaleTimeString(), payee, amount: `₦${(amount / 100).toLocaleString()}`, decision: d.decision, reason: d.reason || 'Blocked' }, ...prev]);
  };

  return (
    <div style={styles.container}>
      {/* HEADER NAVBAR */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>⚡ Marketplace <span style={styles.accentText}>+ MandatePay</span></h1>
          <p style={styles.subtitle}>Wema Hackaholics 7.0 Build Environment</p>
        </div>
        <div style={styles.tabContainer}>
          <button onClick={() => setActiveTab('retail')} style={{...styles.tabBtn, ...(activeTab === 'retail' ? styles.tabActive : {})}}>🛒 Retailer App</button>
          <button onClick={() => setActiveTab('console')} style={{...styles.tabBtn, ...(activeTab === 'console' ? styles.tabActive : {})}}>🛡️ Security Console</button>
        </div>
      </header>

      {/* DASHBOARD LAYOUT GRID */}
      <div style={styles.layoutGrid}>
        <div style={styles.leftColumn}>
          {activeTab === 'retail' ? (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Ada's Inventory Control Hub</h2>
                <span style={styles.badgeYellow}>DEMO PROTOCOLS</span>
              </div>
              
              <div style={styles.metricsGrid}>
                <div style={styles.metricBlock}>
                  <p style={styles.metricLabel}>Instant Noodles Stock</p>
                  <p style={styles.metricValue}>14 Cartons</p>
                </div>
                <div style={styles.metricBlock}>
                  <p style={styles.metricLabel}>Active Pool Progress</p>
                  <p style={styles.metricValue}>{marketStatus?.pool?.committed_qty || 32} / 50</p>
                </div>
                <div style={styles.metricBlock}>
                  <p style={styles.metricLabel}>Current Unit Price</p>
                  <p style={{...styles.metricValue, color: '#10b981'}}>₦{(marketStatus?.pool?.current_unit_price_minor / 100 || 12000).toLocaleString()}</p>
                </div>
              </div>
              
              <button onClick={triggerAiAgent} disabled={isLoading} style={styles.primaryBtn}>
                {isLoading ? "⚡ Agent Processing..." : "🚀 Run AI Restock Agent"}
              </button>
              
              <div style={styles.traceTerminal}>
                <p style={styles.terminalHeader}>Autonomous Agent Trace Feed</p>
                {aiTrace.length === 0 ? (
                  <p style={styles.terminalMuted}>No logs active. Trigger agent execution loop parameters above.</p>
                ) : (
                  aiTrace.map((t, i) => <p key={i} style={styles.terminalLine}>{t}</p>)
                )}
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Firewall Gateway Policy Engine</h2>
                <button onClick={toggleKillSwitch} style={{...styles.killBtn, ...(gatewayStatus.kill_switch ? styles.killBtnActive : {})}}>
                  {gatewayStatus.kill_switch ? "⚠️ KILL SWITCH ACTIVE" : "🛑 EMERGENCY KILL SWITCH"}
                </button>
              </div>
              
              <p style={styles.sectionLabel}>Adversarial Penetration Attack Vectors</p>
              <div style={styles.attackGrid}>
                <button onClick={() => runAttack('S1', 'pay_unregistered', 9000000, 'Poisoned Invoice')} style={styles.attackBtn}><span style={{color: '#ef4444'}}>S1</span> Poisoned Out-Of-Network Payee</button>
                <button onClick={() => runAttack('S2', 'pay_primefoods', 1200000, 'Swapped Details')} style={styles.attackBtn}><span style={{color: '#ef4444'}}>S2</span> Swapped Supplier Destination</button>
                <button onClick={() => runAttack('S3', 'pay_primefoods', 12000000, 'Quantity x10')} style={styles.attackBtn}><span style={{color: '#f59e0b'}}>S3</span> Spend Cap Floor Overrun</button>
                <button onClick={() => runAttack('S4', 'pay_sunbev', 25000000, 'Velocity Attack')} style={styles.attackBtn}><span style={{color: '#ef4444'}}>S4</span> Rolling Window Cap Exhaustion</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <h2 style={styles.sidebarTitle}>Blast Radius Mitigation Profile</h2>
            <div style={styles.sidebarMetricBox}>
              <p style={styles.metricLabel}>Vault Account Balance</p>
              <p style={{fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0}}>₦{parseFloat(gatewayStatus?.wallet_balance_ngn || 2000000).toLocaleString()}</p>
            </div>
            <div style={styles.sidebarMetricBox}>
              <p style={styles.metricLabel}>Max Daily Risk Headroom Exposure</p>
              <p style={{fontSize: '20px', fontWeight: 'bold', color: '#3b82f6', margin: 0}}>₦{parseFloat(gatewayStatus?.daily_headroom_ngn || 200000).toLocaleString()}</p>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sidebarTitle}>Intent Audit Log Stream</h2>
            <div style={styles.logList}>
              {auditLogs.length === 0 ? (
                <p style={styles.terminalMuted}>No traffic data streams captured.</p>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={i} style={styles.logItem}>
                    <div>
                      <p style={{fontWeight: 'bold', color: '#ffffff', margin: 0}}>{log.payee} <span style={{fontSize: '10px', color: '#64748b'}}>({log.ts})</span></p>
                      <p style={{fontFamily: 'monospace', color: '#94a3b8', margin: '2px 0 0 0', fontSize: '12px'}}>{log.amount}</p>
                    </div>
                    <span style={log.decision === 'ALLOW' ? styles.badgeAllow : styles.badgeBlock}>{log.decision}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', margin: 0 },
  accentText: { color: '#3b82f6' },
  subtitle: { fontSize: '12px', color: '#64748b', marginTop: '4px', margin: 0 },
  tabContainer: { display: 'flex', gap: '8px', backgroundColor: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' },
  tabBtn: { background: 'none', border: 'none', color: '#94a3b8', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  tabActive: { backgroundColor: '#2563eb', color: '#ffffff', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' },
  layoutGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 },
  badgeYellow: { backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(245,158,11,0.2)' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' },
  metricBlock: { backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' },
  metricLabel: { fontSize: '12px', color: '#64748b', margin: 0, marginBottom: '6px' },
  metricValue: { fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 },
  primaryBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', width: 'fit-content' },
  traceTerminal: { marginTop: '20px', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', minHeight: '120px' },
  terminalHeader: { fontSize: '11px', color: '#475569', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '6px', marginBottom: '10px', fontFamily: 'sans-serif' },
  terminalMuted: { color: '#475569', fontStyle: 'italic', fontSize: '12px', margin: 0, textAlign: 'center', paddingTop: '20px' },
  terminalLine: { color: '#cbd5e1', fontSize: '12px', margin: '4px 0', lineHeight: '1.5' },
  sidebarTitle: { fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, marginBottom: '16px' },
  sidebarMetricBox: { backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', marginBottom: '12px' },
  killBtn: { backgroundColor: '#020617', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  killBtnActive: { backgroundColor: '#dc2626', color: '#ffffff', border: '1px solid #dc2626' },
  sectionLabel: { fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', margin: 0 },
  attackGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  attackBtn: { backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', transition: '0.2s' },
  logList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' },
  logItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' },
  badgeAllow: { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', border: '1px solid rgba(16,185,129,0.2)' },
  badgeBlock: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', border: '1px solid rgba(239,68,68,0.2)' }
};

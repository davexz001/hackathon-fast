import { NextResponse } from 'next/server';
import { Client } from 'pg';

let killSwitchActive = false;
let quarantined = false;
let blockCounter = 0;
let lastBlockTime = 0;

let walletBalanceMinor = 200000000; 
let dailyLimitMinor = 20000000;    
let currentDailySpendMinor = 0;

async function saveLogToPostgres(payee, amount, decision, reason) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('...')) return;
  
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query(
      'INSERT INTO public.audit_logs (payee, amount, decision, reason) VALUES ($1, $2, $3, $4)',
      [payee, Math.floor(amount), decision, reason]
    );
  } catch (e) {
    console.error("Database logging failure:", e.message);
  } finally {
    await client.end();
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    kill_switch: killSwitchActive,
    quarantined,
    wallet_balance_ngn: walletBalanceMinor / 100,
    daily_headroom_ngn: (dailyLimitMinor - currentDailySpendMinor) / 100
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (token !== 'key_agent_restock' && token !== 'tok_owner_ada') {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid token" } }, { status: 403 });
    }

    const body = await request.json();
    const { amount_minor, currency, payee_id, action } = body;

    if (action === "TOGGLE_KILL_SWITCH" && token === 'tok_owner_ada') {
      killSwitchActive = !killSwitchActive;
      return NextResponse.json({ success: true, kill_switch: killSwitchActive });
    }

    let decision = 'ALLOW';
    let reason = 'None (Auto Allowed)';

    if (killSwitchActive) { decision = 'BLOCK'; reason = 'KILL_SWITCH_ACTIVE'; }
    else if (currency !== 'NGN') { decision = 'BLOCK'; reason = 'CURRENCY_MISMATCH'; }
    else {
      const allowlistedPayees = ['pay_primefoods', 'pay_sunbev', 'pay_market_escrow'];
      if (!allowlistedPayees.includes(payee_id)) {
        trackBlock();
        decision = 'BLOCK'; reason = 'PAYEE_NOT_ALLOWED';
      } else if (currentDailySpendMinor + amount_minor > dailyLimitMinor) {
        trackBlock();
        decision = 'BLOCK'; reason = 'WINDOW_CAP_EXCEEDED';
      } else if (amount_minor > walletBalanceMinor) {
        trackBlock();
        decision = 'BLOCK'; reason = 'INSUFFICIENT_FUNDS';
      } else if (quarantined) { decision = 'ASK'; reason = 'QUARANTINED'; }
      else if (amount_minor > 5000000) { decision = 'ASK'; reason = 'OVER_AUTO_LIMIT'; }
    }

    if (decision === 'ALLOW') {
      walletBalanceMinor -= amount_minor;
      currentDailySpendMinor += amount_minor;
    }

    await saveLogToPostgres(payee_id || 'unknown', amount_minor || 0, decision, reason);

    return NextResponse.json({ decision, reason, remaining_balance_ngn: walletBalanceMinor / 100 });
  } catch (error) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Malformed context" } }, { status: 422 });
  }
}

function trackBlock() {
  const now = Date.now();
  if (now - lastBlockTime > 600000) blockCounter = 0;
  blockCounter++;
  lastBlockTime = now;
  if (blockCounter >= 3) quarantined = true;
}

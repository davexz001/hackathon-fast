import { NextResponse } from 'next/server';

let mockPool = {
  pool_id: "pool_noodles_1",
  sku_id: "sku_noodles_carton",
  sku_name: "Instant Noodles Carton",
  producer_id: "prd_primefoods",
  locality: "demo-locality",
  status: "open",
  moq: 50,
  committed_qty: 32,
  tiers: [{ min_qty: 1, unit_price_minor: 1200000 }, { min_qty: 50, unit_price_minor: 900000 }],
  current_unit_price_minor: 1200000
};

let mockOrders = [];

export async function GET() {
  return NextResponse.json({ pool: mockPool, total_orders_tracked: mockOrders.length, orders: mockOrders });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (token !== 'tok_owner_ada' && token !== 'key_agent_restock') {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid marketplace token" } }, { status: 403 });
    }

    const body = await request.json();
    const { action, qty } = body;

    if (action === "SIMULATE_NEIGHBORS") {
      mockPool.committed_qty += qty || 18;
      if (mockPool.committed_qty >= mockPool.moq) mockPool.current_unit_price_minor = 900000;
      return NextResponse.json({ success: true, pool: mockPool });
    }

    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Unknown action" } }, { status: 422 });
  } catch (error) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Malformed process" } }, { status: 422 });
  }
}

/**
 * x402-inspired crypto paywall for Next.js 16 App Router.
 *
 * Usage:
 *   export const GET = withCryptoPaywall(handler)
 *   export const GET = withCryptoPaywall(handler, { amountUsdc: 1.00, networks: ['polygon'] })
 *
 * Client sends:
 *   X-Payment: 0x<64-char tx hash>
 *   X-Payment-Network: polygon | base   (default: polygon)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/* ── Types ─────────────────────────────────────────────────── */

export type Network = "polygon" | "base";

export type PaywallOptions = {
  amountUsdc?: number;
  networks?: Network[];
};

type RouteHandler = (
  req: NextRequest,
  ctx: { params?: Promise<Record<string, string>> }
) => Promise<Response>;

type VerifyResult =
  | { valid: true; senderAddress: string; amountUsdc: number }
  | { valid: false };

/* ── Constants ─────────────────────────────────────────────── */

// Native USDC on each network (6 decimals)
const USDC_CONTRACTS: Record<Network, string[]> = {
  polygon: [
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // native USDC
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC.e (bridged)
  ],
  base: [
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // native USDC
  ],
};

// Primary + fallback public RPCs — no API key needed
const RPC_URLS: Record<Network, string[]> = {
  polygon: [
    process.env.POLYGON_RPC_URL ?? "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
  ],
  base: [
    process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    "https://rpc.ankr.com/base",
  ],
};

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

/* ── Helpers ───────────────────────────────────────────────── */

function usdcToBaseUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 1_000_000));
}

/** Pad an 0x-prefixed address into a 32-byte EVM log topic */
function addressToTopic(addr: string): string {
  return "0x" + addr.replace("0x", "").toLowerCase().padStart(64, "0");
}

/** Extract checksumless 20-byte address from a 32-byte topic */
function topicToAddress(topic: string): string {
  return "0x" + topic.slice(-40);
}

/* ── JSON-RPC ──────────────────────────────────────────────── */

type TxReceipt = {
  status: string; // "0x1" = success
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;
};

async function rpcRequest<T>(
  url: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

/** Try each RPC in order, return first successful result */
async function rpcWithFallback<T>(
  network: Network,
  method: string,
  params: unknown[]
): Promise<T> {
  const urls = RPC_URLS[network];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      return await rpcRequest<T>(url, method, params);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/* ── On-chain verification ─────────────────────────────────── */

async function verifyOnChain(
  txHash: string,
  network: Network,
  requiredAmountUsdc: number,
  destinationWallet: string
): Promise<VerifyResult> {
  const receipt = await rpcWithFallback<TxReceipt | null>(
    network,
    "eth_getTransactionReceipt",
    [txHash]
  );

  // Transaction not found or reverted
  if (!receipt || receipt.status !== "0x1") {
    return { valid: false };
  }

  const contracts = USDC_CONTRACTS[network];
  const destTopic = addressToTopic(destinationWallet);
  const minAmount = usdcToBaseUnits(requiredAmountUsdc);

  for (const log of receipt.logs) {
    const logAddr = log.address.toLowerCase();

    // Must be a known USDC contract on this network
    if (!contracts.includes(logAddr)) continue;

    // Must be a Transfer event with 3 topics
    if (
      log.topics.length < 3 ||
      log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC
    ) continue;

    // topics[2] = recipient address (padded)
    if (log.topics[2]?.toLowerCase() !== destTopic) continue;

    // data = uint256 amount in base units
    const amount = BigInt(log.data);
    if (amount < minAmount) continue;

    return {
      valid: true,
      senderAddress: topicToAddress(log.topics[1] ?? ""),
      amountUsdc: Number(amount) / 1_000_000,
    };
  }

  return { valid: false };
}

/* ── 402 response ──────────────────────────────────────────── */

function paymentRequiredResponse(
  amountUsdc: number,
  networks: Network[]
): NextResponse {
  const wallet = process.env.CRYPTO_DESTINATION_WALLET ?? "";
  return NextResponse.json(
    {
      error: "Payment Required",
      x402: {
        destination_wallet: wallet,
        amount_usdc: amountUsdc,
        supported_networks: networks,
        usdc_contracts: Object.fromEntries(
          networks.map((n) => [n, USDC_CONTRACTS[n]])
        ),
        how_to_pay: {
          step1: `Send ${amountUsdc} USDC to ${wallet} on ${networks.join(" or ")}`,
          step2: "Copy the transaction hash",
          step3: "Retry this request with headers:",
          headers: {
            "X-Payment": "<0x-prefixed tx hash>",
            "X-Payment-Network": `<${networks.join(" | ")}>`,
          },
        },
      },
    },
    { status: 402 }
  );
}

/* ── withCryptoPaywall HOF ─────────────────────────────────── */

export function withCryptoPaywall(
  handler: RouteHandler,
  options: PaywallOptions = {}
): RouteHandler {
  const amountUsdc = options.amountUsdc ?? 0.1;
  const networks: Network[] = options.networks ?? ["polygon", "base"];

  return async (req, ctx) => {
    const txHash = req.headers.get("x-payment")?.trim() ?? "";
    const networkRaw = (
      req.headers.get("x-payment-network") ?? "polygon"
    ).toLowerCase();

    // ── Missing header ──────────────────────────────────────
    if (!txHash) {
      return paymentRequiredResponse(amountUsdc, networks);
    }

    // ── Malformed hash ──────────────────────────────────────
    if (!TX_HASH_RE.test(txHash)) {
      return NextResponse.json(
        {
          error: "Invalid X-Payment header. Expected 0x + 64 hex chars.",
          example: "0xabc123...def456 (66 chars total)",
        },
        { status: 400 }
      );
    }

    // ── Unknown network ─────────────────────────────────────
    if (!networks.includes(networkRaw as Network)) {
      return NextResponse.json(
        { error: `Unsupported network "${networkRaw}". Use: ${networks.join(" | ")}` },
        { status: 400 }
      );
    }

    const network = networkRaw as Network;

    // ── Server config guard ─────────────────────────────────
    const destinationWallet = process.env.CRYPTO_DESTINATION_WALLET ?? "";
    if (!destinationWallet) {
      console.error("[CryptoPaywall] CRYPTO_DESTINATION_WALLET is not set");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 503 }
      );
    }

    const supabase = createServerClient();

    // ── Replay check: tx already verified? ──────────────────
    const { data: existing } = await supabase
      .from("api_payments")
      .select("id, amount, network")
      .eq("tx_hash", txHash)
      .maybeSingle();

    if (existing) {
      // Payment already on record → grant access (idempotent)
      return handler(req, ctx);
    }

    // ── On-chain verification ───────────────────────────────
    let result: VerifyResult;
    try {
      result = await verifyOnChain(
        txHash,
        network,
        amountUsdc,
        destinationWallet
      );
    } catch (err) {
      console.error("[CryptoPaywall] RPC error:", err);
      return NextResponse.json(
        {
          error: "Cannot verify transaction — RPC unavailable. Retry in a moment.",
          tx_hash: txHash,
          network,
        },
        { status: 503 }
      );
    }

    if (!result.valid) {
      return paymentRequiredResponse(amountUsdc, networks);
    }

    // ── Persist verified payment (unique constraint handles races) ──
    const { error: insertErr } = await supabase.from("api_payments").insert({
      tx_hash: txHash,
      network,
      amount: result.amountUsdc,
      sender_address: result.senderAddress,
    });

    // '23505' = unique_violation: concurrent request already inserted — still OK
    if (insertErr && insertErr.code !== "23505") {
      console.error("[CryptoPaywall] Failed to persist payment:", insertErr);
      // Payment was verified on-chain; log the error but don't block the user
    }

    return handler(req, ctx);
  };
}

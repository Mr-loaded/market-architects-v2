import React, { useState, useEffect, useCallback } from 'react'
import firebase from 'firebase/compat/app'
import 'firebase/compat/database'

// ── FIREBASE INIT ─────────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC7xNZRGA-t2rxVXn9Md1aaw42PycqE-oo",
  authDomain: "marketlengend.firebaseapp.com",
  databaseURL: "https://marketlengend-default-rtdb.firebaseio.com",
  projectId: "marketlengend",
  storageBucket: "marketlengend.firebasestorage.app",
  messagingSenderId: "637848488155",
  appId: "1:637848488159:web:5597855cc8eab35a58416a"
}
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG)
const db = firebase.database()

// ── MARKET ARCHITECTS — GAME ENGINE ──────────────────────────────────────────

const BASE_REVENUE = 5000000;
const BASE_UNIT = 80000;
const SHARES = 1000000;
const EQUITY_BASE = 8000000;

// ── INDUSTRIES ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id: 'consumer', name: 'Consumer Goods', moat: 'brand', competitor: 'disruptor', difficulty: 'Beginner', emoji: '🛍️', desc: 'Brand-driven market. Build loyalty and defend against disruptors.' },
  { id: 'tech', name: 'Technology / SaaS', moat: 'network', competitor: 'specialist', difficulty: 'Intermediate', emoji: '💻', desc: 'Network effects compound. Specialists will steal your best segments.' },
  { id: 'manufacturing', name: 'Manufacturing', moat: 'cost', competitor: 'incumbent', difficulty: 'Intermediate', emoji: '🏭', desc: 'Cost efficiency is king. Incumbents fight dirty with legal weapons.' },
  { id: 'enterprise', name: 'Enterprise Software', moat: 'switching', competitor: 'specialist', difficulty: 'Advanced', emoji: '🏢', desc: 'Switching costs lock in clients. Regulators add complexity.' },
  { id: 'pharma', name: 'Pharmaceuticals', moat: 'patents', competitor: 'incumbent', difficulty: 'Expert', emoji: '💊', desc: 'Patent protection is everything. Heavy R&D required. High reward.' },
];

// ── MOAT TYPES ────────────────────────────────────────────────────────────────
const MOAT_TYPES = {
  brand: { name: 'Brand Loyalty', start: 70, decay: 3, crisis: 30, repairLever: 'rd', emoji: '⭐', color: '#FF6B9D' },
  network: { name: 'Network Effects', start: 40, decay: 1, crisis: 25, repairLever: 'hiring', emoji: '🔗', color: '#00E5FF' },
  cost: { name: 'Cost Advantage', start: 60, decay: 2, crisis: 35, repairLever: 'ops', emoji: '💰', color: '#00FF88' },
  switching: { name: 'Switching Costs', start: 55, decay: 2, crisis: 30, repairLever: 'rd', emoji: '🔒', color: '#FFD700' },
  patents: { name: 'Patents / IP', start: 80, decay: 4, crisis: 20, repairLever: 'rd', emoji: '📋', color: '#A78BFA' },
};

// ── LEVERS ────────────────────────────────────────────────────────────────────
const LEVERS = [
  { id: 'ops', name: 'Operations', max: 10, emoji: '⚙️', color: '#00FF88', desc: 'Drives revenue growth +6% per token' },
  { id: 'rd', name: 'R&D / Moat', max: 10, emoji: '🔬', color: '#00E5FF', desc: 'Repairs moat strength +8-15pts per token' },
  { id: 'hiring', name: 'Hiring', max: 10, emoji: '👥', color: '#FFD700', desc: 'Boosts revenue +3% but adds payroll cost' },
  { id: 'pricing', name: 'Pricing Strategy', max: 10, emoji: '💵', color: '#FF6B9D', desc: 'Raises gross margin +4% per token' },
  { id: 'debt', name: 'Debt Management', max: 8, emoji: '🏦', color: '#A78BFA', desc: 'Improves current ratio and COGS efficiency' },
  { id: 'dividend', name: 'Dividend / Retain', max: 8, emoji: '📈', color: '#FB923C', desc: 'Retaining grows equity; dividends boost hype' },
];

const TOKEN_BUDGET = 20;

// ── FINANCIAL ENGINE ──────────────────────────────────────────────────────────
function computeFinancials(tokens, moatStrength, moatType, retainedEarnings, quarter) {
  const { ops = 0, rd = 0, hiring = 0, pricing = 0, debt = 0, dividend = 0 } = tokens;

  // Moat multiplier
  const moat = MOAT_TYPES[moatType];
  const moatMult = getMoatMultiplier(moatStrength, moatType);

  // Revenue
  const revenue = BASE_REVENUE * (1 + 0.06 * ops + 0.04 * pricing + 0.03 * hiring) * moatMult;

  // Gross profit
  const grossMarginBase = Math.max(0.05, 0.25 + 0.04 * pricing - 0.015 * hiring);
  const grossMarginBonus = getMoatMarginBonus(moatStrength, moatType);
  const grossProfit = revenue * (grossMarginBase + grossMarginBonus);

  // Costs
  const hireCost = hiring * BASE_UNIT * 0.4;
  const rdCost = rd * BASE_UNIT * 0.6;

  // Operating cash flow
  const opCF = (grossProfit - hireCost - rdCost) * (1 + 0.05 * debt);

  // CapEx
  const capEx = 0.12 * revenue;

  // Net borrowing
  const netBorrowing = (debt - 4) * BASE_UNIT * 0.5;

  // FCFE
  const fcfe = opCF - capEx + netBorrowing;

  // Operating profit (for RoE)
  const opProfit = grossProfit - hireCost - rdCost;

  // RoE
  const equity = EQUITY_BASE + Math.max(0, retainedEarnings);
  const roe = opProfit / equity;

  // Retained earnings update
  const dividendPayout = dividend * BASE_UNIT * 0.3;
  const newRetained = retainedEarnings + Math.max(0, opProfit - dividendPayout);

  // Current ratio
  const currentAssets = 0.3 * revenue + debt * BASE_UNIT * 0.3;
  const currentLiabilities = 0.15 * revenue + Math.max(0, (5 - debt) * BASE_UNIT * 0.4);
  const currentRatio = currentAssets / Math.max(1, currentLiabilities);

  // Intrinsic value
  const intrinsicValue = fcfe / Math.pow(1 + Math.max(0.01, roe), 5);
  const ivPerShare = intrinsicValue / SHARES;

  // Market price
  const moatPremium = rd * 0.03;
  const hypeFactor = pricing * 0.02 + (dividend > 4 ? 0.05 : 0);
  const debtRisk = Math.max(0, (8 - debt) * 0.015);
  const marketPrice = Math.max(0.01, ivPerShare * (1 + moatPremium + hypeFactor - debtRisk));

  // Net profit (simplified)
  const netProfit = opProfit * 0.7; // after 30% tax

  return {
    revenue: Math.round(revenue),
    grossProfit: Math.round(grossProfit),
    opCF: Math.round(opCF),
    fcfe: Math.round(fcfe),
    netProfit: Math.round(netProfit),
    roe: Math.round(roe * 100) / 100,
    currentRatio: Math.round(currentRatio * 100) / 100,
    intrinsicValue: Math.round(intrinsicValue),
    ivPerShare: Math.round(ivPerShare * 100) / 100,
    marketPrice: Math.round(marketPrice * 100) / 100,
    retainedEarnings: Math.round(newRetained),
    capEx: Math.round(capEx),
    hireCost: Math.round(hireCost),
    rdCost: Math.round(rdCost),
  };
}

function getMoatMultiplier(strength, moatType) {
  switch (moatType) {
    case 'brand':
      return 0.5 + (strength / 100) * 0.8;
    case 'network':
      return 1 + Math.max(0, (strength - 50) / 100) * 0.6;
    case 'cost':
      return 1 + (strength / 100) * 0.4;
    case 'switching': {
      const lockIn = 0.6 + (strength / 100) * 0.7;
      const churn = Math.max(0.02, 0.15 - strength / 1000);
      return lockIn * (1 - churn);
    }
    case 'patents':
      return 0.4 + (strength / 100) * 1.1;
    default:
      return 1;
  }
}

function getMoatMarginBonus(strength, moatType) {
  const ratio = strength / 100;
  switch (moatType) {
    case 'brand': return ratio >= 0.8 ? 0.06 : ratio >= 0.6 ? 0.03 : 0;
    case 'network': return 0;
    case 'cost': return ratio * 0.08;
    case 'switching': return ratio * 0.04;
    case 'patents': return ratio * 0.12;
    default: return 0;
  }
}

// ── MOAT ENGINE ───────────────────────────────────────────────────────────────
function computeMoatDecay(moatType, tokens, currentStrength) {
  const moat = MOAT_TYPES[moatType];
  let decay = moat.decay;

  // Reduce decay if repair lever is used
  if (moatType === 'brand' && tokens.rd >= 2) decay = 0;
  else if (moatType === 'network' && tokens.hiring >= 2 && tokens.ops >= 2) decay = 0;
  else if (moatType === 'cost' && tokens.ops >= 3) decay = 0;
  else if (moatType === 'switching' && (tokens.rd + tokens.ops) >= 5) decay = 0;
  else if (moatType === 'patents') {
    if (tokens.rd >= 4) decay = 0;
    else if (tokens.rd < 4) decay = moat.decay * 2; // doubled decay
  }

  // Repair: tokens above minimum add strength
  let repair = 0;
  if (moatType === 'brand') repair = Math.max(0, tokens.rd - 2) * 8;
  else if (moatType === 'network') repair = Math.max(0, tokens.hiring - 2 + tokens.ops - 2) * 6;
  else if (moatType === 'cost') repair = Math.max(0, tokens.ops - 3) * 7;
  else if (moatType === 'switching') repair = Math.max(0, (tokens.rd + tokens.ops) - 5) * 7;
  else if (moatType === 'patents') repair = Math.max(0, tokens.rd - 4) * 10;

  const newStrength = Math.min(100, Math.max(0, currentStrength - decay + repair));
  return { newStrength, decay, repair };
}

// ── 7-CRITERION CHECK ─────────────────────────────────────────────────────────
function checkCriteria(history, currentFinancials, moatStrength, quarter) {
  const results = {};

  // 1. Revenue growth — positive in 4 of 5 years
  if (history.length >= 4) {
    const yearlyRevenue = getYearlyValues(history, 'revenue');
    const growthCount = countPositiveGrowth(yearlyRevenue);
    results.revenueGrowth = { pass: growthCount >= 4, value: growthCount, target: 4, label: 'Revenue Growth', unit: 'of 5 years' };
  } else {
    results.revenueGrowth = { pass: false, value: 0, target: 4, label: 'Revenue Growth', unit: 'of 5 years', pending: true };
  }

  // 2. Profit growth
  if (history.length >= 4) {
    const yearlyProfit = getYearlyValues(history, 'netProfit');
    const growthCount = countPositiveGrowth(yearlyProfit);
    results.profitGrowth = { pass: growthCount >= 4, value: growthCount, target: 4, label: 'Profit Growth', unit: 'of 5 years' };
  } else {
    results.profitGrowth = { pass: false, value: 0, target: 4, label: 'Profit Growth', unit: 'of 5 years', pending: true };
  }

  // 3. Operating cash flow
  if (history.length >= 4) {
    const yearlyCF = getYearlyValues(history, 'opCF');
    const growthCount = countPositiveGrowth(yearlyCF);
    results.cashFlow = { pass: growthCount >= 4, value: growthCount, target: 4, label: 'Operating Cash Flow', unit: 'of 5 years' };
  } else {
    results.cashFlow = { pass: false, value: 0, target: 4, label: 'Cash Flow Growth', unit: 'of 5 years', pending: true };
  }

  // 4. Moat strength ≥ 50
  results.moatStrength = { pass: moatStrength >= 50, value: moatStrength, target: 50, label: 'Economic Moat', unit: '/ 100' };

  // 5. RoE ≥ 1.0x from Q5 onward
  if (quarter >= 5) {
    const roePassing = history.slice(4).every(h => h.roe >= 1.0);
    results.roe = { pass: roePassing && currentFinancials.roe >= 1.0, value: currentFinancials.roe, target: 1.0, label: 'Return on Equity', unit: 'x' };
  } else {
    results.roe = { pass: true, value: currentFinancials.roe, target: 1.0, label: 'Return on Equity', unit: 'x', pending: true };
  }

  // 6. Current ratio ≥ 1.0x
  results.currentRatio = { pass: currentFinancials.currentRatio >= 1.0, value: currentFinancials.currentRatio, target: 1.0, label: 'Current Ratio', unit: 'x' };

  // 7. IV 10–30% below market price
  const ivGap = currentFinancials.marketPrice > 0
    ? (currentFinancials.marketPrice - currentFinancials.ivPerShare) / currentFinancials.marketPrice
    : 0;
  results.ivGap = {
    pass: ivGap >= 0.10 && ivGap <= 0.30,
    value: Math.round(ivGap * 100),
    target: '10-30',
    label: 'Intrinsic Value Discount',
    unit: '%',
  };

  const allPass = Object.values(results).every(r => r.pass);
  const passCount = Object.values(results).filter(r => r.pass).length;

  return { criteria: results, allPass, passCount };
}

function getYearlyValues(history, field) {
  const years = [];
  for (let y = 0; y < 5; y++) {
    const quarterHistory = history.filter(h => h.quarter >= y * 4 + 1 && h.quarter <= (y + 1) * 4);
    if (quarterHistory.length > 0) {
      const avg = quarterHistory.reduce((s, h) => s + (h[field] || 0), 0) / quarterHistory.length;
      years.push(avg);
    }
  }
  return years;
}

function countPositiveGrowth(values) {
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) count++;
  }
  return count;
}

// ── COMPETITOR AI ─────────────────────────────────────────────────────────────
function runCompetitorAI(archetype, playerState, quarter) {
  const attacks = [];
  const { moatStrength, moatType, roe, opCF, fcfe } = playerState;

  if (archetype === 'disruptor') {
    if (moatStrength < 50) attacks.push({ type: 'price_undercut', moatDmg: -10, revenueDmg: -0.08, duration: 1, desc: 'Price-undercut campaign launched!', emoji: '⚡' });
    if (moatStrength < 35) attacks.push({ type: 'clone', moatDmg: -15, revenueDmg: -0.12, duration: 2, desc: 'Core product feature copied!', emoji: '📋' });
    if (roe < 1.0) attacks.push({ type: 'fundraise', moatDmg: 0, priceDmg: -0.12, duration: 1, desc: 'Competitor public fundraise announced!', emoji: '💰' });
    if (opCF < 0) attacks.push({ type: 'supplier', moatDmg: 0, cogsDmg: 0.15, duration: 3, desc: 'Key supplier acquired by competitor!', emoji: '🔗' });
  }

  if (archetype === 'incumbent' && quarter % 4 === 0) {
    if (opCF < 2000000) attacks.push({ type: 'legal', moatDmg: 0, fcfeDmg: -1500000, duration: 2, desc: 'Patent challenge filed against you!', emoji: '⚖️' });
    if (moatType === 'brand' && moatStrength < 45) attacks.push({ type: 'ad_campaign', moatDmg: -12, duration: 2, desc: 'Mass advertising campaign against your brand!', emoji: '📺' });
    if (moatType === 'patents' && moatStrength < 40) attacks.push({ type: 'workaround', moatDmg: -20, duration: 2, desc: 'Competitor patents around your IP!', emoji: '🔄' });
    attacks.push({ type: 'lobbying', desc: 'Lobbying event — regulatory change incoming', emoji: '🏛️', regulatory: true });
  }

  if (archetype === 'specialist') {
    if (playerState.pricingTokens >= 4) attacks.push({ type: 'premium_steal', revenueDmg: -0.15, duration: 2, desc: 'Specialist targeting your premium segment!', emoji: '🎯' });
    if (moatType === 'switching' && moatStrength < 50) attacks.push({ type: 'migration_tool', moatDmg: -12, revenueDmg: -0.18, duration: 2, desc: 'Migration tool released for your customers!', emoji: '🔓' });
    if (roe >= 1.5) attacks.push({ type: 'talent_poach', hireCostMult: 1.5, duration: 3, desc: 'Specialist poaching your key talent!', emoji: '💼' });
    if (moatType === 'network' && moatStrength < 40) attacks.push({ type: 'competing_network', moatDmg: -15, revenueDmg: -0.10, duration: 2, desc: 'Competing network launched in your region!', emoji: '🌐' });
  }

  return attacks;
}

// ── EVENT CARD SYSTEM ─────────────────────────────────────────────────────────
const EVENT_CARDS = {
  brand: [
    { id: 'viral_brand', name: 'Viral Brand Moment', type: 'opportunity', emoji: '🌟', effect: { moat: 10, revGrowth: 0.06 }, duration: 1, prob: 0.08, desc: 'Your brand goes viral this quarter!', response: ['Invest 2 R&D tokens to lock in lift permanently', 'Ride the wave naturally'] },
    { id: 'pr_scandal', name: 'PR Scandal Breaks', type: 'crisis', emoji: '💥', effect: { moat: -15, revGrowth: -0.10 }, duration: 2, prob: 0.06, desc: 'Negative press is damaging your brand.', response: ['Redirect 3 tokens to R&D to repair brand', 'Offer pricing discount to recover moat'] },
    { id: 'counterfeit', name: 'Counterfeit Goods Flood', type: 'warning', emoji: '⚠️', effect: { moat: -8, marginDmg: -0.04 }, duration: 3, prob: 0.05, desc: 'Fakes are undermining your brand value.', response: ['Legal action (1 debt token)', 'Accept margin drag and invest in authenticity'] },
    { id: 'celebrity', name: 'Celebrity Endorsement', type: 'opportunity', emoji: '⭐', effect: { moat: 12, hype: 0.08 }, duration: 1, prob: 0.07, desc: 'A major celebrity wants to partner!', response: ['Lock in with 1 R&D token', 'Take the free exposure'] },
    { id: 'misconduct', name: 'Founder Misconduct', type: 'crisis', emoji: '🚨', effect: { moat: -20, hireCostMult: 1.3 }, duration: 2, prob: 0.03, desc: 'Leadership crisis threatens company culture.', response: ['2 R&D + 1 hiring token for crisis management', 'Public apology and restructure'] },
  ],
  network: [
    { id: 'viral_growth', name: 'Viral User Growth Surge', type: 'opportunity', emoji: '🚀', effect: { moat: 15, userGrowth: 0.25 }, duration: 1, prob: 0.09, desc: 'Explosive user acquisition this quarter!', response: ['3 extra Ops tokens to capitalise', 'Maintain current pace'] },
    { id: 'breach', name: 'Platform Security Breach', type: 'crisis', emoji: '🔓', effect: { moat: -18, churnMult: 1.2 }, duration: 3, prob: 0.05, desc: 'Data breach has triggered user exodus.', response: ['4 R&D tokens immediately', 'Transparent disclosure to halve churn'] },
    { id: 'free_tier', name: 'Competitor Free Tier', type: 'warning', emoji: '💸', effect: { moat: -10, userGrowthDmg: -0.30 }, duration: 2, prob: 0.08, desc: 'Competitor goes free — threatening your growth.', response: ['Match with freemium (1 pricing token)', 'Accelerate premium features'] },
    { id: 'api_partner', name: 'API Ecosystem Partnership', type: 'opportunity', emoji: '🤝', effect: { moat: 10, fcfeBoost: 600000 }, duration: 1, prob: 0.06, desc: 'Major platform wants to integrate with you!', response: ['2 R&D tokens to deepen integration', 'Accept as-is'] },
    { id: 'data_mandate', name: 'Regulatory Data-Sharing Mandate', type: 'crisis', emoji: '⚖️', effect: { moat: -12, switchingMoat: -12 }, duration: 2, prob: 0.04, desc: 'Government mandates data portability.', response: ['1 debt token for legal', 'Build retention features with Ops'] },
  ],
  cost: [
    { id: 'material_shock', name: 'Raw Material Price Shock', type: 'crisis', emoji: '📈', effect: { cogsDmg: 0.18, marginDmg: -0.08 }, duration: 2, prob: 0.10, desc: 'Commodity prices surge — squeezing margins.', response: ['Raise prices (1 pricing) or find alternative supplier (1 Ops)', 'Absorb temporarily'] },
    { id: 'automation', name: 'Automation Breakthrough', type: 'opportunity', emoji: '🤖', effect: { moat: 10, marginPerm: 0.08 }, duration: 1, prob: 0.06, desc: 'New tech enables significant cost savings!', response: ['2 Ops tokens to lock in permanently', 'Implement gradually'] },
    { id: 'supplier_acquired', name: 'Key Supplier Acquired', type: 'warning', emoji: '⛓️', effect: { cogsDmg: 0.10, moat: -8 }, duration: 3, prob: 0.05, desc: 'Your best supplier is now owned by a competitor.', response: ['Alternative supplier (1 Ops)', 'Vertical integration (2 debt tokens)'] },
    { id: 'trade_deal', name: 'Trade Deal Signed', type: 'opportunity', emoji: '🤝', effect: { cogsSave: 0.12, moat: 8 }, duration: 4, prob: 0.05, desc: 'New trade agreement cuts your input costs!', response: ['Reinvest savings into Ops', 'Use for debt repayment'] },
    { id: 'energy_spike', name: 'Energy Cost Spike', type: 'crisis', emoji: '⚡', effect: { cfDmg: -0.20 }, duration: 2, prob: 0.07, desc: 'Energy costs are crushing your operating cash flow.', response: ['Forward contracts (1 debt token)', 'Temporarily cut 1 hiring token'] },
  ],
  switching: [
    { id: 'migration_tool', name: 'Competitor Migration Tool', type: 'crisis', emoji: '🔓', effect: { moat: -15, retentionDmg: -0.18 }, duration: 2, prob: 0.08, desc: 'Competitor makes it easy for clients to leave!', response: ['4 R&D tokens + long-term contract discounts (1 pricing)', 'Enhance integration depth'] },
    { id: 'enterprise_contract', name: 'Enterprise Multi-Year Contract', type: 'opportunity', emoji: '📝', effect: { moat: 12, fcfeBoost: 900000 }, duration: 4, prob: 0.07, desc: 'Large enterprise wants a multi-year commitment!', response: ['Accept and deepen integration (1 R&D)', 'Negotiate better terms first'] },
    { id: 'data_portability', name: 'Data Portability Regulation', type: 'warning', emoji: '⚖️', effect: { moat: -10 }, duration: 0, prob: 0.05, desc: 'New regulation requires data export support.', response: ['1 debt token for compliance', 'Pivot to workflow integration'] },
    { id: 'api_upsell', name: 'API Upsell Opportunity', type: 'opportunity', emoji: '🔌', effect: { revBoost: 0.12, moat: 8 }, duration: 2, prob: 0.08, desc: 'Existing clients want deeper API integration!', response: ['2 R&D tokens for expansion', 'Pilot with top clients'] },
    { id: 'mass_exodus', name: 'Mass Enterprise Client Exodus', type: 'crisis', emoji: '🚪', effect: { revDmg: -0.35 }, duration: 1, prob: 0.15, crisisOnly: true, desc: 'Your three largest clients are leaving!', response: ['All tokens to R&D/moat + Ops', 'Emergency pricing concessions'] },
  ],
  patents: [
    { id: 'new_patent', name: 'New Patent Awarded', type: 'opportunity', emoji: '📜', effect: { moat: 20 }, duration: 1, prob: 0.08, desc: 'Major patent approved — competitors blocked!', response: ['File continuation patents (2 R&D)', 'Defend existing portfolio'] },
    { id: 'patent_invalid', name: 'Patent Invalidation Ruling', type: 'crisis', emoji: '⚖️', effect: { moat: -25 }, duration: 1, prob: 0.05, desc: 'Court rules your key patent invalid!', response: ['Appeal (2 debt tokens, 3Q delay)', 'Pivot to new IP (4 R&D over 2Q)'] },
    { id: 'licensing', name: 'Licensing Revenue Deal', type: 'opportunity', emoji: '💰', effect: { fcfePerQ: 500000 }, duration: 4, prob: 0.07, desc: 'Another company wants to license your IP!', response: ['Accept — use FCFE for R&D', 'Negotiate exclusivity premium'] },
    { id: 'generic_entry', name: 'Generic Market Entry', type: 'crisis', emoji: '💊', effect: { revDmg: -0.30 }, duration: 3, prob: 0.20, crisisOnly: true, desc: 'Generics are flooding your market segment!', response: ['Next-gen product (4 R&D tokens)', 'Compete on service not price'] },
    { id: 'reg_delay', name: 'Regulatory Approval Delayed', type: 'crisis', emoji: '🔴', effect: { fcfeDmg: -800000 }, duration: 1, prob: 0.06, desc: 'Regulatory approval pushed back 2 quarters.', response: ['Legal acceleration (1 debt)', 'Launch in unregulated markets (1 Ops)'] },
  ],
  universal: [
    { id: 'recession', name: 'Recession Quarter', type: 'market', emoji: '📉', effect: { revDmg: -0.15, aiPause: true }, duration: 1, prob: 0.08, desc: 'Economic recession hits all industries.', response: ['Spend debt tokens to reduce liabilities', 'Maintain moat investment — recover 2x faster'] },
    { id: 'boom', name: 'Industry Boom Quarter', type: 'market', emoji: '🚀', effect: { revBoost: 0.18, aiAggressive: true }, duration: 1, prob: 0.08, desc: 'Industry boom — but new entrants are watching.', response: ['Spend ≥3 R&D tokens even during boom', 'Expand operations aggressively'] },
    { id: 'talent_exodus', name: 'Key Talent Exodus', type: 'market', emoji: '👋', effect: { hireCostMult: 1.25, moat: -8 }, duration: 1, prob: 0.05, desc: 'Top talent is leaving the industry.', response: ['2 hiring + 1 R&D tokens', 'Offer retention bonuses via dividend lever'] },
  ],
};

function drawEventCard(industry, moatType, moatStrength, consecutiveInvestment) {
  // Get relevant cards
  const moatCards = EVENT_CARDS[moatType] || [];
  const universalCards = EVENT_CARDS.universal;
  const allCards = [...moatCards, ...universalCards];

  // Filter by crisis-only if moat is in danger
  const moat = MOAT_TYPES[moatType];
  const inCrisis = moatStrength < moat.crisis;

  // Weight probabilities
  const weighted = allCards.map(card => {
    let prob = card.prob;
    if (card.crisisOnly && !inCrisis) prob = 0;
    if (card.type === 'crisis' && inCrisis) prob *= 2;
    if (card.type === 'opportunity' && consecutiveInvestment >= 3) prob *= 1.5;
    return { card, prob };
  });

  // Weighted random selection
  const total = weighted.reduce((s, w) => s + w.prob, 0);
  let rand = Math.random() * total;
  for (const { card, prob } of weighted) {
    rand -= prob;
    if (rand <= 0) return card;
  }
  return universalCards[0]; // fallback
}

// ── SCORING ───────────────────────────────────────────────────────────────────
function computeIPOScore(criteria, ivGap) {
  const passCount = Object.values(criteria).filter(c => c.pass).length;
  const allPass = passCount === 7;

  if (!allPass) {
    if (passCount >= 6) return { tier: 'Near Miss', stars: 2, desc: 'No IPO — 6 of 7 criteria met' };
    if (passCount >= 4) return { tier: 'Restructure', stars: 1, desc: 'Company survives but does not IPO' };
    return { tier: 'Bankruptcy', stars: 0, desc: 'Company eliminated' };
  }

  if (ivGap >= 20 && ivGap <= 30) return { tier: 'Undervalued Gem', stars: 5, desc: 'Perfect valuation — maximum bonus!' };
  if (ivGap >= 10 && ivGap < 20) return { tier: 'Solid Business', stars: 4, desc: 'Strong IPO at good valuation' };
  return { tier: 'IPO Eligible', stars: 3, desc: 'Eligible for IPO — fair valuation' };
}

function fmt(n) {
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + Math.round(n).toLocaleString();
}


import React, { useState, useEffect, useCallback } from 'react'

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  bg: '#050A14', card: '#0D1627', surface: '#111D35',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  text: '#E8EDF5', muted: '#4a6080', dim: '#2a3a55',
  gold: '#FFD700', orange: '#FB923C', green: '#00FF88',
  cyan: '#00E5FF', red: '#FF4757', purple: '#A78BFA',
  pink: '#FF6B9D', yellow: '#FDE68A',
}

const css = {
  card: { background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 16 },
  btn: (color = T.cyan) => ({ padding: '12px 20px', background: `${color}18`, border: `1px solid ${color}`, borderRadius: 12, color, fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }),
  pill: (color) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}44`, fontWeight: 600 }),
}

// ── STAR DISPLAY ──────────────────────────────────────────────────────────────
function Stars({ count }) {
  return React.createElement('span', null, ...Array.from({ length: 5 }, (_, i) =>
    React.createElement('span', { key: i, style: { color: i < count ? T.gold : T.dim, fontSize: 16 } }, '★')
  ))
}

// ── CRITERION ROW ─────────────────────────────────────────────────────────────
function CriterionRow({ criterion, compact }) {
  const c = criterion
  if (!c) return null
  const color = c.pass ? T.green : c.pending ? T.muted : T.red
  return React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: compact ? '5px 0' : '8px 0', borderBottom: `1px solid ${T.border}` } },
    React.createElement('div', null,
      React.createElement('div', { style: { fontSize: compact ? 11 : 12, color: T.text, fontWeight: 600 } }, c.label),
      React.createElement('div', { style: { fontSize: 10, color: T.muted } }, `Target: ${c.target} ${c.unit}`)
    ),
    React.createElement('div', { style: { textAlign: 'right' } },
      React.createElement('div', { style: { fontSize: compact ? 12 : 14, fontWeight: 700, color, fontFamily: 'monospace' } },
        c.pending ? '—' : `${c.value} ${c.unit}`
      ),
      React.createElement('span', { style: css.pill(color) }, c.pending ? 'Pending' : c.pass ? '✓ Pass' : '✗ Fail')
    )
  )
}

// ── MOAT METER ────────────────────────────────────────────────────────────────
function MoatMeter({ moatType, strength }) {
  const moat = MOAT_TYPES[moatType]
  const danger = strength < moat.crisis
  const warning = strength < moat.crisis + 15
  const color = danger ? T.red : warning ? T.orange : moat.color
  const pct = (strength / 100) * 100

  return React.createElement('div', null,
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
      React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: T.text } }, `${moat.emoji} ${moat.name}`),
      React.createElement('span', { style: { fontSize: 13, fontWeight: 800, color, fontFamily: 'monospace' } }, `${strength}/100`)
    ),
    React.createElement('div', { style: { height: 8, background: T.surface, borderRadius: 4, overflow: 'hidden', position: 'relative' } },
      React.createElement('div', { style: { height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s, background 0.3s', boxShadow: danger ? `0 0 8px ${T.red}` : 'none' } })
    ),
    danger && React.createElement('div', { style: { fontSize: 10, color: T.red, marginTop: 4, fontWeight: 600, animation: 'pulse 1s infinite' } }, '⚠️ CRISIS THRESHOLD BREACHED')
  )
}

// ── TOKEN SLIDER ──────────────────────────────────────────────────────────────
function TokenSlider({ lever, value, onChange, remaining, disabled }) {
  return React.createElement('div', { style: { marginBottom: 14 } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
      React.createElement('div', null,
        React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: T.text } }, `${lever.emoji} ${lever.name}`),
        React.createElement('div', { style: { fontSize: 10, color: T.muted } }, lever.desc)
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement('button', {
          onClick: () => value > 0 && onChange(value - 1),
          disabled: value <= 0 || disabled,
          style: { width: 28, height: 28, borderRadius: '50%', border: `1px solid ${T.border2}`, background: T.surface, color: T.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }
        }, '−'),
        React.createElement('span', { style: { fontSize: 18, fontWeight: 800, color: lever.color, fontFamily: 'monospace', minWidth: 20, textAlign: 'center' } }, value),
        React.createElement('button', {
          onClick: () => value < lever.max && remaining > 0 && onChange(value + 1),
          disabled: value >= lever.max || remaining <= 0 || disabled,
          style: { width: 28, height: 28, borderRadius: '50%', border: `1px solid ${lever.color}44`, background: `${lever.color}18`, color: lever.color, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }
        }, '+')
      )
    ),
    React.createElement('div', { style: { height: 4, background: T.surface, borderRadius: 2 } },
      React.createElement('div', { style: { height: '100%', width: `${(value / lever.max) * 100}%`, background: lever.color, borderRadius: 2 } })
    )
  )
}

// ── EVENT CARD MODAL ──────────────────────────────────────────────────────────
function EventCardModal({ card, onRespond }) {
  if (!card) return null
  const typeColor = card.type === 'crisis' ? T.red : card.type === 'opportunity' ? T.green : card.type === 'warning' ? T.orange : T.cyan

  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.95)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { ...css.card, maxWidth: 400, width: '100%', border: `1px solid ${typeColor}44` } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 48 } }, card.emoji),
        React.createElement('div', { style: css.pill(typeColor) }, card.type.toUpperCase()),
        React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: T.text, marginTop: 8 } }, card.name),
        React.createElement('div', { style: { fontSize: 13, color: T.muted, marginTop: 6, lineHeight: 1.6 } }, card.desc)
      ),
      React.createElement('div', { style: { marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 } }, 'Choose Your Response:'),
        card.response && card.response.map((r, i) =>
          React.createElement('button', {
            key: i,
            onClick: () => onRespond(i),
            style: { ...css.btn(i === 0 ? typeColor : T.muted), marginBottom: 8, textAlign: 'left', fontSize: 12 }
          }, `${i + 1}. ${r}`)
        )
      )
    )
  )
}

// ── COMPETITOR ATTACK MODAL ────────────────────────────────────────────────────
function AttackModal({ attacks, onDismiss }) {
  if (!attacks || attacks.length === 0) return null

  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.95)', zIndex: 998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { ...css.card, maxWidth: 400, width: '100%', border: `1px solid ${T.red}44` } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 36 } }, '⚔️'),
        React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: T.red } }, 'Competitor Attack!'),
      ),
      attacks.map((a, i) =>
        React.createElement('div', { key: i, style: { background: T.surface, borderRadius: 10, padding: 12, marginBottom: 8 } },
          React.createElement('div', { style: { fontSize: 18 } }, a.emoji),
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: T.text } }, a.desc),
          a.moatDmg && React.createElement('div', { style: { fontSize: 11, color: T.red } }, `Moat: ${a.moatDmg}`),
          a.revenueDmg && React.createElement('div', { style: { fontSize: 11, color: T.red } }, `Revenue: ${(a.revenueDmg * 100).toFixed(0)}% this quarter`),
        )
      ),
      React.createElement('button', { onClick: onDismiss, style: css.btn(T.red) }, 'Prepare My Response →')
    )
  )
}

// ── QUARTER RESULTS MODAL ─────────────────────────────────────────────────────
function QuarterResultsModal({ results, onContinue }) {
  if (!results) return null
  const { financials, moatChange, criteria } = results
  const passCount = Object.values(criteria.criteria).filter(c => c.pass).length

  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.97)', zIndex: 997, display: 'flex', flexDirection: 'column', padding: 20, overflowY: 'auto' } },
    React.createElement('div', { style: { maxWidth: 400, margin: '0 auto', width: '100%' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 13, color: T.muted } }, 'Quarter Complete'),
        React.createElement('div', { style: { fontSize: 20, fontWeight: 800, color: T.gold } }, 'Financial Results'),
        React.createElement('div', { style: css.pill(passCount === 7 ? T.green : passCount >= 5 ? T.gold : T.orange) }, `${passCount}/7 criteria passing`)
      ),
      // Financials grid
      React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 } }, 'This Quarter'),
        [
          ['Revenue', fmt(financials.revenue), T.green],
          ['Gross Profit', fmt(financials.grossProfit), T.cyan],
          ['Operating CF', fmt(financials.opCF), financials.opCF >= 0 ? T.green : T.red],
          ['FCFE', fmt(financials.fcfe), financials.fcfe >= 0 ? T.green : T.red],
          ['RoE', `${financials.roe}x`, financials.roe >= 1 ? T.green : T.red],
          ['Current Ratio', `${financials.currentRatio}x`, financials.currentRatio >= 1 ? T.green : T.red],
        ].map(([label, value, color]) =>
          React.createElement('div', { key: label, style: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` } },
            React.createElement('span', { style: { fontSize: 12, color: T.muted } }, label),
            React.createElement('span', { style: { fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace' } }, value)
          )
        )
      ),
      // Moat change
      React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 } }, 'Moat Update'),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
          React.createElement('span', { style: { fontSize: 12, color: T.muted } }, 'Decay'),
          React.createElement('span', { style: { color: T.red, fontFamily: 'monospace', fontWeight: 700 } }, `-${moatChange.decay}`)
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
          React.createElement('span', { style: { fontSize: 12, color: T.muted } }, 'Repair'),
          React.createElement('span', { style: { color: T.green, fontFamily: 'monospace', fontWeight: 700 } }, `+${moatChange.repair}`)
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
          React.createElement('span', { style: { fontSize: 12, color: T.muted } }, 'New Strength'),
          React.createElement('span', { style: { color: T.gold, fontFamily: 'monospace', fontWeight: 700 } }, moatChange.newStrength)
        )
      ),
      React.createElement('button', { onClick: onContinue, style: { ...css.btn(T.gold), fontSize: 15, padding: 14 } }, 'Continue to Next Quarter →')
    )
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('lobby') // lobby | setup | game | results
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [roomData, setRoomData] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [tokens, setTokens] = useState({ ops: 0, rd: 0, hiring: 0, pricing: 0, debt: 4, dividend: 0 })
  const [eventCard, setEventCard] = useState(null)
  const [attacks, setAttacks] = useState([])
  const [quarterResults, setQuarterResults] = useState(null)
  const [toast, setToast] = useState(null)
  const [projectedFinancials, setProjectedFinancials] = useState(null)

  // Toast helper
  const showToast = useCallback((msg, color = T.cyan) => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Token total
  const tokenTotal = Object.values(tokens).reduce((s, v) => s + v, 0)
  const remaining = TOKEN_BUDGET - tokenTotal

  // Update projected financials when tokens change
  useEffect(() => {
    if (!gameState) return
    const proj = computeFinancials(tokens, gameState.moatStrength, gameState.moatType, gameState.retainedEarnings, gameState.quarter)
    setProjectedFinancials(proj)
  }, [tokens, gameState])

  // Firebase room subscription
  useEffect(() => {
    if (!roomCode) return
    const ref = db.ref(`ma_rooms/${roomCode}`)
    ref.on('value', snap => {
      const data = snap.val()
      if (!data) return
      setRoomData(data)
      // If game started, load our player state
      if (data.status === 'playing' && data.players && data.players[playerName]) {
        setGameState(data.players[playerName])
        if (data.status === 'playing' && screen === 'lobby') setScreen('game')
      }
    })
    return () => ref.off()
  }, [roomCode, playerName])

  // ── CREATE ROOM ──────────────────────────────────────────────────────────────
  async function createRoom() {
    if (!playerName.trim()) { showToast('Enter your name first!', T.red); return }
    const code = Math.random().toString(36).slice(2, 7).toUpperCase()
    setRoomCode(code)
    setIsHost(true)
    await db.ref(`ma_rooms/${code}`).set({
      code, host: playerName, status: 'waiting',
      players: { [playerName]: { name: playerName, ready: false } },
      createdAt: Date.now()
    })
    setScreen('setup')
    showToast(`Room created: ${code}`, T.green)
  }

  // ── JOIN ROOM ────────────────────────────────────────────────────────────────
  async function joinRoom(code) {
    if (!playerName.trim()) { showToast('Enter your name first!', T.red); return }
    const snap = await db.ref(`ma_rooms/${code}`).once('value')
    const data = snap.val()
    if (!data) { showToast('Room not found!', T.red); return }
    if (data.status !== 'waiting') { showToast('Game already started!', T.red); return }
    setRoomCode(code)
    setIsHost(false)
    await db.ref(`ma_rooms/${code}/players/${playerName}`).set({ name: playerName, ready: false })
    setScreen('setup')
    showToast(`Joined room ${code}!`, T.green)
  }

  // ── SELECT INDUSTRY & MOAT ───────────────────────────────────────────────────
  async function startGame(industry, moatType, competitor) {
    const moat = MOAT_TYPES[moatType]
    const initialState = {
      name: playerName,
      industry: industry.id,
      moatType,
      competitor,
      quarter: 1,
      moatStrength: moat.start,
      retainedEarnings: 0,
      history: [],
      activeEffects: [],
      negativeQuarters: 0,
      currentRatio: 1.2,
      status: 'active',
      consecutiveRDInvestment: 0,
      pricingTokens: 0,
    }
    await db.ref(`ma_rooms/${roomCode}/players/${playerName}`).set(initialState)
    if (isHost) {
      await db.ref(`ma_rooms/${roomCode}/status`).set('playing')
    }
    setGameState(initialState)
    setScreen('game')
    showToast('Game started! Allocate your tokens.', T.gold)
  }

  // ── CONFIRM QUARTER ──────────────────────────────────────────────────────────
  async function confirmQuarter() {
    if (tokenTotal > TOKEN_BUDGET) { showToast('Too many tokens! Max 20.', T.red); return }
    if (!gameState) return

    // 1. Run competitor AI
    const aiAttacks = runCompetitorAI(gameState.competitor, { ...gameState, pricingTokens: tokens.pricing }, gameState.quarter)

    // 2. Show attacks first
    if (aiAttacks.length > 0) {
      setAttacks(aiAttacks)
      return // Wait for player to dismiss
    }

    // 3. Draw event card
    const card = drawEventCard(gameState.industry, gameState.moatType, gameState.moatStrength, gameState.consecutiveRDInvestment)
    setEventCard(card)
  }

  function dismissAttacks() {
    setAttacks([])
    // Now draw event card
    const card = drawEventCard(gameState.industry, gameState.moatType, gameState.moatStrength, gameState.consecutiveRDInvestment)
    setEventCard(card)
  }

  function respondToEvent(responseIndex) {
    setEventCard(null)
    resolveQuarter(responseIndex)
  }

  // ── RESOLVE QUARTER ──────────────────────────────────────────────────────────
  async function resolveQuarter(eventResponse) {
    const state = gameState

    // Apply attack effects to tokens/state
    let moatDamage = 0
    for (const attack of attacks) {
      if (attack.moatDmg) moatDamage += attack.moatDmg
    }

    // Compute financials
    const financials = computeFinancials(tokens, state.moatStrength + moatDamage, state.moatType, state.retainedEarnings, state.quarter)

    // Compute moat decay/repair
    const moatChange = computeMoatDecay(state.moatType, tokens, Math.max(0, state.moatStrength + moatDamage))

    // Update history
    const newHistory = [...(state.history || []), { quarter: state.quarter, ...financials }]

    // Check criteria
    const criteria = checkCriteria(newHistory, financials, moatChange.newStrength, state.quarter)

    // Check for crisis
    const moat = MOAT_TYPES[state.moatType]
    let crisisTriggered = moatChange.newStrength < moat.crisis && state.moatStrength >= moat.crisis

    // Check bankruptcy
    const negativeCF = financials.fcfe < 0
    const newNegativeQuarters = negativeCF ? (state.negativeQuarters + 1) : 0
    const bankrupt = newNegativeQuarters >= 4 && financials.currentRatio < 0.5

    // New state
    const newState = {
      ...state,
      quarter: state.quarter + 1,
      moatStrength: moatChange.newStrength,
      retainedEarnings: financials.retainedEarnings,
      history: newHistory,
      negativeQuarters: newNegativeQuarters,
      consecutiveRDInvestment: tokens.rd >= 2 ? (state.consecutiveRDInvestment || 0) + 1 : 0,
      pricingTokens: tokens.pricing,
      status: bankrupt ? 'bankrupt' : state.quarter >= 20 ? 'complete' : 'active',
      lastTokens: tokens,
    }

    // Save to Firebase
    await db.ref(`ma_rooms/${roomCode}/players/${playerName}`).set(newState)
    setGameState(newState)

    // Show results
    setQuarterResults({ financials, moatChange, criteria })
    setAttacks([])
    setTokens({ ops: 0, rd: 0, hiring: 0, pricing: 0, debt: 4, dividend: 0 })
  }

  function continueFromResults() {
    setQuarterResults(null)
    if (gameState.status === 'complete' || gameState.status === 'bankrupt') {
      setScreen('results')
    }
  }

  // ── SCREENS ──────────────────────────────────────────────────────────────────
  if (screen === 'lobby') return React.createElement(LobbyScreen, { playerName, setPlayerName, onCreate: createRoom, onJoin: joinRoom, showToast })
  if (screen === 'setup') return React.createElement(SetupScreen, { playerName, roomCode, roomData, isHost, onStart: startGame })
  if (screen === 'results') return React.createElement(ResultsScreen, { gameState, playerName })

  // ── GAME SCREEN ──────────────────────────────────────────────────────────────
  if (!gameState) return React.createElement('div', { style: { padding: 40, textAlign: 'center', color: T.muted } }, 'Loading game...')

  const criteria = checkCriteria(gameState.history || [], projectedFinancials || {}, gameState.moatStrength, gameState.quarter)
  const year = Math.ceil(gameState.quarter / 4)
  const qInYear = ((gameState.quarter - 1) % 4) + 1
  const phase = gameState.quarter <= 4 ? 'Foundation' : gameState.quarter <= 8 ? 'Traction' : gameState.quarter <= 12 ? 'Defence' : gameState.quarter <= 16 ? 'Dominance' : 'IPO Window'

  return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', fontFamily: "'Inter',sans-serif", color: T.text } },
    // Header
    React.createElement('div', { style: { background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 16px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 11, color: T.muted } }, `Year ${year} · Q${qInYear} · ${phase}`),
          React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: T.gold } }, `🏛️ ${playerName}`)
        ),
        React.createElement('div', { style: { textAlign: 'right' } },
          React.createElement('div', { style: { fontSize: 10, color: T.muted } }, 'Round'),
          React.createElement('div', { style: { fontSize: 22, fontWeight: 900, color: T.cyan, fontFamily: 'monospace' } }, `${gameState.quarter}/20`)
        )
      ),
      // Progress bar
      React.createElement('div', { style: { marginTop: 8, height: 4, background: T.surface, borderRadius: 2 } },
        React.createElement('div', { style: { height: '100%', width: `${(gameState.quarter / 20) * 100}%`, background: `linear-gradient(90deg,${T.gold},${T.orange})`, borderRadius: 2 } })
      )
    ),

    // Tab bar
    React.createElement('div', { style: { display: 'flex', background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' } },
      [
        { id: 'dashboard', emoji: '📊', label: 'Dashboard' },
        { id: 'tokens', emoji: '🎯', label: 'Allocate' },
        { id: 'moat', emoji: '🛡️', label: 'Moat' },
        { id: 'scorecard', emoji: '✅', label: 'Score' },
        { id: 'intel', emoji: '🔍', label: 'Intel' },
      ].map(t =>
        React.createElement('button', {
          key: t.id, onClick: () => setTab(t.id),
          style: { flex: 1, padding: '10px 6px', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? T.gold : 'transparent'}`, color: tab === t.id ? T.gold : T.muted, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: tab === t.id ? 700 : 400 }
        }, `${t.emoji}\n${t.label}`)
      )
    ),

    // Content
    React.createElement('div', { style: { padding: 16, paddingBottom: 100 } },
      // DASHBOARD TAB
      tab === 'dashboard' && React.createElement('div', null,
        React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
          React.createElement(MoatMeter, { moatType: gameState.moatType, strength: gameState.moatStrength })
        ),
        projectedFinancials && React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
          React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 } }, 'Projected This Quarter'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
            [
              ['Revenue', fmt(projectedFinancials.revenue), T.green],
              ['FCFE', fmt(projectedFinancials.fcfe), projectedFinancials.fcfe >= 0 ? T.green : T.red],
              ['RoE', `${projectedFinancials.roe}x`, projectedFinancials.roe >= 1 ? T.green : T.red],
              ['Current Ratio', `${projectedFinancials.currentRatio}x`, projectedFinancials.currentRatio >= 1 ? T.green : T.red],
              ['IV/Share', fmt(projectedFinancials.ivPerShare), T.cyan],
              ['Market Price', fmt(projectedFinancials.marketPrice), T.gold],
            ].map(([label, value, color]) =>
              React.createElement('div', { key: label, style: { background: T.surface, borderRadius: 10, padding: '8px 12px' } },
                React.createElement('div', { style: { fontSize: 9, color: T.muted, marginBottom: 4, textTransform: 'uppercase' } }, label),
                React.createElement('div', { style: { fontSize: 15, fontWeight: 800, color, fontFamily: 'monospace' } }, value)
              )
            )
          )
        ),
        // Mini scorecard
        React.createElement('div', { style: css.card },
          React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 } },
            `Criteria: ${criteria.passCount}/7 Passing`
          ),
          Object.values(criteria.criteria).map((c, i) =>
            React.createElement(CriterionRow, { key: i, criterion: c, compact: true })
          )
        )
      ),

      // TOKEN ALLOCATION TAB
      tab === 'tokens' && React.createElement('div', null,
        React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { fontSize: 14, fontWeight: 700 } }, '🎯 Token Allocation'),
            React.createElement('div', { style: { textAlign: 'right' } },
              React.createElement('div', { style: { fontSize: 11, color: T.muted } }, 'Remaining'),
              React.createElement('div', { style: { fontSize: 24, fontWeight: 900, color: remaining === 0 ? T.green : remaining < 0 ? T.red : T.gold, fontFamily: 'monospace' } }, remaining)
            )
          ),
          React.createElement('div', { style: { height: 6, background: T.surface, borderRadius: 3, marginTop: 8 } },
            React.createElement('div', { style: { height: '100%', width: `${Math.min(100, (tokenTotal / TOKEN_BUDGET) * 100)}%`, background: remaining < 0 ? T.red : T.gold, borderRadius: 3, transition: 'width 0.3s' } })
          )
        ),
        LEVERS.map(lever =>
          React.createElement(TokenSlider, {
            key: lever.id, lever,
            value: tokens[lever.id] || 0,
            onChange: v => setTokens(t => ({ ...t, [lever.id]: v })),
            remaining,
            disabled: gameState.status !== 'active'
          })
        ),
        React.createElement('button', {
          onClick: confirmQuarter,
          disabled: gameState.status !== 'active' || tokenTotal === 0,
          style: { ...css.btn(T.gold), fontSize: 15, padding: 14, marginTop: 8, opacity: tokenTotal === 0 ? 0.5 : 1 }
        }, `Confirm Q${gameState.quarter} Allocation →`)
      ),

      // MOAT TAB
      tab === 'moat' && React.createElement('div', null,
        React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
          React.createElement(MoatMeter, { moatType: gameState.moatType, strength: gameState.moatStrength }),
          React.createElement('div', { style: { marginTop: 14 } },
            (() => {
              const moat = MOAT_TYPES[gameState.moatType]
              return React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
                  React.createElement('span', { style: { fontSize: 12, color: T.muted } }, 'Decay per quarter'),
                  React.createElement('span', { style: { color: T.red, fontWeight: 700 } }, `-${moat.decay} pts`)
                ),
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
                  React.createElement('span', { style: { fontSize: 12, color: T.muted } }, 'Crisis threshold'),
                  React.createElement('span', { style: { color: T.orange, fontWeight: 700 } }, `< ${moat.crisis}`)
                ),
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                  React.createElement('span', { style: { fontSize: 12, color: T.muted } }, 'Repair lever'),
                  React.createElement('span', { style: { color: T.green, fontWeight: 700 } }, moat.repairLever.toUpperCase())
                )
              )
            })()
          )
        ),
        // Strength history
        gameState.history && gameState.history.length > 0 && React.createElement('div', { style: css.card },
          React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 } }, 'Trend History'),
          React.createElement('div', { style: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 } },
            gameState.history.map((h, i) =>
              React.createElement('div', { key: i, style: { textAlign: 'center', minWidth: 36 } },
                React.createElement('div', { style: { fontSize: 10, color: T.muted } }, `Q${h.quarter}`),
                React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: T.gold } }, h.revenue ? fmt(h.revenue).replace('$', '') : '—')
              )
            )
          )
        )
      ),

      // SCORECARD TAB
      tab === 'scorecard' && React.createElement('div', null,
        React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
            React.createElement('div', { style: { fontSize: 15, fontWeight: 800 } }, '7 Investment Criteria'),
            React.createElement('div', { style: css.pill(criteria.passCount === 7 ? T.green : T.gold) }, `${criteria.passCount}/7`)
          ),
          Object.values(criteria.criteria).map((c, i) =>
            React.createElement(CriterionRow, { key: i, criterion: c })
          )
        ),
        gameState.quarter >= 16 && React.createElement('div', { style: { ...css.card, border: `1px solid ${T.gold}44` } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 800, color: T.gold, marginBottom: 10 } }, '📈 IPO Readiness'),
          React.createElement('div', { style: { fontSize: 12, color: T.muted, lineHeight: 1.8 } },
            criteria.passCount === 7 ? '✅ All criteria met — IPO eligible at end of Year 5!' :
            `⚠️ ${7 - criteria.passCount} criteria still failing. ${20 - gameState.quarter} quarters remaining.`
          ),
          projectedFinancials && React.createElement('div', { style: { marginTop: 10 } },
            React.createElement('div', { style: { fontSize: 11, color: T.muted } }, 'Intrinsic Value Formula:'),
            React.createElement('div', { style: { fontSize: 12, color: T.cyan, fontFamily: 'monospace', marginTop: 4, lineHeight: 1.8 } },
              `FCFE = ${fmt(projectedFinancials.fcfe)}`,
              React.createElement('br'),
              `RoE = ${projectedFinancials.roe}x`,
              React.createElement('br'),
              `IV = ${fmt(projectedFinancials.fcfe)} / (1 + ${projectedFinancials.roe})^5`,
              React.createElement('br'),
              `= ${fmt(projectedFinancials.intrinsicValue)}`,
              React.createElement('br'),
              `Per Share = ${fmt(projectedFinancials.ivPerShare)}`,
              React.createElement('br'),
              `Market Price = ${fmt(projectedFinancials.marketPrice)}`
            )
          )
        )
      ),

      // INTEL TAB
      tab === 'intel' && React.createElement('div', null,
        React.createElement('div', { style: { ...css.card, marginBottom: 14 } },
          React.createElement('div', { style: { fontSize: 14, fontWeight: 800, marginBottom: 12 } }, '🔍 Competitor Intelligence'),
          React.createElement('div', { style: { background: T.surface, borderRadius: 10, padding: 12, marginBottom: 10 } },
            React.createElement('div', { style: { fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 } }, 'Active Archetype'),
            React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: T.red, marginTop: 4 } },
              gameState.competitor === 'disruptor' ? '⚡ The Disruptor' :
              gameState.competitor === 'incumbent' ? '🏛️ The Incumbent' : '🎯 The Specialist'
            ),
            React.createElement('div', { style: { fontSize: 12, color: T.muted, marginTop: 6 } },
              gameState.competitor === 'disruptor' ? 'Attacks every quarter when moat < 50. Burns cash to destabilise you.' :
              gameState.competitor === 'incumbent' ? 'Attacks every 4th quarter with devastating coordinated strikes.' :
              'Activates when your RoE rises. Surgically extracts your most profitable segment.'
            )
          ),
          React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 8 } }, 'Threat Level:'),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            ['Dormant', 'Monitoring', 'Attacking'].map((level, i) => {
              const threat = gameState.moatStrength < 35 ? 2 : gameState.moatStrength < 50 ? 1 : 0
              return React.createElement('div', { key: i, style: { flex: 1, padding: 8, textAlign: 'center', borderRadius: 8, background: threat === i ? (i === 2 ? `${T.red}22` : i === 1 ? `${T.orange}22` : `${T.green}22`) : T.surface, border: `1px solid ${threat === i ? (i === 2 ? T.red : i === 1 ? T.orange : T.green) : T.border}`, fontSize: 10, fontWeight: threat === i ? 700 : 400, color: threat === i ? (i === 2 ? T.red : i === 1 ? T.orange : T.green) : T.muted } }, level)
            })
          )
        ),
        // Room players
        roomData && roomData.players && React.createElement('div', { style: css.card },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 700, marginBottom: 12 } }, '🏆 All Players'),
          Object.values(roomData.players).map((p, i) =>
            React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: p.name === playerName ? T.cyan : T.text } }, p.name),
                React.createElement('div', { style: { fontSize: 10, color: T.muted } }, `Q${p.quarter || 1}/20 · ${MOAT_TYPES[p.moatType]?.name || 'Setting up...'}`)
              ),
              React.createElement('div', { style: css.pill(p.status === 'bankrupt' ? T.red : p.status === 'complete' ? T.gold : T.green) },
                p.status === 'bankrupt' ? '💀 Bankrupt' : p.status === 'complete' ? '🏆 Complete' : `Q${p.quarter || '?'}`
              )
            )
          )
        )
      )
    ),

    // Modals
    React.createElement(AttackModal, { attacks, onDismiss: dismissAttacks }),
    React.createElement(EventCardModal, { card: eventCard, onRespond: respondToEvent }),
    React.createElement(QuarterResultsModal, { results: quarterResults, onContinue: continueFromResults }),

    // Toast
    toast && React.createElement('div', { style: { position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: toast.color, color: '#000', padding: '10px 20px', borderRadius: 20, fontWeight: 700, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap' } }, toast.msg)
  )
}

// ── LOBBY SCREEN ──────────────────────────────────────────────────────────────
function LobbyScreen({ playerName, setPlayerName, onCreate, onJoin }) {
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState('') // '' | 'create' | 'join'

  return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif" } },
    React.createElement('div', { style: { width: '100%', maxWidth: 400 } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 40 } },
        React.createElement('div', { style: { fontSize: 64 } }, '🏛️'),
        React.createElement('div', { style: { fontSize: 28, fontWeight: 900, background: `linear-gradient(135deg,${T.gold},${T.orange})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } }, 'Market Architects'),
        React.createElement('div', { style: { fontSize: 13, color: T.muted, marginTop: 6 } }, 'A Value Investing Simulation Game'),
        React.createElement('div', { style: { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 } },
          ['1-4 Players', '20 Rounds', '60-90 min'].map(tag => React.createElement('span', { key: tag, style: css.pill(T.gold) }, tag))
        )
      ),
      // Name input
      React.createElement('div', { style: { marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 } }, 'Your Name'),
        React.createElement('input', {
          value: playerName,
          onChange: e => setPlayerName(e.target.value),
          placeholder: 'Enter your name...',
          style: { width: '100%', padding: 14, background: T.card, border: `1px solid ${T.border2}`, borderRadius: 12, color: T.text, fontSize: 15, outline: 'none' }
        })
      ),
      // Buttons
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        React.createElement('button', { onClick: onCreate, style: { ...css.btn(T.gold), padding: 14, fontSize: 15 } }, '🏛️ Create New Room'),
        mode !== 'join' ? React.createElement('button', { onClick: () => setMode('join'), style: { ...css.btn(T.cyan), padding: 14, fontSize: 15 } }, '🤝 Join Existing Room')
        : React.createElement('div', null,
          React.createElement('input', {
            value: joinCode,
            onChange: e => setJoinCode(e.target.value.toUpperCase()),
            placeholder: 'Enter room code...',
            maxLength: 5,
            style: { width: '100%', padding: 14, background: T.card, border: `1px solid ${T.cyan}44`, borderRadius: 12, color: T.cyan, fontSize: 20, textAlign: 'center', fontFamily: 'monospace', fontWeight: 800, outline: 'none', marginBottom: 10, letterSpacing: 4 }
          }),
          React.createElement('button', { onClick: () => onJoin(joinCode), style: { ...css.btn(T.cyan), padding: 14, fontSize: 15 } }, '→ Join Room')
        )
      )
    )
  )
}

// ── SETUP SCREEN ──────────────────────────────────────────────────────────────
function SetupScreen({ playerName, roomCode, roomData, isHost, onStart }) {
  const [selectedIndustry, setSelectedIndustry] = useState(null)
  const [selectedMoat, setSelectedMoat] = useState(null)

  const industry = INDUSTRIES.find(i => i.id === selectedIndustry)
  const availableMoats = industry ? Object.entries(MOAT_TYPES).map(([k, v]) => ({ id: k, ...v })) : []
  const competitorMap = { consumer: 'disruptor', tech: 'specialist', manufacturing: 'incumbent', enterprise: 'specialist', pharma: 'incumbent' }

  return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', padding: 16, fontFamily: "'Inter',sans-serif" } },
    React.createElement('div', { style: { maxWidth: 400, margin: '0 auto' } },
      React.createElement('div', { style: { ...css.card, marginBottom: 16, textAlign: 'center' } },
        React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: T.gold } }, '🏛️ Company Setup'),
        React.createElement('div', { style: { fontSize: 12, color: T.muted, marginTop: 4 } }, `Room: ${roomCode}`),
        React.createElement('div', { style: { ...css.pill(T.green), display: 'inline-block', marginTop: 6 } }, `${Object.keys(roomData?.players || {}).length} player(s) in room`)
      ),
      // Industry selection
      React.createElement('div', { style: { marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 } }, '1. Choose Your Industry'),
        INDUSTRIES.map(ind =>
          React.createElement('button', {
            key: ind.id,
            onClick: () => { setSelectedIndustry(ind.id); setSelectedMoat(null) },
            style: { ...css.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%', border: `1px solid ${selectedIndustry === ind.id ? T.gold : T.border}`, cursor: 'pointer', background: selectedIndustry === ind.id ? `${T.gold}10` : T.card }
          },
            React.createElement('div', { style: { textAlign: 'left' } },
              React.createElement('div', { style: { fontSize: 13, fontWeight: 700 } }, `${ind.emoji} ${ind.name}`),
              React.createElement('div', { style: { fontSize: 11, color: T.muted, marginTop: 2 } }, ind.desc)
            ),
            React.createElement('span', { style: css.pill(ind.difficulty === 'Beginner' ? T.green : ind.difficulty === 'Intermediate' ? T.gold : ind.difficulty === 'Advanced' ? T.orange : T.red) }, ind.difficulty)
          )
        )
      ),
      // Moat selection
      selectedIndustry && React.createElement('div', { style: { marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 } }, '2. Choose Your Economic Moat'),
        availableMoats.map(moat =>
          React.createElement('button', {
            key: moat.id,
            onClick: () => setSelectedMoat(moat.id),
            style: { ...css.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%', border: `1px solid ${selectedMoat === moat.id ? moat.color : T.border}`, cursor: 'pointer', background: selectedMoat === moat.id ? `${moat.color}10` : T.card }
          },
            React.createElement('div', { style: { textAlign: 'left' } },
              React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: moat.color } }, `${moat.emoji} ${moat.name}`),
              React.createElement('div', { style: { fontSize: 11, color: T.muted, marginTop: 2 } }, `Start: ${moat.start} · Decay: ${moat.decay}/Q · Crisis: <${moat.crisis}`)
            ),
            selectedMoat === moat.id && React.createElement('span', { style: { color: moat.color, fontSize: 18 } }, '✓')
          )
        )
      ),
      // Start button
      selectedIndustry && selectedMoat && React.createElement('button', {
        onClick: () => onStart(industry, selectedMoat, competitorMap[selectedIndustry] || 'disruptor'),
        style: { ...css.btn(T.gold), padding: 16, fontSize: 16, fontWeight: 800 }
      }, '🚀 Start Game →'),
      // Waiting players
      roomData && roomData.players && React.createElement('div', { style: { ...css.card, marginTop: 16 } },
        React.createElement('div', { style: { fontSize: 12, color: T.muted, marginBottom: 8 } }, 'Players in Room:'),
        Object.values(roomData.players).map((p, i) =>
          React.createElement('div', { key: i, style: { fontSize: 13, color: T.text, padding: '4px 0' } }, `${p.name === playerName ? '→ ' : '  '}${p.name}`)
        )
      )
    )
  )
}

// ── RESULTS SCREEN ────────────────────────────────────────────────────────────
function ResultsScreen({ gameState }) {
  if (!gameState) return null
  const criteria = checkCriteria(gameState.history || [], gameState.history?.[gameState.history.length - 1] || {}, gameState.moatStrength, 20)
  const lastFinancials = gameState.history?.[gameState.history.length - 1] || {}
  const ivGap = lastFinancials.marketPrice > 0 ? ((lastFinancials.marketPrice - lastFinancials.ivPerShare) / lastFinancials.marketPrice * 100) : 0
  const score = computeIPOScore(criteria.criteria, ivGap)
  const tierColor = score.stars >= 4 ? T.gold : score.stars >= 3 ? T.green : score.stars >= 2 ? T.orange : T.red

  return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', padding: 20, fontFamily: "'Inter',sans-serif" } },
    React.createElement('div', { style: { maxWidth: 400, margin: '0 auto' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 24 } },
        React.createElement('div', { style: { fontSize: 64 } }, score.stars >= 4 ? '🏆' : score.stars >= 3 ? '📈' : score.stars >= 1 ? '📊' : '💀'),
        React.createElement('div', { style: { fontSize: 22, fontWeight: 900, color: tierColor } }, score.tier),
        React.createElement('div', null, React.createElement(Stars, { count: score.stars })),
        React.createElement('div', { style: { fontSize: 13, color: T.muted, marginTop: 8 } }, score.desc)
      ),
      React.createElement('div', { style: { ...css.card, marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 700, marginBottom: 12 } }, 'Final Scorecard'),
        Object.values(criteria.criteria).map((c, i) =>
          React.createElement(CriterionRow, { key: i, criterion: c })
        )
      ),
      React.createElement('div', { style: { ...css.card, marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 700, marginBottom: 10 } }, 'Company Summary'),
        [
          ['Industry', INDUSTRIES.find(i => i.id === gameState.industry)?.name || gameState.industry],
          ['Moat Type', MOAT_TYPES[gameState.moatType]?.name || gameState.moatType],
          ['Final Moat Strength', `${gameState.moatStrength}/100`],
          ['Total Quarters', `${gameState.quarter - 1}/20`],
          ['Final Revenue', fmt(lastFinancials.revenue || 0)],
          ['Final FCFE', fmt(lastFinancials.fcfe || 0)],
          ['Intrinsic Value/Share', fmt(lastFinancials.ivPerShare || 0)],
          ['Market Price/Share', fmt(lastFinancials.marketPrice || 0)],
        ].map(([k, v]) =>
          React.createElement('div', { key: k, style: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` } },
            React.createElement('span', { style: { fontSize: 12, color: T.muted } }, k),
            React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: T.text } }, v)
          )
        )
      ),
      React.createElement('button', { onClick: () => window.location.reload(), style: { ...css.btn(T.gold), padding: 14, fontSize: 15 } }, '🔄 Play Again')
    )
  )
}

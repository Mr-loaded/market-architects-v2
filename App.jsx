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
  if (Math.abs(n) >= 1000000) return '₦' + (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return '₦' + (n / 1000).toFixed(0) + 'K';
  return '₦' + Math.round(n).toLocaleString();
}



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
function CriterionRow({ criterion, compact, onHelp }) {
  const c = criterion
  if (!c) return null
  const color = c.pass ? T.green : c.pending ? T.muted : T.red
  return React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: compact ? '5px 0' : '8px 0', borderBottom: `1px solid ${T.border}` } },
    React.createElement('div', { style: { flex: 1 } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
        React.createElement('div', { style: { fontSize: compact ? 11 : 12, color: T.text, fontWeight: 600 } }, c.label),
        onHelp && React.createElement('button', { onClick: onHelp, style: { background: 'transparent', border: 'none', color: T.muted, fontSize: 11, cursor: 'pointer', padding: '0 4px' } }, '❓')
      ),
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
function TokenSlider({ lever, value, onChange, remaining, disabled, onHelp }) {
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

// ── QUARTER COMMENTARY ENGINE ─────────────────────────────────────────────────
function generateCommentary(financials, moatChange, criteria, quarter) {
  const comments = []
  const passCount = Object.values(criteria.criteria).filter(c => c.pass).length

  if (moatChange.newStrength < 30) {
    comments.push({ emoji: '🚨', color: T.red, text: `Your moat has collapsed to ${moatChange.newStrength}/100. In real markets, this is what happened to Nokia when smartphones arrived — they ignored their competitive advantage until competitors had already taken over. You must invest heavily in R&D next quarter or this game is over.` })
  } else if (moatChange.newStrength < 50) {
    comments.push({ emoji: '⚠️', color: T.orange, text: `Moat at ${moatChange.newStrength}/100 — below the critical 50 threshold. Think of Blackberry in 2010: still profitable but losing ground fast. Competitors will now attack you every quarter. Increase R&D tokens immediately.` })
  } else if (moatChange.repair > moatChange.decay) {
    comments.push({ emoji: '🛡️', color: T.green, text: `Your moat grew to ${moatChange.newStrength}/100 this quarter. This is exactly what Dangote Cement does — consistently reinvesting in cost efficiency so competitors cannot match their prices. Keep this up.` })
  }

  if (financials.fcfe < 0) {
    comments.push({ emoji: '💸', color: T.red, text: `Negative FCFE of ${fmt(financials.fcfe)} means your company is burning cash. In real life, this is how companies go bankrupt — not from lack of revenue, but from running out of actual cash. Reduce hiring costs and increase pricing tokens next quarter.` })
  } else if (financials.fcfe > 3000000) {
    comments.push({ emoji: '💰', color: T.green, text: `Strong FCFE of ${fmt(financials.fcfe)}. Free cash flow is what Warren Buffett looks for first in any company. A business that generates consistent cash can survive recessions, fund growth, and reward investors. You are building something real.` })
  }

  if (financials.roe < 1.0 && quarter >= 5) {
    comments.push({ emoji: '📊', color: T.red, text: `RoE of ${financials.roe}x is below the required 1.0x. This means for every ₦1 investors put into your company, you are generating less than ₦1 in profit. Zenith Bank maintains RoE above 1.5x consistently — that is why investors trust them. Reduce costs or improve margins.` })
  } else if (financials.roe >= 1.5) {
    comments.push({ emoji: '📈', color: T.green, text: `Excellent RoE of ${financials.roe}x. You are generating ₦${financials.roe} for every ₦1 invested. This is the level that attracts institutional investors. Real companies like MTN Nigeria trade at premium valuations because of sustained high RoE.` })
  }

  if (financials.currentRatio < 1.0) {
    comments.push({ emoji: '⚖️', color: T.red, text: `Current Ratio of ${financials.currentRatio}x means you cannot pay your short-term bills. This triggered the collapse of many Nigerian companies during the 2016 recession — they had revenue on paper but no cash to pay suppliers. Increase Debt Management tokens urgently.` })
  }

  if (quarter === 5) {
    comments.push({ emoji: '⏰', color: T.gold, text: `Quarter 5 begins. The Consistency Clock is now running. From here, your RoE must stay at or above 1.0x every single quarter without exception. This is similar to how the SEC evaluates companies before approving an IPO — sustained performance, not just one good quarter.` })
  } else if (quarter === 10) {
    comments.push({ emoji: '🏁', color: T.gold, text: `Halfway through your 5-year journey. Real investors look at the midpoint trajectory to predict the final outcome. If you are passing 5+ criteria now, you are on track. If not, restructure your token allocation immediately.` })
  } else if (quarter === 17) {
    comments.push({ emoji: '🏆', color: T.gold, text: `Final stretch — 4 quarters to IPO. Do not change a winning formula. The biggest mistake companies make before listing is over-engineering their strategy. If your numbers are working, stay consistent.` })
  }

  if (passCount <= 3 && quarter >= 8) {
    comments.push({ emoji: '🔴', color: T.red, text: `Only ${passCount}/7 criteria passing at Quarter ${quarter}. In real corporate finance, a company failing this many health checks would be rated as high-risk by credit agencies. Restructure your entire token strategy — visit the Guide tab now.` })
  } else if (passCount === 7) {
    comments.push({ emoji: '✅', color: T.green, text: `All 7 criteria passing! You are managing this company like a professional value investor. If this were a real NSE-listed company, analysts would be placing Buy ratings right now. Maintain this discipline to the end.` })
  }

  return comments.slice(0, 3)
}

// ── QUARTER RESULTS MODAL ─────────────────────────────────────────────────────
function QuarterResultsModal({ results, quarter, onContinue }) {
  if (!results) return null
  const { financials, moatChange, criteria } = results
  const passCount = Object.values(criteria.criteria).filter(c => c.pass).length
  const commentary = generateCommentary(financials, moatChange, criteria, quarter || 1)

  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.97)', zIndex: 997, display: 'flex', flexDirection: 'column', padding: 20, overflowY: 'auto' } },
    React.createElement('div', { style: { maxWidth: 400, margin: '0 auto', width: '100%' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 13, color: T.muted } }, 'Quarter Complete'),
        React.createElement('div', { style: { fontSize: 20, fontWeight: 800, color: T.gold } }, 'Financial Results'),
        React.createElement('div', { style: css.pill(passCount === 7 ? T.green : passCount >= 5 ? T.gold : T.orange) }, `${passCount}/7 criteria passing`)
      ),
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
      commentary.length > 0 && React.createElement('div', { style: { marginBottom: 14 } },
        React.createElement('div', { style: { fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 } }, '📰 Market Analyst Commentary'),
        commentary.map((c, i) =>
          React.createElement('div', { key: i, style: { background: `${c.color}08`, border: `1px solid ${c.color}33`, borderRadius: 12, padding: 14, marginBottom: 10 } },
            React.createElement('div', { style: { fontSize: 16, marginBottom: 6 } }, c.emoji),
            React.createElement('div', { style: { fontSize: 12, color: T.text, lineHeight: 1.8 } }, c.text)
          )
        )
      ),
      React.createElement('button', { onClick: onContinue, style: { ...css.btn(T.gold), fontSize: 15, padding: 14 } }, 'Continue to Next Quarter →')
    )
  )
}


// ── GLOSSARY & HELP CONTENT ───────────────────────────────────────────────────
const GLOSSARY = {
  'FCFE': { term: 'Free Cash Flow to Equity', emoji: '💰', simple: 'The actual cash your company has LEFT after paying all bills, loans and investments. Think of it as your company\'s real "take-home pay". Higher is always better.', example: 'If your company earns $5M but spends $3M on buildings, equipment and debt — your FCFE is $2M.' },
  'RoE': { term: 'Return on Equity', emoji: '📊', simple: 'How efficiently your company turns investor money into profit. A RoE of 1.0x means for every $1 investors put in, you generate $1 in profit. Above 1.0x = excellent.', example: 'If shareholders invested $8M and you made $10M profit, your RoE = 1.25x — great!' },
  'Current Ratio': { term: 'Current Ratio', emoji: '⚖️', simple: 'Can your company pay its SHORT-TERM bills? Divide what you own (assets) by what you owe (liabilities). Must stay above 1.0x — below that means you might run out of cash to pay suppliers.', example: 'You have $3M in the bank, customers owe you $2M. You owe suppliers $4M. Ratio = 5/4 = 1.25x ✅' },
  'Intrinsic Value': { term: 'Intrinsic Value', emoji: '🔍', simple: 'What your company is ACTUALLY worth based on future cash flows — not what the market says. A great investor buys when market price is ABOVE intrinsic value (undervalued). You win when IV is 10-30% below market price.', example: 'If your company generates $2M/year, intrinsic value might be $20M. If market values it at $25M — it\'s overvalued by 20%.' },
  'Economic Moat': { term: 'Economic Moat', emoji: '🏰', simple: 'Your company\'s PROTECTION from competitors. Named after castle moats — the deeper your moat, the harder it is for rivals to take your customers. Without a moat, competitors copy you and steal your business.', example: 'Apple\'s moat is brand loyalty. Coca-Cola\'s is brand + cost advantage. Google\'s is network effects.' },
  'Gross Profit': { term: 'Gross Profit', emoji: '📈', simple: 'Revenue minus the direct cost of making your product. If you sell shoes for $100 and they cost $60 to make, gross profit is $40. Higher gross margin = more efficient business.', example: 'Software companies have 80%+ gross margins. Supermarkets often have only 25%.' },
  'Operating Cash Flow': { term: 'Operating Cash Flow', emoji: '🔄', simple: 'Cash generated from your day-to-day business operations — before investments or loans. This is the purest measure of whether your core business actually makes money.', example: 'Revenue $10M, staff costs $4M, materials $2M, rent $1M = Operating CF of $3M.' },
  'Market Price': { term: 'Market Price per Share', emoji: '💹', simple: 'What investors are currently willing to PAY for one share of your company. Influenced by your moat strength, debt levels, and investor excitement (hype). Your goal is for this to be slightly ABOVE intrinsic value.', example: 'If intrinsic value is $10/share but market price is $13/share — that\'s a 23% premium. Investors believe in your future.' },
};

const LEVER_EXPLANATIONS = {
  ops: {
    title: 'Operations Investment',
    emoji: '⚙️',
    simple: 'Spending on your core business — factories, delivery systems, production capacity. More tokens = more revenue growth.',
    why: 'Every token adds 6% to your revenue. This is your primary growth engine.',
    risk: 'Spending too much here without pricing strategy leads to thin profit margins.',
    newbie: 'Start with 3-4 tokens here. It\'s your engine — don\'t let it run empty.',
  },
  rd: {
    title: 'R&D / Moat Spending',
    emoji: '🔬',
    simple: 'Investment in innovation, brand building, patents, or deepening customer relationships — whatever protects your competitive position.',
    why: 'This repairs and strengthens your economic moat. Without it, your moat decays every quarter and competitors can attack.',
    risk: 'Underinvesting here is the #1 way players lose. Your moat ALWAYS decays — you must always repair it.',
    newbie: 'NEVER put 0 tokens here. Minimum 2 tokens every quarter or your moat will collapse within 5 rounds.',
  },
  hiring: {
    title: 'Hiring',
    emoji: '👥',
    simple: 'Growing your team — more staff means more capacity to serve customers and grow revenue.',
    why: 'Each token adds 3% revenue. But each hire also adds fixed payroll costs that reduce your cash flow.',
    risk: 'Over-hiring is expensive. Hiring costs remain even when revenue drops.',
    newbie: 'Keep at 2-3 tokens. Hiring is good for growth but don\'t over-hire early.',
  },
  pricing: {
    title: 'Pricing Strategy',
    emoji: '💵',
    simple: 'Optimising what you charge customers — premium pricing, value-based pricing, or market positioning.',
    why: 'Each token adds 4% to your gross margin. This directly improves profitability without needing more sales.',
    risk: 'High pricing attracts the Specialist competitor who will try to steal your premium customers.',
    newbie: 'Use 2-3 tokens. Pricing is one of the most powerful levers — it improves profit without extra cost.',
  },
  debt: {
    title: 'Debt Management',
    emoji: '🏦',
    simple: 'Managing your company\'s borrowing and repayments. Affects your liquidity (ability to pay short-term bills).',
    why: 'Keeps your Current Ratio above 1.0x. Also reduces COGS through better supplier terms.',
    risk: 'Low debt management leaves you exposed to legal attacks from the Incumbent competitor.',
    newbie: 'Always keep at least 3-4 tokens here to keep your Current Ratio above 1.0x.',
  },
  dividend: {
    title: 'Dividend / Retain',
    emoji: '📈',
    simple: 'Deciding whether to pay profits to shareholders (dividends) or keep them in the company (retained earnings).',
    why: 'Retaining earnings grows your equity base which improves RoE. Paying dividends creates investor excitement (hype) that raises market price.',
    risk: 'Paying too many dividends reduces your FCFE and lowers intrinsic value.',
    newbie: 'Start with 0-1 tokens. Focus on retaining earnings in early quarters to build equity.',
  },
};

const PHASE_GUIDANCE = {
  Foundation: {
    rounds: 'Q1-Q4',
    emoji: '🏗️',
    goal: 'Establish your moat and get operations running. Losses are acceptable in this phase.',
    focus: 'Invest heavily in R&D to build your moat. Set up operations. Don\'t worry about profit yet.',
    warning: 'The Consistency Clock starts at Q5. You have 4 quarters to build before you must show growth.',
    tokens: { ops: '3-4', rd: '4-5', hiring: '2-3', pricing: '2', debt: '3-4', dividend: '0-1' },
  },
  Traction: {
    rounds: 'Q5-Q8',
    emoji: '🚀',
    goal: 'Revenue and profit must start growing consistently. The Consistency Clock is now running.',
    focus: 'Balance moat maintenance with revenue growth. Get RoE above 1.0x.',
    warning: 'From Q5, RoE must stay at or above 1.0x every quarter. Check this BEFORE confirming tokens.',
    tokens: { ops: '4-5', rd: '3-4', hiring: '2-3', pricing: '2-3', debt: '3', dividend: '1-2' },
  },
  Defence: {
    rounds: 'Q9-Q12',
    emoji: '🛡️',
    goal: 'Protect your moat from competitor attacks. All 7 criteria must be approaching target.',
    focus: 'Keep moat above 50. Watch for Incumbent attacks every 4th quarter.',
    warning: 'Competitor attacks intensify here. Keep R&D tokens high to resist attacks.',
    tokens: { ops: '3-4', rd: '4-5', hiring: '2', pricing: '2-3', debt: '3-4', dividend: '1-2' },
  },
  Dominance: {
    rounds: 'Q13-Q16',
    emoji: '👑',
    goal: 'All 7 metrics must be at or near target. IPO Readiness screen unlocks at Q16.',
    focus: 'Fine-tune intrinsic value gap to hit 10-30% below market price.',
    warning: 'Crisis events become more frequent. Don\'t reduce moat investment now.',
    tokens: { ops: '3', rd: '4', hiring: '2', pricing: '3', debt: '3-4', dividend: '2-3' },
  },
  'IPO Window': {
    rounds: 'Q17-Q20',
    emoji: '🏆',
    goal: 'ALL 7 criteria must pass simultaneously at Q20. This is your final push.',
    focus: 'Don\'t change a winning formula. Maintain consistency.',
    warning: 'One bad quarter here can fail the Consistency Clock. Play safe.',
    tokens: { ops: '3', rd: '4', hiring: '2', pricing: '3', debt: '4', dividend: '2' },
  },
};

const CRITERIA_EXPLANATIONS = {
  revenueGrowth: { simple: 'Your total sales must grow in at least 4 out of 5 years. One bad year is forgiven — two bad years means failure.', tip: 'Keep Ops tokens at 3+ every quarter. Revenue grows with Operations and Hiring tokens.' },
  profitGrowth: { simple: 'Your net profit (after all costs) must grow in at least 4 of 5 years. Profit = Revenue minus all expenses.', tip: 'Balance Pricing tokens to improve margins. Don\'t over-hire as payroll costs eat profit.' },
  cashFlow: { simple: 'Cash from day-to-day operations must grow in at least 4 of 5 years. Even a profitable company can fail if it runs out of cash.', tip: 'Debt Management tokens improve cash flow. Keep Hiring reasonable to reduce payroll drain.' },
  moatStrength: { simple: 'Your competitive moat must score at least 50/100 at the end of Year 5. Below 50 means competitors can easily copy you.', tip: 'Never put 0 tokens in R&D. Your moat decays every quarter automatically — you must always repair it.' },
  roe: { simple: 'From Quarter 5 onward, your Return on Equity must be 1.0x or above every single quarter without exception.', tip: 'Retain earnings (low Dividend tokens) to build equity base. Keep operations profitable.' },
  currentRatio: { simple: 'You must always have more short-term assets than short-term liabilities. Below 1.0x = risk of not paying your bills.', tip: 'Keep Debt Management at 3+ tokens always. This directly improves your current ratio.' },
  ivGap: { simple: 'Your company\'s true value (intrinsic value) must be 10-30% BELOW what the market values it. This proves investors believe in your future.', tip: 'R&D tokens raise market price via moat premium. Pricing tokens add hype factor. Balance them carefully.' },
};

// ── TUTORIAL COMPONENTS ───────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      emoji: '🏛️',
      title: 'Welcome to Market Architects',
      content: 'You are a company founder. Your goal: build a business so strong that investors line up to buy shares when you go public (IPO) after 5 years.',
      highlight: null,
    },
    {
      emoji: '🎯',
      title: 'How You Win',
      content: 'At the end of Year 5, your company must pass 7 financial tests simultaneously. Think of them like school exams — you must pass ALL 7, not just most of them.',
      highlight: '7 criteria = 7 financial health checks your business must pass',
    },
    {
      emoji: '🎮',
      title: 'The 20-Token Budget',
      content: 'Every quarter (3 months), you get EXACTLY 20 tokens to spend across 6 business levers. You can never do everything — you must choose your priorities wisely.',
      highlight: 'Unspent tokens are LOST. Use all 20 every quarter.',
    },
    {
      emoji: '🏰',
      title: 'Your Economic Moat',
      content: 'A moat is your competitive advantage — what stops rivals from copying you. Without a moat, competitors steal your customers and you lose. Your moat DECAYS every quarter unless you invest in R&D.',
      highlight: '⚠️ Never spend 0 tokens on R&D — your moat will collapse!',
    },
    {
      emoji: '🤖',
      title: 'Competitor AI',
      content: 'You have one AI competitor who watches your company and attacks when you\'re weak. They attack your moat, steal customers, and cause problems. Keep your moat strong to deter attacks.',
      highlight: 'Strong moat (50+) = competitor avoids you. Weak moat = constant attacks.',
    },
    {
      emoji: '🃏',
      title: 'Event Cards',
      content: 'Every quarter, a random event card is drawn — good or bad. These represent real business surprises: market crashes, viral moments, new regulations. You must respond with your 20 tokens.',
      highlight: 'Crisis events get worse if your moat is already weak. Keep it strong!',
    },
    {
      emoji: '💡',
      title: 'First-Time Tip',
      content: 'For your first game: Choose Consumer Goods (Beginner) industry. Use Brand Loyalty moat. Put 4 tokens in Operations, 4 in R&D, 3 in Hiring, 3 in Pricing, 4 in Debt, 2 in Dividend. This balanced approach will teach you the game.',
      highlight: 'The game shows projections BEFORE you confirm — always check them!',
    },
  ];

  const step_data = steps[step];
  const isLast = step === steps.length - 1;

  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { background: '#0D1627', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%' } },
      // Progress dots
      React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 } },
        steps.map((_, i) => React.createElement('div', { key: i, style: { width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? T.gold : i < step ? T.green : '#1a2640', transition: 'all 0.3s' } }))
      ),
      // Content
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 56, marginBottom: 12 } }, step_data.emoji),
        React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 12 } }, step_data.title),
        React.createElement('div', { style: { fontSize: 13, color: '#8a9ab5', lineHeight: 1.7 } }, step_data.content)
      ),
      // Highlight box
      step_data.highlight && React.createElement('div', { style: { background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: T.gold, lineHeight: 1.6 } },
        '💡 ', step_data.highlight
      ),
      // Buttons
      React.createElement('div', { style: { display: 'flex', gap: 10 } },
        step > 0 && React.createElement('button', {
          onClick: () => setStep(s => s - 1),
          style: { flex: 1, padding: 12, background: 'transparent', border: '1px solid #1a2640', borderRadius: 10, color: T.muted, cursor: 'pointer', fontSize: 13 }
        }, '← Back'),
        React.createElement('button', {
          onClick: () => isLast ? onComplete() : setStep(s => s + 1),
          style: { flex: 2, padding: 12, background: isLast ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'rgba(0,229,255,0.1)', border: `1px solid ${isLast ? T.gold : T.cyan}`, borderRadius: 10, color: isLast ? '#050A14' : T.cyan, cursor: 'pointer', fontSize: 13, fontWeight: 700 }
        }, isLast ? '🚀 Start Building!' : 'Next →')
      )
    )
  );
}

function GlossaryModal({ term, onClose }) {
  const data = GLOSSARY[term];
  if (!data) return null;
  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.95)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { background: '#0D1627', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 40 } }, data.emoji),
        React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: T.cyan, marginTop: 8 } }, data.term),
        React.createElement('div', { style: { fontSize: 11, color: T.muted, marginTop: 2 } }, `"${term}"`)
      ),
      React.createElement('div', { style: { background: '#111D35', borderRadius: 12, padding: 14, marginBottom: 14 } },
        React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 } }, 'In Simple Terms'),
        React.createElement('div', { style: { fontSize: 13, color: T.text, lineHeight: 1.7 } }, data.simple)
      ),
      React.createElement('div', { style: { background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, padding: 14, marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 11, color: T.green, marginBottom: 6, fontWeight: 700 } }, '📌 Real Example'),
        React.createElement('div', { style: { fontSize: 12, color: '#8a9ab5', lineHeight: 1.7 } }, data.example)
      ),
      React.createElement('button', { onClick: onClose, style: { width: '100%', padding: 12, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 10, color: T.cyan, cursor: 'pointer', fontWeight: 700 } }, 'Got it! ✓')
    )
  );
}

function LeverHelpModal({ lever, onClose }) {
  const data = LEVER_EXPLANATIONS[lever];
  if (!data) return null;
  const lv = LEVERS.find(l => l.id === lever);
  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.95)', zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { background: '#0D1627', border: `1px solid ${lv?.color || T.cyan}44`, borderRadius: 20, padding: 24, maxWidth: 400, width: '100%' } },
      React.createElement('div', { style: { marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 32 } }, data.emoji),
        React.createElement('div', { style: { fontSize: 17, fontWeight: 800, color: T.text, marginTop: 8 } }, data.title)
      ),
      [
        { label: 'What it does', value: data.simple, color: T.cyan },
        { label: 'Why it matters', value: data.why, color: T.green },
        { label: '⚠️ Risk', value: data.risk, color: T.orange },
        { label: '💡 Beginner tip', value: data.newbie, color: T.gold },
      ].map(({ label, value, color }) =>
        React.createElement('div', { key: label, style: { background: '#111D35', borderRadius: 10, padding: 12, marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 10, color, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 } }, label),
          React.createElement('div', { style: { fontSize: 12, color: '#8a9ab5', lineHeight: 1.7 } }, value)
        )
      ),
      React.createElement('button', { onClick: onClose, style: { width: '100%', padding: 12, background: `${lv?.color || T.cyan}18`, border: `1px solid ${lv?.color || T.cyan}44`, borderRadius: 10, color: lv?.color || T.cyan, cursor: 'pointer', fontWeight: 700 } }, 'Got it! ✓')
    )
  );
}

function PhaseGuideModal({ phase, onClose }) {
  const data = PHASE_GUIDANCE[phase];
  if (!data) return null;
  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.95)', zIndex: 9996, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { background: '#0D1627', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%', maxHeight: '90vh', overflowY: 'auto' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 40 } }, data.emoji),
        React.createElement('div', { style: { fontSize: 17, fontWeight: 800, color: T.gold } }, phase + ' Phase'),
        React.createElement('div', { style: { fontSize: 12, color: T.muted, marginTop: 4 } }, data.rounds)
      ),
      [
        { label: '🎯 Your Goal', value: data.goal, color: T.green },
        { label: '🔑 Focus On', value: data.focus, color: T.cyan },
        { label: '⚠️ Watch Out', value: data.warning, color: T.red },
      ].map(({ label, value, color }) =>
        React.createElement('div', { key: label, style: { background: '#111D35', borderRadius: 10, padding: 12, marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 10, color, fontWeight: 700, marginBottom: 4 } }, label),
          React.createElement('div', { style: { fontSize: 12, color: '#8a9ab5', lineHeight: 1.7 } }, value)
        )
      ),
      React.createElement('div', { style: { background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10, padding: 12, marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 10, color: T.gold, fontWeight: 700, marginBottom: 8 } }, '💡 SUGGESTED TOKEN ALLOCATION'),
        Object.entries(data.tokens).map(([k, v]) => {
          const lv = LEVERS.find(l => l.id === k);
          return React.createElement('div', { key: k, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' } },
            React.createElement('span', { style: { fontSize: 12, color: T.muted } }, `${lv?.emoji} ${lv?.name}`),
            React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: T.gold, fontFamily: 'monospace' } }, v)
          );
        })
      ),
      React.createElement('button', { onClick: onClose, style: { width: '100%', padding: 12, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 10, color: T.gold, cursor: 'pointer', fontWeight: 700 } }, 'Got it! ✓')
    )
  );
}

function CriteriaHelpModal({ criteriaKey, onClose }) {
  const data = CRITERIA_EXPLANATIONS[criteriaKey];
  if (!data) return null;
  const names = {
    revenueGrowth: '📈 Revenue Growth',
    profitGrowth: '💰 Profit Growth',
    cashFlow: '🔄 Operating Cash Flow',
    moatStrength: '🏰 Economic Moat',
    roe: '📊 Return on Equity',
    currentRatio: '⚖️ Current Ratio',
    ivGap: '🔍 Intrinsic Value Discount',
  };
  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.95)', zIndex: 9995, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { background: '#0D1627', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%' } },
      React.createElement('div', { style: { fontSize: 17, fontWeight: 800, color: T.green, marginBottom: 16 } }, names[criteriaKey] || criteriaKey),
      React.createElement('div', { style: { background: '#111D35', borderRadius: 10, padding: 14, marginBottom: 12 } },
        React.createElement('div', { style: { fontSize: 10, color: T.cyan, fontWeight: 700, marginBottom: 6 } }, 'WHAT THIS MEANS'),
        React.createElement('div', { style: { fontSize: 13, color: '#8a9ab5', lineHeight: 1.7 } }, data.simple)
      ),
      React.createElement('div', { style: { background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10, padding: 14, marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 10, color: T.gold, fontWeight: 700, marginBottom: 6 } }, '💡 HOW TO PASS THIS'),
        React.createElement('div', { style: { fontSize: 12, color: '#8a9ab5', lineHeight: 1.7 } }, data.tip)
      ),
      React.createElement('button', { onClick: onClose, style: { width: '100%', padding: 12, background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 10, color: T.green, cursor: 'pointer', fontWeight: 700 } }, 'Got it! ✓')
    )
  );
}

// ── ONBOARDING MODAL ─────────────────────────────────────────────────────────
function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);

  const screens = [
    {
      emoji: '🏛️',
      title: 'Your Mission',
      color: T.gold,
      content: 'You are a startup CEO. Your goal: build a company so strong that investors line up to buy shares when you go public (IPO) after 5 years (20 quarters).',
      highlight: 'This game teaches real financial concepts used by professional investors — explained as you play.',
    },
    {
      emoji: '🎮',
      title: 'How the Game Works',
      color: T.cyan,
      content: 'Every quarter (3 months), you get 20 tokens to invest across 6 business levers — Operations, R&D, Hiring, Pricing, Debt, and Dividends. Your choices determine your financials.',
      highlight: 'Game loop: Allocate tokens → Random event happens → Financials update → Repeat 20 times.',
    },
    {
      emoji: '🏆',
      title: 'Your 7 Win Conditions',
      color: T.green,
      content: 'At the end of Year 5, your company must pass ALL 7 financial tests simultaneously. Fail even one and you cannot IPO.',
      bullets: [
        '📈 Revenue grows in 4 of 5 years',
        '💰 Profit grows in 4 of 5 years',
        '🔄 Cash flow grows in 4 of 5 years',
        '🏰 Moat strength stays ≥ 50/100',
        '📊 Return on Equity ≥ 1.0x (from Year 2)',
        '⚖️ Current Ratio ≥ 1.0x always',
        '🔍 Company is undervalued by 10-30%',
      ],
    },
    {
      emoji: '🏰',
      title: 'Your Economic Moat',
      color: T.orange,
      content: 'Your moat is your competitive advantage — what stops rivals from copying you and stealing your customers. Without a moat, you lose.',
      highlight: '⚠️ Critical: Your moat DECAYS every quarter automatically. You MUST invest in R&D/Moat every quarter or it will collapse and competitors will attack you constantly.',
    },
    {
      emoji: '🤖',
      title: 'Competitor AI',
      color: T.red,
      content: 'You face one AI competitor who watches your company and attacks when you are weak. They attack your moat, steal customers, and drain your cash flow.',
      highlight: 'Moat above 50 = competitor stays back. Moat below 50 = constant attacks. Keep your moat strong!',
    },
    {
      emoji: '🃏',
      title: 'Event Cards',
      color: T.cyan,
      content: 'Every quarter a random event card is drawn — market crashes, viral moments, regulatory changes, new patents. You must respond using your 20 tokens.',
      highlight: 'Crisis events get WORSE if your moat is already weak. A strong moat is your best defence against bad luck.',
    },
    {
      emoji: '💡',
      title: 'Beginner Strategy',
      color: T.gold,
      content: 'For your first game: Choose Consumer Goods (Beginner) with Brand Loyalty moat. Use this balanced token allocation every quarter:',
      tokens: [
        ['⚙️ Operations', '4-5', 'Drives revenue growth'],
        ['🔬 R&D / Moat', '4', 'NEVER skip this!'],
        ['👥 Hiring', '2-3', 'Moderate growth'],
        ['💵 Pricing', '2-3', 'Improve margins'],
        ['🏦 Debt Management', '3-4', 'Keep current ratio healthy'],
        ['📈 Dividend / Retain', '1-2', 'Build equity slowly'],
      ],
    },
  ];

  const screen = screens[step];
  const isLast = step === screens.length - 1;

  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.98)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    React.createElement('div', { style: { background: '#0D1627', border: `1px solid ${screen.color}44`, borderRadius: 24, padding: 24, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' } },
      // Progress dots
      React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 } },
        screens.map((_, i) =>
          React.createElement('div', { key: i, style: { width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? screen.color : T.border, transition: 'all 0.3s' } })
        )
      ),
      // Emoji & Title
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 52, marginBottom: 8 } }, screen.emoji),
        React.createElement('div', { style: { fontSize: 20, fontWeight: 900, color: screen.color } }, screen.title),
        React.createElement('div', { style: { fontSize: 11, color: T.muted, marginTop: 4 } }, `${step + 1} of ${screens.length}`)
      ),
      // Content
      React.createElement('div', { style: { background: '#111D35', borderRadius: 12, padding: 14, marginBottom: 14 } },
        React.createElement('div', { style: { fontSize: 14, color: T.text, lineHeight: 1.8 } }, screen.content)
      ),
      // Highlight box
      screen.highlight && React.createElement('div', { style: { background: `${screen.color}10`, border: `1px solid ${screen.color}33`, borderRadius: 12, padding: 14, marginBottom: 14 } },
        React.createElement('div', { style: { fontSize: 13, color: screen.color, lineHeight: 1.7, fontWeight: 600 } }, screen.highlight)
      ),
      // Bullets
      screen.bullets && React.createElement('div', { style: { marginBottom: 14 } },
        screen.bullets.map((b, i) =>
          React.createElement('div', { key: i, style: { display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` } },
            React.createElement('div', { style: { fontSize: 13, color: T.text, lineHeight: 1.6 } }, b)
          )
        )
      ),
      // Token table
      screen.tokens && React.createElement('div', { style: { marginBottom: 14 } },
        screen.tokens.map(([name, value, tip]) =>
          React.createElement('div', { key: name, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 13, color: T.text, fontWeight: 600 } }, name),
              React.createElement('div', { style: { fontSize: 11, color: T.muted } }, tip)
            ),
            React.createElement('div', { style: { fontSize: 16, fontWeight: 900, color: T.gold, fontFamily: 'monospace', background: `${T.gold}15`, padding: '4px 10px', borderRadius: 8 } }, value)
          )
        )
      ),
      // Buttons
      React.createElement('div', { style: { display: 'flex', gap: 10, marginTop: 8 } },
        step > 0 && React.createElement('button', {
          onClick: () => setStep(s => s - 1),
          style: { flex: 1, padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, color: T.muted, cursor: 'pointer', fontWeight: 700, fontSize: 13 }
        }, '← Back'),
        React.createElement('button', {
          onClick: () => isLast ? onClose() : setStep(s => s + 1),
          style: { flex: 2, padding: 12, background: isLast ? screen.color : `${screen.color}18`, border: `1px solid ${screen.color}44`, borderRadius: 12, color: isLast ? '#000' : screen.color, cursor: 'pointer', fontWeight: 800, fontSize: 14 }
        }, isLast ? "🚀 Let's Play!" : 'Next →')
      ),
      // Skip
      !isLast && React.createElement('button', {
        onClick: onClose,
        style: { width: '100%', background: 'transparent', border: 'none', color: T.muted, fontSize: 11, cursor: 'pointer', marginTop: 10, padding: 8 }
      }, 'Skip briefing — go straight to game')
    )
  );
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
  const [showTutorial, setShowTutorial] = useState(false)
  const [showGlossary, setShowGlossary] = useState(null)
  const [showPhaseGuide, setShowPhaseGuide] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [resuming, setResuming] = useState(false)

  // ── SESSION PERSISTENCE ──────────────────────────────────────────────────────
  // On mount, check if player has a saved session in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ma_session')
    if (saved) {
      try {
        const { name, code } = JSON.parse(saved)
        if (name && code) {
          setPlayerName(name)
          setRoomCode(code)
          setResuming(true)
        }
      } catch (e) {}
    }
  }, [])

  // When resuming, try to reconnect to the saved room
  useEffect(() => {
    if (!resuming || !roomCode || !playerName) return
    db.ref(`ma_rooms/${roomCode}`).once('value').then(snap => {
      const data = snap.val()
      if (data && data.players && data.players[playerName]) {
        const playerData = data.players[playerName]
        setRoomData(data)
        setIsHost(data.host === playerName)
        setGameState(playerData)
        if (playerData.status === 'complete' || playerData.status === 'bankrupt') {
          setScreen('results')
        } else if (data.status === 'playing') {
          setScreen('game')
        } else {
          setScreen('setup')
        }
        showToast(`Welcome back, ${playerName}! Resuming your game 🎮`, T.green)
      } else {
        // Session expired or room deleted — clear and start fresh
        localStorage.removeItem('ma_session')
        setRoomCode('')
        setPlayerName('')
      }
      setResuming(false)
    }).catch(() => {
      localStorage.removeItem('ma_session')
      setResuming(false)
    })
  }, [resuming, roomCode, playerName])

  // Save session to localStorage whenever roomCode or playerName changes
  useEffect(() => {
    if (roomCode && playerName) {
      localStorage.setItem('ma_session', JSON.stringify({ name: playerName, code: roomCode }))
    }
  }, [roomCode, playerName])

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
    if (!roomCode || resuming) return
    const ref = db.ref(`ma_rooms/${roomCode}`)
    ref.on('value', snap => {
      const data = snap.val()
      if (!data) return
      setRoomData(data)
      if (data.status === 'playing' && data.players && data.players[playerName]) {
        setGameState(data.players[playerName])
        if (screen === 'lobby') setScreen('game')
      }
    })
    return () => ref.off()
  }, [roomCode, playerName, resuming])

  // ── CREATE ROOM ──────────────────────────────────────────────────────────────
  async function createRoom() {
    if (!playerName.trim()) { showToast('Enter your name first!', T.red); return }

    // Generate a unique room code — check Firebase to ensure it does not already exist
    let code = ''
    let attempts = 0
    while (attempts < 10) {
      const candidate = Math.random().toString(36).slice(2, 7).toUpperCase()
      const snap = await db.ref(`ma_rooms/${candidate}`).once('value')
      if (!snap.exists()) {
        code = candidate
        break
      }
      attempts++
    }
    if (!code) { showToast('Could not create room. Try again.', T.red); return }

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

    // Allow rejoining an in-progress game if the player was already in the room
    const alreadyInRoom = data.players && data.players[playerName]
    if (!alreadyInRoom && data.status !== 'waiting') {
      showToast('Game already started — you cannot join a room in progress.', T.red); return
    }

    setRoomCode(code)
    setIsHost(false)

    if (alreadyInRoom && data.status === 'playing') {
      // Rejoin in-progress game
      setGameState(data.players[playerName])
      setRoomData(data)
      setScreen('game')
      showToast(`Welcome back to room ${code}!`, T.green)
      return
    }

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
    setShowOnboarding(true)
    showToast('Game started! Read the mission briefing first 📖', T.gold)
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
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
          React.createElement('div', { style: { textAlign: 'right' } },
            React.createElement('div', { style: { fontSize: 10, color: T.muted } }, 'Round'),
            React.createElement('div', { style: { fontSize: 22, fontWeight: 900, color: T.cyan, fontFamily: 'monospace' } }, `${gameState.quarter}/20`)
          ),
          React.createElement('button', {
            onClick: () => setShowOnboarding(true),
            style: { width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.gold}`, background: `${T.gold}18`, color: T.gold, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }
          }, '?')
        )
      ),
      // Progress bar
      React.createElement('div', { style: { marginTop: 8, height: 4, background: T.surface, borderRadius: 2 } },
        React.createElement('div', { style: { height: '100%', width: `${(gameState.quarter / 20) * 100}%`, background: `linear-gradient(90deg,${T.gold},${T.orange})`, borderRadius: 2 } })
      ),
      React.createElement('button', {
        onClick: () => setShowPhaseGuide(true),
        style: { marginTop: 8, width: '100%', padding: '6px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
      }, `📖 ${phase} Phase — What should I focus on this phase?`)
    ),

    // Tab bar
    React.createElement('div', { style: { display: 'flex', background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' } },
      [
        { id: 'dashboard', emoji: '📊', label: 'Dashboard' },
        { id: 'tokens', emoji: '🎯', label: 'Allocate' },
        { id: 'moat', emoji: '🛡️', label: 'Moat' },
        { id: 'scorecard', emoji: '✅', label: 'Score' },
        { id: 'intel', emoji: '🔍', label: 'Intel' },
        { id: 'guide', emoji: '📖', label: 'Guide' },
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
        React.createElement('div', { style: { background: `${T.cyan}10`, border: `1px solid ${T.cyan}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: T.cyan, lineHeight: 1.7 } },
          "💡 Tap ❓ next to any lever to learn what it does. Total tokens must not exceed 20."
        ),
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
            disabled: gameState.status !== 'active',
            onHelp: (id) => setShowGlossary(id)
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
          React.createElement(CriterionRow, { criterion: criteria.criteria.revenueGrowth, onHelp: () => setShowGlossary('revenue') }),
          React.createElement(CriterionRow, { criterion: criteria.criteria.profitGrowth, onHelp: () => setShowGlossary('grossProfit') }),
          React.createElement(CriterionRow, { criterion: criteria.criteria.cashFlow, onHelp: () => setShowGlossary('fcfe') }),
          React.createElement(CriterionRow, { criterion: criteria.criteria.moatStrength, onHelp: () => setShowGlossary('moat') }),
          React.createElement(CriterionRow, { criterion: criteria.criteria.roe, onHelp: () => setShowGlossary('roe') }),
          React.createElement(CriterionRow, { criterion: criteria.criteria.currentRatio, onHelp: () => setShowGlossary('currentRatio') }),
          React.createElement(CriterionRow, { criterion: criteria.criteria.ivGap, onHelp: () => setShowGlossary('intrinsicValue') })
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

    // GUIDE TAB
    tab === 'guide' && React.createElement('div', { style: { padding: 16, paddingBottom: 100 } },

      // Mission briefing button
      React.createElement('button', {
        onClick: () => setShowOnboarding(true),
        style: { ...css.btn(T.gold), marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }
      }, '🎯 Replay Mission Briefing'),

      // Token levers section
      React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 } }, '⚙️ The 6 Business Levers'),
      Object.entries(LEVER_EXPLANATIONS).map(([key, data]) =>
        React.createElement('div', { key, style: { ...css.card, marginBottom: 10 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
            React.createElement('div', { style: { fontSize: 22 } }, data.emoji),
            React.createElement('div', { style: { fontSize: 14, fontWeight: 800, color: T.text } }, data.title)
          ),
          [
            { label: 'What it does', value: data.simple, color: T.cyan },
            { label: 'Why it matters', value: data.why, color: T.green },
            { label: '⚠️ Risk', value: data.risk, color: T.orange },
            { label: '💡 Beginner tip', value: data.newbie, color: T.gold },
          ].map(({ label, value, color }) =>
            React.createElement('div', { key: label, style: { background: T.surface, borderRadius: 8, padding: 10, marginBottom: 6 } },
              React.createElement('div', { style: { fontSize: 9, color, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 } }, label),
              React.createElement('div', { style: { fontSize: 12, color: T.muted, lineHeight: 1.6 } }, value)
            )
          )
        )
      ),

      // Financial terms section
      React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 10 } }, '📊 Financial Terms Explained'),
      Object.entries(GLOSSARY).map(([key, entry]) =>
        React.createElement('div', { key, style: { ...css.card, marginBottom: 10 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
            React.createElement('div', { style: { fontSize: 22 } }, entry.emoji),
            React.createElement('div', { style: { fontSize: 14, fontWeight: 800, color: T.cyan } }, entry.term)
          ),
          React.createElement('div', { style: { background: T.surface, borderRadius: 8, padding: 10, marginBottom: 6 } },
            React.createElement('div', { style: { fontSize: 9, color: T.cyan, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 } }, 'What it means'),
            React.createElement('div', { style: { fontSize: 12, color: T.muted, lineHeight: 1.6 } }, entry.simple)
          ),
          entry.example && React.createElement('div', { style: { background: T.surface, borderRadius: 8, padding: 10, marginBottom: 6 } },
            React.createElement('div', { style: { fontSize: 9, color: T.gold, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 } }, '📖 Example'),
            React.createElement('div', { style: { fontSize: 12, color: T.muted, lineHeight: 1.6 } }, entry.example)
          )
        )
      ),

      // Win conditions section
      React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 10 } }, '🏆 Your 7 Win Conditions'),
      Object.entries(CRITERIA_EXPLANATIONS).map(([key, data]) => {
        const names = {
          revenueGrowth: '📈 Revenue Growth',
          profitGrowth: '💰 Profit Growth',
          cashFlow: '🔄 Cash Flow Growth',
          moatStrength: '🏰 Economic Moat ≥ 50',
          roe: '📊 Return on Equity ≥ 1.0x',
          currentRatio: '⚖️ Current Ratio ≥ 1.0x',
          ivGap: '🔍 Intrinsic Value Discount 10-30%',
        };
        return React.createElement('div', { key, style: { ...css.card, marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 800, color: T.green, marginBottom: 8 } }, names[key] || key),
          React.createElement('div', { style: { background: T.surface, borderRadius: 8, padding: 10, marginBottom: 6 } },
            React.createElement('div', { style: { fontSize: 9, color: T.cyan, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 } }, 'What it means'),
            React.createElement('div', { style: { fontSize: 12, color: T.muted, lineHeight: 1.6 } }, data.simple)
          ),
          React.createElement('div', { style: { background: `${T.gold}10`, border: `1px solid ${T.gold}33`, borderRadius: 8, padding: 10 } },
            React.createElement('div', { style: { fontSize: 9, color: T.gold, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 } }, '💡 How to pass'),
            React.createElement('div', { style: { fontSize: 12, color: T.muted, lineHeight: 1.6 } }, data.tip)
          )
        )
      })
    ),
    showOnboarding && React.createElement(OnboardingModal, { onClose: () => setShowOnboarding(false) }),
    showTutorial && React.createElement(TutorialModal, { onClose: () => setShowTutorial(false) }),
    showGlossary && React.createElement(GlossaryModal, { term: showGlossary, onClose: () => setShowGlossary(null) }),
    showPhaseGuide && React.createElement(PhaseGuideModal, { phase, onClose: () => setShowPhaseGuide(false) }),
    // Game Modals
    React.createElement(AttackModal, { attacks, onDismiss: dismissAttacks }),
    React.createElement(EventCardModal, { card: eventCard, onRespond: respondToEvent }),
    React.createElement(QuarterResultsModal, { results: quarterResults, quarter: gameState?.quarter, onContinue: continueFromResults }),

    // Toast
    toast && React.createElement('div', { style: { position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: toast.color, color: '#000', padding: '10px 20px', borderRadius: 20, fontWeight: 700, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap' } }, toast.msg)
  )
}

// ── LOBBY SCREEN ──────────────────────────────────────────────────────────────
function LobbyScreen({ playerName, setPlayerName, onCreate, onJoin, showToast }) {
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState('')
  const [savedSession, setSavedSession] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('ma_session')
    if (saved) { try { setSavedSession(JSON.parse(saved)) } catch (e) {} }
  }, [])

  function clearSession() {
    localStorage.removeItem('ma_session')
    setSavedSession(null)
    if (showToast) showToast('Session cleared. Starting fresh!', T.cyan)
  }

  return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif" } },
    React.createElement('div', { style: { width: '100%', maxWidth: 400 } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 28 } },
        React.createElement('div', { style: { fontSize: 64 } }, '🏛️'),
        React.createElement('div', { style: { fontSize: 28, fontWeight: 900, background: `linear-gradient(135deg,${T.gold},${T.orange})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } }, 'Market Architects'),
        React.createElement('div', { style: { fontSize: 13, color: T.muted, marginTop: 6 } }, 'A Value Investing Simulation Game'),
        React.createElement('div', { style: { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 } },
          ['1-4 Players', '20 Rounds', '60-90 min'].map(tag => React.createElement('span', { key: tag, style: css.pill(T.gold) }, tag))
        )
      ),
      savedSession && React.createElement('div', { style: { ...css.card, marginBottom: 20, border: `1px solid ${T.green}44`, background: `${T.green}08` } },
        React.createElement('div', { style: { fontSize: 12, color: T.green, fontWeight: 700, marginBottom: 6 } }, '🎮 Active game found!'),
        React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 12 } }, `Player: ${savedSession.name} · Room: ${savedSession.code}`),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('button', {
            onClick: () => { setPlayerName(savedSession.name); onJoin(savedSession.code) },
            style: { ...css.btn(T.green), flex: 2, padding: 10, fontSize: 13 }
          }, '▶ Continue Game'),
          React.createElement('button', {
            onClick: clearSession,
            style: { ...css.btn(T.muted), flex: 1, padding: 10, fontSize: 12 }
          }, '✕ New Game')
        )
      ),
      React.createElement('div', { style: { marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 11, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 } }, 'Your Name'),
        React.createElement('input', {
          value: playerName,
          onChange: e => setPlayerName(e.target.value),
          placeholder: 'Enter your name...',
          style: { width: '100%', padding: 14, background: T.card, border: `1px solid ${T.border2}`, borderRadius: 12, color: T.text, fontSize: 15, outline: 'none' }
        })
      ),
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
      selectedIndustry && selectedMoat && React.createElement('div', null,
        industry && industry.difficulty === 'Beginner' && React.createElement('div', { style: { background: `${T.green}10`, border: `1px solid ${T.green}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: T.green } },
          "✅ Great choice for beginners! Consumer Goods + Brand Loyalty is the most forgiving combination."
        ),
        (industry && industry.difficulty === 'Expert') && React.createElement('div', { style: { background: `${T.red}10`, border: `1px solid ${T.red}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: T.red } },
          "⚠️ Expert difficulty! Pharmaceuticals requires heavy R&D investment every quarter. Not recommended for first-time players."
        ),
        React.createElement('button', {
          onClick: () => onStart(industry, selectedMoat, competitorMap[selectedIndustry] || 'disruptor'),
          style: { ...css.btn(T.gold), padding: 16, fontSize: 16, fontWeight: 800 }
        }, '🚀 Start Game →')
      ),
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

// ── QUIZ DATA ─────────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "What does FCFE stand for and what does it measure?", options: ["Free Cash Flow to Equity — the actual cash left after all expenses and investments", "Future Company Financial Earnings — projected profits for next year", "Fixed Cost Financial Estimate — total fixed costs in a quarter", "Federal Cash Flow Evaluation — government assessment of company health"], correct: 0, explanation: "FCFE is Free Cash Flow to Equity — the real cash your company generates after paying all bills, debt and investments. It is the most honest measure of company health." },
  { q: "Your moat falls to 28/100. What is the most likely consequence?", options: ["Your market price increases because investors see opportunity", "Competitors begin attacking every quarter stealing your customers and revenue", "Your Current Ratio automatically improves", "Nothing changes until Quarter 10"], correct: 1, explanation: "A moat below the crisis threshold means your competitive advantage is gone. Competitors will attack you every quarter, stealing customers and damaging revenue — exactly like what happened to Blackberry after 2010." },
  { q: "What does a Current Ratio below 1.0x mean for your company?", options: ["You are growing too fast and need to slow down", "You cannot pay your short-term bills and risk running out of cash", "Your intrinsic value is above market price", "Your moat is weakening faster than normal"], correct: 1, explanation: "Current Ratio below 1.0x means your short-term debts exceed your short-term assets. In real life, this is how companies collapse — not from lack of revenue, but from inability to pay suppliers, salaries, and loans when they come due." },
  { q: "Return on Equity (RoE) of 1.5x means:", options: ["You lost 50% of your equity this quarter", "For every ₦1 investors put in, your company generates ₦1.50 in profit", "Your company is 50% overvalued on the stock market", "Your revenue grew by 1.5% this quarter"], correct: 1, explanation: "RoE measures how efficiently you turn investment into profit. 1.5x means every ₦1 of equity generates ₦1.50 profit. Nigerian banks like Zenith Bank target RoE above 1.5x consistently." },
  { q: "Intrinsic value must be 10-30% BELOW market price to win. What does this mean?", options: ["Your company is overpriced and about to crash", "Investors believe your future is bright and value you above what the numbers say", "You should immediately reduce your pricing tokens", "Your FCFE is growing faster than market price"], correct: 1, explanation: "When market price is above intrinsic value by 10-30%, investors are paying a premium because they believe in your future growth. This is the sweet spot Warren Buffett looks for." },
  { q: "Why should you NEVER put 0 tokens in R&D/Moat?", options: ["R&D tokens are the only way to grow revenue", "Your moat decays automatically every quarter and competitors attack when it is weak", "The game penalises you with an automatic -20 points", "Zero R&D causes your Current Ratio to drop below 1.0x"], correct: 1, explanation: "Every moat decays automatically each quarter regardless of what you do. If you do not invest in R&D, the decay compounds and your moat collapses. Once competitors start attacking, recovering is extremely difficult." },
  { q: "What is an Economic Moat?", options: ["The total debt your company owes to banks and creditors", "Your company's competitive advantage that protects against rivals stealing your customers", "The difference between your revenue and your operating costs", "A penalty applied when your moat strength falls below 50"], correct: 1, explanation: "An economic moat is what Warren Buffett calls a company's durable competitive advantage. Apple's moat is brand loyalty. Google's is network effects. Without a moat, you have no protection." },
  { q: "Your company has high revenue but negative FCFE. What is happening?", options: ["This is impossible — high revenue always means positive cash flow", "The company is earning but spending more than it earns, burning through cash", "The moat is being repaired automatically", "RoE will automatically fix this next quarter"], correct: 1, explanation: "Revenue and cash flow are different. A company can have growing sales but negative cash flow if costs, debt repayments, and capital expenditure exceed income. Many Nigerian companies collapse this way." },
  { q: "During the Foundation Phase (Q1-Q4), what should be your priority?", options: ["Maximise dividends to attract investors early", "Build your moat and establish operations even if it means early losses", "Focus entirely on pricing strategy to maximise margins", "Minimise all spending to conserve tokens for later quarters"], correct: 1, explanation: "The Foundation Phase is about building the base. Early losses are acceptable — what matters is establishing a strong moat and operational foundation. Companies that chase profit too early often sacrifice the moat that would protect them in later quarters." },
  { q: "The Disruptor competitor attacks when your moat is below 50. Which lever best defends against this?", options: ["Dividend/Retain — paying more dividends calms the market", "Hiring — adding staff increases your defensive capacity", "R&D/Moat — directly repairs your competitive advantage", "Pricing — raising prices discourages competitor entry"], correct: 2, explanation: "R&D/Moat tokens directly repair your economic moat. The Disruptor specifically targets companies with weak moats — the only defence is keeping your moat strong through consistent R&D investment every quarter." },
  { q: "What does Gross Profit measure?", options: ["Total company revenue before any deductions", "Revenue minus the direct cost of making your product or service", "The cash available after all expenses including debt", "The profit after paying corporate income tax"], correct: 1, explanation: "Gross Profit = Revenue minus Cost of Goods Sold. It measures how efficiently you produce your product. Software companies have 80%+ gross margins. Manufacturing companies often have 30-40%." },
  { q: "Why does Market Price differ from Intrinsic Value?", options: ["Market price is calculated by the government while intrinsic value is calculated by the company", "Market price reflects investor emotion and expectations while intrinsic value reflects actual cash flows", "They are always the same — market price is just another term for intrinsic value", "Market price only applies to public companies while intrinsic value applies to private companies"], correct: 1, explanation: "Intrinsic value is the mathematical worth based on future cash flows. Market price is what investors are currently willing to pay — influenced by sentiment, news, moat perception, and hype." },
  { q: "Your RoE is 0.7x at Quarter 8. What is the most urgent action?", options: ["Increase dividend tokens to boost investor confidence", "Reduce costs by cutting hiring and increasing pricing to improve profitability per unit of equity", "Spend more on operations to grow revenue faster", "The RoE requirement only starts at Quarter 10 so there is no urgency"], correct: 1, explanation: "RoE must be above 1.0x from Quarter 5 onward without exception. At Quarter 8 you have already failed this criterion. Reduce hiring costs, increase pricing, and retain earnings to grow the equity base efficiently." },
  { q: "What happens when you Retain Earnings instead of paying Dividends?", options: ["Your market price immediately drops because investors prefer cash payouts", "Your equity base grows which improves RoE and strengthens the company long-term", "Your current ratio deteriorates because you are holding too much cash", "The competitor AI becomes more aggressive because you appear stronger"], correct: 1, explanation: "Retained earnings build your equity base. More equity means the same profit generates a higher RoE. Early in the game, retaining is almost always better than paying dividends." },
  { q: "A company's moat type is Brand Loyalty. Which lever most effectively repairs it?", options: ["Operations — more production strengthens brand perception", "Hiring — more staff improves customer service and brand experience", "R&D/Moat — directly invests in brand building and innovation", "Debt Management — financial stability protects brand reputation"], correct: 2, explanation: "Each moat type has a specific repair lever. Brand Loyalty moats are repaired through R&D investment — spending on innovation, marketing, and product quality that reinforces why customers choose you over competitors." },
  { q: "What is the difference between Operating Cash Flow and FCFE?", options: ["They are exactly the same measurement", "Operating Cash Flow is from core business activities; FCFE also subtracts capital expenditure and adds net borrowing", "FCFE measures revenue while Operating Cash Flow measures profit", "Operating Cash Flow includes tax payments while FCFE does not"], correct: 1, explanation: "Operating Cash Flow measures cash from day-to-day business. FCFE goes further — it subtracts capital expenditure and adjusts for net borrowing. FCFE is what actually belongs to equity holders after everything is accounted for." },
  { q: "You are at Quarter 17 with all 7 criteria passing. What is the best strategy?", options: ["Aggressively increase all tokens to maximise final numbers", "Maintain your current allocation — consistency is more important than optimisation at this stage", "Shift all tokens to dividend payments to maximise investor hype", "Reduce R&D now that your moat is strong enough"], correct: 1, explanation: "The biggest mistake near the end is changing what is working. Your moat still decays every quarter. Your RoE still needs to stay above 1.0x. Volatility in the final stretch can fail criteria that were passing safely." },
  { q: "What type of competitor attacks specifically when your RoE is high?", options: ["The Disruptor who attacks when your moat is weak", "The Specialist who targets your most profitable customer segments", "The Incumbent who launches legal challenges every 4th quarter", "No competitor is triggered by high RoE"], correct: 1, explanation: "The Specialist AI activates when your RoE rises above 1.5x. It surgically targets your most profitable customers because high RoE signals premium pricing that competitors can undercut in specific segments." },
  { q: "Which Nigerian company is a real-world example of a Network Effects moat?", options: ["Dangote Cement — cost advantage through scale", "Flutterwave — payment network that becomes more valuable as more users join", "Nigerian Breweries — brand loyalty built over decades", "Nestlé Nigeria — switching costs through integrated supply chains"], correct: 1, explanation: "Flutterwave is a classic network effects example. The more merchants and customers use the payment platform, the more valuable it becomes for everyone — exactly like how Facebook became dominant because everyone else was already on it." },
  { q: "Your company passes 6 of 7 criteria at the end of Year 5. What is your result?", options: ["Successful IPO with a slight discount to valuation", "Near Miss — no IPO, company survives but does not go public", "Bankruptcy — failing any criterion means immediate shutdown", "Partial IPO where 60% of shares are listed"], correct: 1, explanation: "All 7 criteria must pass simultaneously at the end of Year 5 for an IPO. Passing 6 of 7 results in a Near Miss. This reflects real IPO requirements where regulators assess multiple financial health indicators simultaneously." },
];

// ── CERTIFICATE COMPONENT ─────────────────────────────────────────────────────
function Certificate({ playerName, score, industry, moatType, passCount, quizScore, certRef }) {
  const date = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
  const code = React.useRef(`MA-${Date.now().toString(36).toUpperCase().slice(-6)}`).current
  const tierColor = score.stars >= 4 ? T.gold : score.stars >= 3 ? T.green : score.stars >= 2 ? T.orange : T.red
  const ind = INDUSTRIES.find(i => i.id === industry)
  const moat = MOAT_TYPES[moatType]
  const starsFilled = '★'.repeat(score.stars) + '☆'.repeat(5 - score.stars)

  return React.createElement('div', {
    ref: certRef,
    style: {
      background: 'linear-gradient(135deg, #0D1627 0%, #111D35 50%, #0D1627 100%)',
      border: `2px solid ${T.gold}`,
      borderRadius: 20,
      padding: 28,
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }
  },
    // Background decorations
    React.createElement('div', { style: { position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: `${T.gold}12`, borderBottomLeftRadius: 100 } }),
    React.createElement('div', { style: { position: 'absolute', bottom: 0, left: 0, width: 80, height: 80, background: `${T.cyan}10`, borderTopRightRadius: 80 } }),
    React.createElement('div', { style: { position: 'absolute', top: '40%', right: -30, width: 120, height: 120, border: `1px solid ${T.gold}15`, borderRadius: '50%' } }),

    // Header
    React.createElement('div', { style: { textAlign: 'center', marginBottom: 20 } },
      React.createElement('div', { style: { fontSize: 40 } }, '🏛️'),
      React.createElement('div', { style: { fontSize: 11, color: T.gold, textTransform: 'uppercase', letterSpacing: 4, marginTop: 6, fontWeight: 700 } }, 'Certificate of Achievement'),
      React.createElement('div', { style: { width: 80, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, margin: '10px auto' } })
    ),

    // Player name
    React.createElement('div', { style: { textAlign: 'center', marginBottom: 18 } },
      React.createElement('div', { style: { fontSize: 12, color: '#8a9ab5', marginBottom: 6, letterSpacing: 1 } }, 'This certifies that'),
      React.createElement('div', { style: { fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: 1, textShadow: `0 0 20px ${T.gold}44` } }, playerName),
      React.createElement('div', { style: { fontSize: 12, color: '#8a9ab5', marginTop: 6, letterSpacing: 1 } }, 'has successfully completed')
    ),

    // Course name box
    React.createElement('div', { style: { textAlign: 'center', marginBottom: 18, background: `${T.gold}12`, borderRadius: 14, padding: '14px 16px', border: `1px solid ${T.gold}44` } },
      React.createElement('div', { style: { fontSize: 18, fontWeight: 900, color: T.gold, letterSpacing: 1 } }, 'Market Architects'),
      React.createElement('div', { style: { fontSize: 11, color: '#8a9ab5', marginTop: 4 } }, 'Value Investing Simulation — Level 1'),
      React.createElement('div', { style: { fontSize: 12, color: T.cyan, marginTop: 8, fontWeight: 600 } },
        `${ind?.emoji || ''} ${ind?.name || industry}  ·  ${moat?.emoji || ''} ${moat?.name || moatType}`
      )
    ),

    // Score grid
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 } },
      [
        { label: 'IPO Result', value: score.tier, color: tierColor },
        { label: 'Criteria', value: `${passCount}/7`, color: passCount === 7 ? T.green : T.orange },
        { label: 'Quiz Score', value: `${quizScore}/20`, color: quizScore >= 15 ? T.green : quizScore >= 10 ? T.gold : T.orange },
      ].map(({ label, value, color }) =>
        React.createElement('div', { key: label, style: { textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 6px', border: `1px solid rgba(255,255,255,0.08)` } },
          React.createElement('div', { style: { fontSize: 14, fontWeight: 900, color } }, value),
          React.createElement('div', { style: { fontSize: 9, color: '#8a9ab5', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 } }, label)
        )
      )
    ),

    // Stars
    React.createElement('div', { style: { textAlign: 'center', fontSize: 22, color: T.gold, marginBottom: 18, letterSpacing: 4 } }, starsFilled),

    // Footer divider
    React.createElement('div', { style: { height: 1, background: `linear-gradient(90deg, transparent, ${T.gold}44, transparent)`, marginBottom: 14 } }),

    // Footer
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 10, color: '#8a9ab5' } }, date),
        React.createElement('div', { style: { fontSize: 10, color: '#8a9ab5', marginTop: 3 } }, `Verification: ${code}`)
      ),
      React.createElement('div', { style: { textAlign: 'right' } },
        React.createElement('div', { style: { fontSize: 10, color: T.gold, fontWeight: 800, letterSpacing: 1 } }, 'MARKET ARCHITECTS'),
        React.createElement('div', { style: { fontSize: 10, color: '#8a9ab5', marginTop: 3 } }, 'In partnership with Markets4you')
      )
    )
  )
}

// ── CERTIFICATE PHASE COMPONENT ───────────────────────────────────────────────
function CertificatePhase({ playerName, score, gameState, passCount, quizScore, onConvert, onPlayAgain }) {
  const certRef = React.useRef(null)
  const [loading, setLoading] = React.useState(false)
  const [status, setStatus] = React.useState('')

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  async function captureCanvas() {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
    const el = certRef.current
    if (!el) throw new Error('Certificate element not found')
    const canvas = await window.html2canvas(el, {
      backgroundColor: '#0D1627',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    return canvas
  }

  async function handleDownloadPDF() {
    try {
      setLoading(true)
      setStatus('Preparing certificate...')
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
      setStatus('Capturing design...')
      const canvas = await captureCanvas()
      setStatus('Generating PDF...')
      const { jsPDF } = window.jspdf
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW - 20
      const imgH = (canvas.height * imgW) / canvas.width
      const y = (pageH - imgH) / 2
      pdf.setFillColor(13, 22, 39)
      pdf.rect(0, 0, pageW, pageH, 'F')
      pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH)
      pdf.save(`Market-Architects-Certificate-${playerName}.pdf`)
      setStatus('')
    } catch (e) {
      setStatus('Download failed — try again')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleShareImage() {
    try {
      setLoading(true)
      setStatus('Capturing certificate...')
      const canvas = await captureCanvas()
      setStatus('Preparing to share...')
      canvas.toBlob(async (blob) => {
        if (!blob) { setStatus('Could not capture image'); setLoading(false); return }
        const file = new File([blob], 'market-architects-certificate.png', { type: 'image/png' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Market Architects Certificate',
            text: `I just completed Market Architects and earned my Value Investing certificate!\n\nResult: ${score.tier} · Quiz: ${quizScore}/20\n\nPlay at: marketarchitect.netlify.app`,
          })
          setStatus('')
        } else {
          // Fallback — download image
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Market-Architects-Certificate-${playerName}.png`
          a.click()
          URL.revokeObjectURL(url)
          setStatus('Image saved — share it from your gallery!')
        }
        setLoading(false)
      }, 'image/png')
    } catch (e) {
      setStatus('Share failed — try download instead')
      setLoading(false)
      console.error(e)
    }
  }

  return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', padding: 20, fontFamily: "'Inter',sans-serif" } },
    React.createElement('div', { style: { maxWidth: 400, margin: '0 auto' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 20, fontWeight: 900, color: T.gold } }, '🎓 Your Certificate'),
        React.createElement('div', { style: { fontSize: 12, color: T.muted, marginTop: 4 } },
          `Quiz Score: ${quizScore}/${QUIZ_QUESTIONS.length} · ${Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}%`
        )
      ),

      // The actual certificate (captured by html2canvas)
      React.createElement(Certificate, {
        certRef,
        playerName: playerName || gameState.name || 'Player',
        score,
        industry: gameState.industry,
        moatType: gameState.moatType,
        passCount,
        quizScore,
      }),

      // Status message
      status ? React.createElement('div', { style: { textAlign: 'center', fontSize: 12, color: T.cyan, marginBottom: 12, padding: 10, background: `${T.cyan}10`, borderRadius: 10 } }, status) : null,

      // Action buttons
      React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 12 } },
        React.createElement('button', {
          onClick: handleShareImage,
          disabled: loading,
          style: { ...css.btn(T.cyan), flex: 1, padding: 14, fontSize: 13, opacity: loading ? 0.6 : 1 }
        }, loading ? '⏳ Working...' : '📤 Share Image'),
        React.createElement('button', {
          onClick: handleDownloadPDF,
          disabled: loading,
          style: { ...css.btn(T.gold), flex: 1, padding: 14, fontSize: 13, opacity: loading ? 0.6 : 1 }
        }, loading ? '⏳ Working...' : '📄 Download PDF')
      ),

      React.createElement('button', {
        onClick: onConvert,
        style: { ...css.btn(T.green), padding: 14, fontSize: 15, marginBottom: 12 }
      }, '💰 Apply What You Learned →'),

      React.createElement('button', {
        onClick: onPlayAgain,
        style: { ...css.btn(T.muted), padding: 12, fontSize: 13 }
      }, '🔄 Play Again')
    )
  )
}

// ── RESULTS SCREEN ────────────────────────────────────────────────────────────
function ResultsScreen({ gameState, playerName }) {
  const [phase, setPhase] = useState('results')
  const [quizStep, setQuizStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  if (!gameState) return null
  const criteria = checkCriteria(gameState.history || [], gameState.history?.[gameState.history.length - 1] || {}, gameState.moatStrength, 20)
  const lastFinancials = gameState.history?.[gameState.history.length - 1] || {}
  const ivGap = lastFinancials.marketPrice > 0 ? ((lastFinancials.marketPrice - lastFinancials.ivPerShare) / lastFinancials.marketPrice * 100) : 0
  const score = computeIPOScore(criteria.criteria, ivGap)
  const tierColor = score.stars >= 4 ? T.gold : score.stars >= 3 ? T.green : score.stars >= 2 ? T.orange : T.red
  const passCount = Object.values(criteria.criteria).filter(c => c.pass).length
  const quizScore = quizAnswers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length

  function handleAnswer(idx) { setSelectedAnswer(idx); setShowExplanation(true) }

  function nextQuestion() {
    setQuizAnswers(prev => [...prev, selectedAnswer])
    setSelectedAnswer(null)
    setShowExplanation(false)
    if (quizStep < QUIZ_QUESTIONS.length - 1) { setQuizStep(s => s + 1) } else { setPhase('certificate') }
  }

  function handleShare() {
    const text = `🏛️ I just completed Market Architects — a value investing simulation game!\n\n📊 Result: ${score.tier}\n⭐ Stars: ${score.stars}/5\n✅ Criteria: ${passCount}/7\n🧠 Quiz: ${quizScore}/20\n\nLearn investing by running a company → marketarchitect.netlify.app`
    if (navigator.share) { navigator.share({ title: 'Market Architects Certificate', text }) }
    else { navigator.clipboard?.writeText(text); alert('Certificate text copied! Paste it on WhatsApp, LinkedIn or Twitter.') }
  }

  function playAgain() { localStorage.removeItem('ma_session'); window.location.reload() }

  // RESULTS PHASE
  if (phase === 'results') return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', padding: 20, fontFamily: "'Inter',sans-serif" } },
    React.createElement('div', { style: { maxWidth: 400, margin: '0 auto' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 24 } },
        React.createElement('div', { style: { fontSize: 64 } }, score.stars >= 4 ? '🏆' : score.stars >= 3 ? '📈' : score.stars >= 1 ? '📊' : '💀'),
        React.createElement('div', { style: { fontSize: 22, fontWeight: 900, color: tierColor } }, score.tier),
        React.createElement('div', null, React.createElement(Stars, { count: score.stars })),
        React.createElement('div', { style: { fontSize: 13, color: T.muted, marginTop: 8 } }, score.desc)
      ),
      React.createElement('div', { style: { ...css.card, marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 700, marginBottom: 12 } }, 'Final Scorecard'),
        Object.values(criteria.criteria).map((c, i) => React.createElement(CriterionRow, { key: i, criterion: c }))
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
      React.createElement('button', { onClick: () => setPhase('quiz'), style: { ...css.btn(T.gold), padding: 14, fontSize: 15, marginBottom: 12 } }, '🧠 Take Certification Quiz →'),
      React.createElement('button', { onClick: playAgain, style: { ...css.btn(T.muted), padding: 12, fontSize: 13 } }, '🔄 Play Again')
    )
  )

  // QUIZ PHASE
  if (phase === 'quiz') {
    const q = QUIZ_QUESTIONS[quizStep]
    const isCorrect = selectedAnswer === q.correct
    return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', padding: 20, fontFamily: "'Inter',sans-serif" } },
      React.createElement('div', { style: { maxWidth: 400, margin: '0 auto' } },
        React.createElement('div', { style: { marginBottom: 20 } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
            React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: T.gold } }, '🧠 Certification Quiz'),
            React.createElement('div', { style: { fontSize: 13, color: T.muted } }, `${quizStep + 1}/${QUIZ_QUESTIONS.length}`)
          ),
          React.createElement('div', { style: { height: 6, background: T.surface, borderRadius: 3 } },
            React.createElement('div', { style: { height: '100%', width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg,${T.gold},${T.orange})`, borderRadius: 3, transition: 'width 0.3s' } })
          ),
          React.createElement('div', { style: { fontSize: 11, color: T.muted, marginTop: 6 } }, `Score so far: ${quizAnswers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length}/${quizStep} correct`)
        ),
        React.createElement('div', { style: { ...css.card, marginBottom: 16 } },
          React.createElement('div', { style: { fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.7, marginBottom: 16 } }, q.q),
          q.options.map((opt, i) =>
            React.createElement('button', {
              key: i,
              onClick: () => !showExplanation && handleAnswer(i),
              style: {
                width: '100%', padding: 12, marginBottom: 8, borderRadius: 10, textAlign: 'left', fontSize: 12, lineHeight: 1.6,
                cursor: showExplanation ? 'default' : 'pointer', fontWeight: 500,
                background: !showExplanation ? T.surface : i === q.correct ? `${T.green}18` : i === selectedAnswer ? `${T.red}18` : T.surface,
                border: !showExplanation ? `1px solid ${T.border}` : i === q.correct ? `1px solid ${T.green}` : i === selectedAnswer ? `1px solid ${T.red}` : `1px solid ${T.border}`,
                color: !showExplanation ? T.text : i === q.correct ? T.green : i === selectedAnswer ? T.red : T.muted,
              }
            },
              React.createElement('span', { style: { fontWeight: 700, marginRight: 8 } }, `${String.fromCharCode(65 + i)}.`), opt
            )
          )
        ),
        showExplanation && React.createElement('div', { style: { ...css.card, marginBottom: 16, border: `1px solid ${isCorrect ? T.green : T.red}44` } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 800, color: isCorrect ? T.green : T.red, marginBottom: 8 } }, isCorrect ? '✅ Correct!' : '❌ Not quite'),
          React.createElement('div', { style: { fontSize: 12, color: T.text, lineHeight: 1.8 } }, q.explanation)
        ),
        showExplanation && React.createElement('button', { onClick: nextQuestion, style: { ...css.btn(T.gold), padding: 14, fontSize: 14 } },
          quizStep < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'See My Certificate →'
        )
      )
    )
  }

  // CERTIFICATE PHASE
  if (phase === 'certificate') {
    return React.createElement(CertificatePhase, {
      playerName, score, gameState, passCount, quizScore, onConvert: () => setPhase('convert'), onPlayAgain: playAgain
    })
  }

  // CONVERSION PHASE
  if (phase === 'convert') return React.createElement('div', { style: { background: T.bg, minHeight: '100vh', padding: 20, fontFamily: "'Inter',sans-serif" } },
    React.createElement('div', { style: { maxWidth: 400, margin: '0 auto' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 24 } },
        React.createElement('div', { style: { fontSize: 52 } }, '📈'),
        React.createElement('div', { style: { fontSize: 20, fontWeight: 900, color: T.gold } }, 'Ready for Real Markets?'),
        React.createElement('div', { style: { fontSize: 13, color: T.muted, marginTop: 8, lineHeight: 1.7 } }, 'You just spent 5 simulated years learning to analyse companies, protect competitive advantages, and manage financial health — the same skills professional investors use every day.')
      ),
      React.createElement('div', { style: { ...css.card, marginBottom: 16, border: `1px solid ${T.green}33` } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 800, color: T.green, marginBottom: 12 } }, '✅ What You Now Know'),
        [
          'How to evaluate a company\'s economic moat',
          'Why cash flow matters more than revenue',
          'How intrinsic value differs from market price',
          'Why Return on Equity determines long-term investor returns',
          'How to spot a financially healthy company before investing',
        ].map((item, i) =>
          React.createElement('div', { key: i, style: { display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` } },
            React.createElement('div', { style: { color: T.green, fontWeight: 700, flexShrink: 0 } }, '→'),
            React.createElement('div', { style: { fontSize: 12, color: T.text, lineHeight: 1.6 } }, item)
          )
        )
      ),
      React.createElement('div', { style: { ...css.card, marginBottom: 16, border: `2px solid ${T.gold}44`, background: `linear-gradient(135deg, ${T.card} 0%, #1a2a0a 100%)` } },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: 16 } },
          React.createElement('div', { style: { fontSize: 32 } }, '🏦'),
          React.createElement('div', { style: { fontSize: 16, fontWeight: 900, color: T.gold } }, 'Markets4you'),
          React.createElement('div', { style: { fontSize: 11, color: T.muted, marginTop: 4 } }, 'Licensed International Broker')
        ),
        React.createElement('div', { style: { fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 16, textAlign: 'center' } },
          'Apply the value investing skills you just learned with real stocks, forex, and indices. Markets4you gives you access to global markets from Nigeria.'
        ),
        ['✅ Regulated and licensed broker', '✅ Trade global stocks, forex and indices', '✅ Start with as little as $10', '✅ Nigerian customer support'].map((item, i) =>
          React.createElement('div', { key: i, style: { fontSize: 12, color: T.text, padding: '4px 0' } }, item)
        ),
        React.createElement('a', {
          href: 'https://www.markets4you.online/?affid=bl97twp',
          target: '_blank',
          rel: 'noopener noreferrer',
          style: { display: 'block', marginTop: 16, padding: 16, background: T.gold, borderRadius: 12, color: '#000', fontWeight: 900, fontSize: 15, textAlign: 'center', textDecoration: 'none' }
        }, '🚀 Open My Markets4you Account →')
      ),
      React.createElement('div', { style: { fontSize: 10, color: T.muted, textAlign: 'center', marginBottom: 16, lineHeight: 1.6 } },
        'Trading involves risk. Only invest what you can afford to lose. Market Architects teaches financial concepts for educational purposes.'
      ),
      React.createElement('button', { onClick: playAgain, style: { ...css.btn(T.muted), padding: 12, fontSize: 13 } }, '🔄 Play Again')
    )
  )

  return null
}

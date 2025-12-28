import { Contractor, TrustIndicators, Verification } from "@/types";

export type TrustLevel = "excellent" | "good" | "fair" | "poor";

export interface TrustScore {
  score: number;
  level: TrustLevel;
  verificationScore: number;
  performanceScore: number;
  reliabilityScore: number;
}

export function calculateTrustScore(contractor: Contractor): TrustScore {
  const verificationScore = calculateVerificationScore(contractor.verifications || []);
  const performanceScore = calculatePerformanceScore(contractor);
  const reliabilityScore = calculateReliabilityScore(contractor.trustIndicators);

  const score = Math.round(
    verificationScore * 0.4 +
    performanceScore * 0.3 +
    reliabilityScore * 0.3
  );

  return {
    score,
    level: getTrustLevel(score),
    verificationScore,
    performanceScore,
    reliabilityScore,
  };
}

function calculateVerificationScore(verifications: Verification[]): number {
  if (verifications.length === 0) return 20;

  const weights = {
    identity: 10,
    license: 25,
    insurance: 25,
    background: 15,
    references: 15,
    payment: 10,
  };

  let totalScore = 0;
  let maxScore = 0;

  for (const [type, weight] of Object.entries(weights)) {
    maxScore += weight;
    const verification = verifications.find(v => v.type === type);
    if (verification?.verified) {
      totalScore += weight;
    }
  }

  return Math.round((totalScore / maxScore) * 100);
}

function calculatePerformanceScore(contractor: Contractor): number {
  let score = 0;

  const rating = Number(contractor.rating) || 0;
  score += (rating / 5) * 40;

  const reviewCount = Number(contractor.reviewCount) || 0;
  const reviewBonus = Math.min(reviewCount / 10, 10);
  score += reviewBonus;

  const completedProjects = Number(contractor.completedProjects) || 0;
  const projectBonus = Math.min(completedProjects / 20, 20);
  score += projectBonus;

  const yearsInBusiness = Number(contractor.yearsInBusiness) || 0;
  const experienceBonus = Math.min(yearsInBusiness / 2, 15);
  score += experienceBonus;

  const specialtiesCount = Array.isArray(contractor.specialties) ? contractor.specialties.length : 0;
  const specialtiesBonus = Math.min(specialtiesCount * 3, 15);
  score += specialtiesBonus;

  return Math.round(score);
}

function calculateReliabilityScore(indicators?: TrustIndicators): number {
  if (!indicators || Object.keys(indicators).length === 0) return 50;

  let score = 0;

  score += ((indicators.responseRate || 0) / 100) * 25;

  const responseTime = indicators.responseTime || 24;
  const responseTimeScore = responseTime <= 2 ? 20 :
    responseTime <= 6 ? 15 :
      responseTime <= 12 ? 10 : 5;
  score += responseTimeScore;

  score += ((indicators.onTimeRate || 0) / 100) * 30;

  score += ((indicators.repeatClientRate || 0) / 100) * 15;

  const disputeRate = indicators.disputeRate || 0;
  const disputeScore = disputeRate <= 2 ? 10 :
    disputeRate <= 5 ? 7 :
      disputeRate <= 10 ? 4 : 0;
  score += disputeScore;

  return Math.round(score);
}

function getTrustLevel(score: number): TrustLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

export function getTrustLevelColor(level: TrustLevel): string {
  const colors = {
    excellent: "#10B981",
    good: "#3B82F6",
    fair: "#F59E0B",
    poor: "#EF4444",
  };
  return colors[level];
}

export function getTrustLevelLabel(level: TrustLevel): string {
  const labels = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Needs Improvement",
  };
  return labels[level];
}

export function getVerificationLabel(type: Verification["type"]): string {
  const labels = {
    identity: "Identity Verified",
    license: "Licensed",
    insurance: "Insured",
    background: "Background Checked",
    references: "References Verified",
    payment: "Payment Verified",
  };
  return labels[type];
}

export function generateTrustSuggestions(contractor: Contractor): string[] {
  const suggestions: string[] = [];
  const trustScore = calculateTrustScore(contractor);
  const verifications = contractor.verifications || [];

  if (trustScore.score >= 85) {
    suggestions.push("Top rated contractor with excellent track record");
  }

  if (!verifications.find(v => v.type === "license" && v.verified)) {
    suggestions.push("Request to see license documentation");
  }

  if (!verifications.find(v => v.type === "insurance" && v.verified)) {
    suggestions.push("Confirm insurance coverage before hiring");
  }

  if ((contractor.rating || 0) >= 4.8 && (contractor.reviewCount || 0) >= 50) {
    suggestions.push("Highly rated by clients with consistent feedback");
  }

  if (contractor.trustIndicators) {
    const { responseTime, onTimeRate, repeatClientRate } = contractor.trustIndicators;

    if (responseTime <= 2) {
      suggestions.push("Responds quickly to inquiries (avg. within 2 hours)");
    }

    if (onTimeRate >= 95) {
      suggestions.push("Excellent track record for on-time project completion");
    }

    if (repeatClientRate >= 50) {
      suggestions.push("More than half of clients return for additional work");
    }
  }

  if ((contractor.completedProjects || 0) >= 100) {
    suggestions.push("Experienced professional with extensive project history");
  }

  if ((contractor.yearsInBusiness || 0) >= 10) {
    suggestions.push(`Established business with ${contractor.yearsInBusiness}+ years experience`);
  }

  if (verifications.length >= 4) {
    suggestions.push("Comprehensive verification completed");
  }

  if (trustScore.score < 70) {
    suggestions.push("Consider requesting additional references");
    suggestions.push("Request proof of current insurance coverage");
  }

  return suggestions;
}

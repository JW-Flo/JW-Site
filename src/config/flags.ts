// Centralized feature flag parsing & safe projection

export interface RawEnv {
  FEATURE_CONSENT_D1?: string;
  FEATURE_GEO_CLASSIFICATION?: string;
  FEATURE_WAITLIST?: string;
}

export interface Flags {
  consentD1: boolean;
  geoClassification: boolean;
  waitlist: boolean;
}

export function loadFlags(env: RawEnv): Flags {
  return {
    consentD1: env.FEATURE_CONSENT_D1 === 'true',
    geoClassification: env.FEATURE_GEO_CLASSIFICATION === 'true',
    waitlist: env.FEATURE_WAITLIST === 'true'
  };
}

// Only expose non-sensitive flags
export function projectClientFlags(f: Flags) {
  return {
    FEATURE_CONSENT_D1: String(f.consentD1),
    FEATURE_GEO_CLASSIFICATION: String(f.geoClassification),
    FEATURE_WAITLIST: String(f.waitlist)
  };
}

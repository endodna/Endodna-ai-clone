/**
 * Dosing-related TypeScript types matching backend schema
 */

enum DosageTier {
  CONSERVATIVE = "conservative",
  STANDARD = "standard",
  AGGRESSIVE = "aggressive",
  HIGH_PERFORMANCE = "high_performance",
}

enum DosageHistoryType {
  T100 = "T100",
  T200 = "T200",
  ESTRADIOL = "ESTRADIOL",
}

enum PelletType {
  T100 = "T100",
  T200 = "T200",
}

/**
 * Dosing tier data structure from API response
 */
interface DosingTierData {
  tier: DosageTier;
  dosageMg: number;
  pelletsCount: number;
  dosingSuggestions?: Record<string, unknown>;
}

/**
 * Parsed data structure from PatientDosageHistory.data field
 */
interface DosageHistoryData {
  T100?: DosingTierData;
  T200?: DosingTierData;
  ESTRADIOL?: DosingTierData;
}

/**
 * Doctor information in dosage history
 */
interface DosageHistoryDoctor {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Single dosage history entry from API
 */
interface PatientDosageHistoryEntry {
  id: string;
  data: DosageHistoryData;
  type: DosageHistoryType;
  isOverridden: boolean;
  createdAt: string;
  updatedAt: string;
  doctor: DosageHistoryDoctor;
}

/**
 * API response for getDosingHistory endpoint
 */
type DosingHistoryResponse = PatientDosageHistoryEntry[];

/**
 * Testosterone Dosing Suggestions Response
 */
type TestosteroneDosingSuggestionsResponse = Record<DosageTier, Record<string, unknown>>;

/**
 * Estradiol Dosing Suggestions Response
 */
type EstradiolDosingSuggestionsResponse = Record<DosageTier, Record<string, unknown>>;

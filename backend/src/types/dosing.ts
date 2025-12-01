import { DosageHistoryType, Gender } from "@prisma/client";

export enum SmokingStatus {
    NEVER = "never",
    FORMER = "former",
    CURRENT = "current",
}

export enum ExerciseLevel {
    SEDENTARY = "sedentary",
    LIGHT = "light",
    MODERATE = "moderate",
    VIGOROUS = "vigorous",
}

export interface PatientDemographicsParams {
    weight: number;
    height: number;
    age: number;
    biologicalSex: Gender
}

export interface DosageClinicalParams {
    shbgLevel?: number;
    baselineTotalTestosterone?: number;
    baselineFreeTestosterone?: number;
    postInsertionTotalTestosterone?: number;
    insertionDate?: Date;
    baselineEstradiol?: number;
    postInsertionEstradiol?: number;
    vitaminDLevel?: number;
    hematocrit?: number;
    currentPSA?: number;
    previousPSA?: number;
    monthsBetweenPSA?: number;
    prostateSymptomsIpss?: number;
    fshLevel?: number;
    symptomSeverity?: number;
}

export interface TestosteroneDosageLifeStyleFactorsParams {
    smokingStatus?: SmokingStatus;
    exerciseLevel?: ExerciseLevel;
}

export interface TestosteroneDosageMedicationsParams {
    opiods?: boolean;
    opiodsList?: string[];
    adhdStimulants?: boolean;
    adhdStimulantsList?: string[];
    otherMedicationsList?: string[];
}

export enum Cyp19a1Status {
    NORMAL = "normal",
    HIGH_EXPRESSION = "high_expression",
    LOW_EXPRESSION = "low_expression"
}

export enum Cyp3a4Status {
    NORMAL = "normal",
    INTERMEDIATE = "intermediate",
    FAST = "fast",
    SLOW = "slow",
}

export enum Ugt2b17Status {
    NORMAL = "normal",
    INTERMEDIATE = "intermediate",
    FAST = "fast",
    DELETION = "deletion",
}

export enum Srd5a2Status {
    NORMAL = "normal",
    HIGH_ACTIVITY = "high_activity",
    HIGH = "high",
}

export enum VdrStatus {
    NORMAL = "normal",
    LOW_FUNCTION = "low_function",
}

export enum AntioxidantSnpsStatus {
    NORMAL = "normal",
    POOR_FUNCTION = "poor_function",
}

export interface DosageGeneticDataParams {
    cyp19a1Status?: Cyp19a1Status;
    cyp3a4Status?: Cyp3a4Status;
    ugt2b17Status?: Ugt2b17Status;
    srd5a2Status?: Srd5a2Status;
    vdrStatus?: VdrStatus;
    antioxidantSnps?: AntioxidantSnpsStatus;
}

export enum DosageTier {
    CONSERVATIVE = "conservative",
    STANDARD = "standard",
    AGGRESSIVE = "aggressive",
    HIGH_PERFORMANCE = "high_performance",
}

export interface TestosteroneDosageTierSelectionParams {
    selectedTier: DosageTier;
    customMgKg?: number;
}

export enum PelletType {
    T100 = "T100",
    T200 = "T200",
}

export interface TestosteroneDosageProtocolSelection {
    pelletType: PelletType;
    t100Indication?: string;
    automaticT200Recommendation?: boolean;
}

export interface TestosteroneDosageParams {
    patientDemographics: PatientDemographicsParams;
    clinical: DosageClinicalParams;
    lifeStyleFactors: TestosteroneDosageLifeStyleFactorsParams;
    medications: TestosteroneDosageMedicationsParams;
    geneticData: DosageGeneticDataParams;
    tierSelection: TestosteroneDosageTierSelectionParams;
    protocolSelection: TestosteroneDosageProtocolSelection;
}

export enum DosageCalculationBreakdownStep {
    BASE_DOSE = "base_dose",
    SHBG_MODIFIER = "shbg_modifier",
    AGE_MODIFIER = "age_modifier",
    BMI_AROMATIZATION_MODIFIER = "bmi_aromatization_modifier",
    MEDICATION_MODIFIER = "medication_modifier",
    GENETIC_MODIFIER = "genetic_modifier",
    VITAMIN_D_LEVEL_VDR_CONSIDERATIONS_MODIFIER = "vitamin_d_level_vdr_considerations_modifier",
    ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER = "estradiol_monitoring_management_modifier",
    PSA_PROSTATE_MONITORING_MODIFIER = "psa_prostate_monitoring_modifier",
    FINAL_DOSE = "final_dose",
}

export interface DosageCalculationBreakdown {
    step: DosageCalculationBreakdownStep;
    condition: string;
    alerts?: string[];
    criticalAlerts?: string[];
    suggestions?: string[];
    recommendations?: string[];
    strongRecommendations?: string[];
    contraindications?: string[];
    notes?: string[];
    holds?: string[];
    considerations?: string[];
    cautions?: string[];
    treatments?: string[];
    actions?: string[];
    urgentActions?: string[];
    prerequisites?: string[];
    requirements?: string[];
    supplements?: string[];
    monitoring?: string[];
    urgentMonitoring?: string[];
    warnings?: string[];
    previousValue: number;
    multiplier: number;
    adjustedValue: number;
    previousDurationDays: number;
    adjustedDurationDays: number;
    additionalDurationDays: number;
}

export interface AlternativeDose {
    dose: number;
    rationale?: string;
    pellets?: string;
}

export interface DosageCalculation {
    //T200
    baseDoseMg: number;
    shbgMultiplier: number;
    bmiMultiplier: number;
    medicationMultiplier: number;
    geneticMultiplier: number;
    preliminaryDoseMg: number;
    finalDoseMg: number;
    pelletCount: number;
    basePelletCount: number;
    calculationBreakdown: DosageCalculationBreakdown[]
    //T100
    t100Multiplier?: number;
    doseAfterT100Factor?: number;
    //Estradiol
    ageMultiplier?: number;
    pelletConfiguration?: string;
    confidence?: string;
    alternativeDoses?: AlternativeDose[];
}

export interface Supplement {
    name: string;
    dose: string;
    unit?: string;
    frequency?: string;
    timing?: string;
    purpose?: string;
    isCore?: boolean;
}

export interface MonitoringSchedule {
    timepoint: string;
    idealDate?: Date;
    testsRequired: string;
    purpose: string;
    notes?: string;
}

export interface TestosteroneDosageClinicalRecommendation {
    supplements: Supplement[];
    monitoringSchedules: MonitoringSchedule[];
    expectedDurationDays: number;
    alerts: string[];
    warnings: string[];
    criticalAlerts: string[];
    suggestions: string[];
    recommendations: string[];
}
export interface TestosteroneDosageFollowUpSchedule {
    peakLabsDate?: Date;
    midpointLabsDate?: Date;
    troughLabsDate?: Date;
    symptomCheckDate?: Date;
    psaCheckDate?: Date;
    nextInsertionEstimatedDate?: Date;
}

export interface TestosteroneDosageProstateMonitoring {
    baselinePSA?: number;
    psaThroldAlert?: boolean;
    psaVelocity?: number;
    psaMonitoringFrequency?: string;
    urologicalReferralNeeded?: boolean;
}

export interface TestosteroneDosageProtocolComparison {
    t100DurationEstimatedDays?: number;
    t200DurationEstimatedDays?: number;
    t100PelletCount?: number;
    t200PelletCount?: number;
    recommendSwitchtoT200?: boolean;
    switchRationale?: string;
}

export interface TestosteroneDosageDurationPrediction {
    baseDurationDays?: number;
    medicationAdjustmentDays?: number;
    geneticAdjustmentDays?: number;
    finalExpectedDurationDays?: number;
    durationWarning?: boolean;
    durationAlert?: string;
    t200RecommendationTriggered?: boolean;
}

export interface TestosteroneDosageResult {
    dosingCalculation: DosageCalculation;
    clinicalRecommendations: TestosteroneDosageClinicalRecommendation;
    followUpSchedule?: TestosteroneDosageFollowUpSchedule;
    prostateMonitoring?: TestosteroneDosageProstateMonitoring;
    protocolComparison?: TestosteroneDosageProtocolComparison;
    durationPrediction?: TestosteroneDosageDurationPrediction;
}

export enum ValidT100Indications {
    FIRST_TIME_PELLET_TRIAL = "first_time_pellet_trial",
    PREFER_SHORTER_DURATION = "prefer_shorter_duration",
    ATHLETE_PRECISE_CONTROL = "athlete_precise_control",
    FREQUENT_MONITORING_PREFERENCE = "frequent_monitoring_preference",
    SPECIFIC_METABOLIC_PROFILE = "specific_metabolic_profile",
}

export interface RecommendPelletProtocolForMaleParams {
    lifeStyleFactors: TestosteroneDosageLifeStyleFactorsParams;
    medications: TestosteroneDosageMedicationsParams;
    geneticData: DosageGeneticDataParams;
    protocolSelection: TestosteroneDosageProtocolSelection;
}

export enum RecommendationStrength {
    STRONGLY_RECOMMENDED = "strongly_recommended",
    RECOMMENDED = "recommended",
    ACCEPTABLE = "acceptable",
    STANDARD = "standard",
}

export interface RecommendPelletProtocolForMaleResult {
    protocol: PelletType;
    strength: RecommendationStrength;
    rationale: string;
    estimatedT100Duration: number;
    estimatedT200Duration: number;
    allowT100Override: boolean;
    t200Alternative?: string;
    t100Note?: string;
}

export interface TestosteroneDosageConfig {
    maxDoseMg: number;
    maxPelletsCount: number;
    t100Multiplier: number;
    expectedDurationDays: number;
    coreSupplements: Supplement[];
    peakLabsDays: number;
    troughAssessmentDays: number;
    symptomCheckDays: number;
    psaCheckDays: number;
}

interface PatientDosageHistoryData {
    tier: DosageTier;
    pelletsCount: number;
    dosageMg: number;
    data: Record<string, any>;
}

export interface PatientDosageHistory {
    id: string;
    data: Record<string, PatientDosageHistoryData>;
    type: DosageHistoryType;
    tier: DosageTier;
    dosageMg: number;
    pelletsCount: number;
    isOverridden: boolean;
}

export interface EstradiolDosageParams {
    patientDemographics: PatientDemographicsParams;
    clinical: DosageClinicalParams;
    tier: DosageTier
    geneticData: DosageGeneticDataParams
}

export interface EstradiolDosageResult {
    dosingCalculation: DosageCalculation;
    clinicalRecommendations: TestosteroneDosageClinicalRecommendation;
}

export interface EstradiolDosageConfig {
    incrementMg: number;
}

export type PatientInfoClinicalData = DosageClinicalParams;
export type PatientInfoLifeStyleFactors = TestosteroneDosageLifeStyleFactorsParams;
export type PatientInfoMedications = TestosteroneDosageMedicationsParams;

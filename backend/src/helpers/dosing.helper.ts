import { DosageHistoryType, Gender } from "@prisma/client";
import moment from "moment";

enum SmokingStatus {
    NEVER = "never",
    FORMER = "former",
    CURRENT = "current",
}

enum ExerciseLevel {
    SEDENTARY = "sedentary",
    LIGHT = "light",
    MODERATE = "moderate",
    VIGOROUS = "vigorous",
}

interface TestosteroneDosagePatientDemographicsParams {
    weight: number;
    height: number;
    age: number;
    biologicalSex: Gender
}

export interface TestosteroneDosageClinicalParams {
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

interface TestosteroneDosageGeneticDataParams {
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

interface TestosteroneDosageTierSelectionParams {
    selectedTier: DosageTier;
    customMgKg?: number;
}

export enum PelletType {
    T100 = "T100",
    T200 = "T200",
}

interface TestosteroneDosageProtocolSelection {
    pelletType: PelletType;
    t100Indication?: string;
    automaticT200Recommendation?: boolean;
}

export interface TestosteroneDosageParams {
    patientDemographics: TestosteroneDosagePatientDemographicsParams;
    clinical: TestosteroneDosageClinicalParams;
    lifeStyleFactors: TestosteroneDosageLifeStyleFactorsParams;
    medications: TestosteroneDosageMedicationsParams;
    geneticData: TestosteroneDosageGeneticDataParams;
    tierSelection: TestosteroneDosageTierSelectionParams;
    protocolSelection: TestosteroneDosageProtocolSelection;
}

enum TestosteroneDosageCalculationBreakdownStep {
    BASE_DOSE = "base_dose",
    SHBG_MODIFIER = "shbg_modifier",
    BMI_AROMATIZATION_MODIFIER = "bmi_aromatization_modifier",
    MEDICATION_MODIFIER = "medication_modifier",
    GENETIC_MODIFIER = "genetic_modifier",
    VITAMIN_D_LEVEL_VDR_CONSIDERATIONS_MODIFIER = "vitamin_d_level_vdr_considerations_modifier",
    ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER = "estradiol_monitoring_management_modifier",
    PSA_PROSTATE_MONITORING_MODIFIER = "psa_prostate_monitoring_modifier",
    FINAL_DOSE = "final_dose",
}

interface TestosteroneDosageCalculationBreakdown {
    step: TestosteroneDosageCalculationBreakdownStep;
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

interface TestosteroneDosageCalculation {
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
    calculationBreakdown: TestosteroneDosageCalculationBreakdown[]
    //T100
    t100Multiplier?: number;
    doseAfterT100Factor?: number;
}

interface Supplement {
    name: string;
    dose: number;
    unit?: string;
    frequency?: string;
    notes?: string;
    timing?: string;
    purpose?: string;
}

interface MonitoringSchedule {
    name: string;
    frequency: string;
    days: number;
}

interface TestosteroneDosageClinicalRecommendation {
    supplements: Supplement[];
    monitoringSchedules: MonitoringSchedule[];
    expectedDurationDays: number;
    alerts: string[];
    warnings: string[];
    criticalAlerts: string[];
    suggestions: string[];
    recommendations: string[];
}
interface TestosteroneDosageFollowUpSchedule {
    peakLabsDate?: Date;
    midpointLabsDate?: Date;
    troughLabsDate?: Date;
    symptomCheckDate?: Date;
    psaCheckDate?: Date;
    nextInsertionEstimatedDate?: Date;
}

interface TestosteroneDosageProstateMonitoring {
    baselinePSA?: number;
    psaThroldAlert?: boolean;
    psaVelocity?: number;
    psaMonitoringFrequency?: string;
    urologicalReferralNeeded?: boolean;
}

interface TestosteroneDosageProtocolComparison {
    t100DurationEstimatedDays?: number;
    t200DurationEstimatedDays?: number;
    t100PelletCount?: number;
    t200PelletCount?: number;
    recommendSwitchtoT200?: boolean;
    switchRationale?: string;
}

interface TestosteroneDosageDurationPrediction {
    baseDurationDays?: number;
    medicationAdjustmentDays?: number;
    geneticAdjustmentDays?: number;
    finalExpectedDurationDays?: number;
    durationWarning?: boolean;
    durationAlert?: string;
    t200RecommendationTriggered?: boolean;
}

export interface TestosteroneDosageResult {
    dosingCalculation: TestosteroneDosageCalculation;
    clinicalRecommendations: TestosteroneDosageClinicalRecommendation;
    followUpSchedule?: TestosteroneDosageFollowUpSchedule;
    prostateMonitoring?: TestosteroneDosageProstateMonitoring;
    protocolComparison?: TestosteroneDosageProtocolComparison;
    durationPrediction?: TestosteroneDosageDurationPrediction;
}

enum ValidT100Indications {
    FIRST_TIME_PELLET_TRIAL = "first_time_pellet_trial",
    PREFER_SHORTER_DURATION = "prefer_shorter_duration",
    ATHLETE_PRECISE_CONTROL = "athlete_precise_control",
    FREQUENT_MONITORING_PREFERENCE = "frequent_monitoring_preference",
    SPECIFIC_METABOLIC_PROFILE = "specific_metabolic_profile",
}

interface RecommendPelletProtocolForMaleParams {
    lifeStyleFactors: TestosteroneDosageLifeStyleFactorsParams;
    medications: TestosteroneDosageMedicationsParams;
    geneticData: TestosteroneDosageGeneticDataParams;
    protocolSelection: TestosteroneDosageProtocolSelection;
}

enum RecommendationStrength {
    STRONGLY_RECOMMENDED = "strongly_recommended",
    RECOMMENDED = "recommended",
    ACCEPTABLE = "acceptable",
    STANDARD = "standard",
}

interface RecommendPelletProtocolForMaleResult {
    protocol: PelletType;
    strength: RecommendationStrength;
    rationale: string;
    estimatedT100Duration: number;
    estimatedT200Duration: number;
    allowT100Override: boolean;
    t200Alternative?: string;
    t100Note?: string;
}

interface TestosteroneDosageConfig {
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

class DosingHelper {
    private T100_Config: TestosteroneDosageConfig = {
        maxDoseMg: 1700,
        maxPelletsCount: 17,
        t100Multiplier: 0.6,
        expectedDurationDays: 105,
        peakLabsDays: 42,
        troughAssessmentDays: 70,
        symptomCheckDays: 6,
        psaCheckDays: 6,
        coreSupplements: [
            {
                name: "Vitamin D3",
                dose: 5000,
                unit: "IU",
                frequency: "Daily",
                purpose: "Optimize receptor function",
                timing: "Start pre-treatment if <30ng/mL"
            },
        ]
    }

    private T200_Config: TestosteroneDosageConfig = {
        maxDoseMg: 2800,
        maxPelletsCount: 14,
        t100Multiplier: 1,
        expectedDurationDays: 105,
        peakLabsDays: 42,
        troughAssessmentDays: 70,
        symptomCheckDays: 6,
        psaCheckDays: 6,
        coreSupplements: [
            {
                name: "Vitamin D3",
                dose: 5000,
                unit: "IU",
                frequency: "Daily",
                purpose: "Optimize receptor function",
                timing: "Start pre-treatment if <30ng/mL"
            },
        ]
    }

    private t100DosageTiersMapping: Record<DosageTier, number> = {
        [DosageTier.CONSERVATIVE]: 7,
        [DosageTier.STANDARD]: 9,
        [DosageTier.AGGRESSIVE]: 12,
        [DosageTier.HIGH_PERFORMANCE]: 15,
    }

    private t200DosageTiersMapping: Record<DosageTier, number> = {
        [DosageTier.CONSERVATIVE]: 11,
        [DosageTier.STANDARD]: 15,
        [DosageTier.AGGRESSIVE]: 18,
        [DosageTier.HIGH_PERFORMANCE]: 23,
    }

    public calculateBMI(weight: number, height: number): number {
        height = height / 100;
        return weight / (height * height);
    }

    private calculateT200PelletCountEstimate(
        params: TestosteroneDosageParams,
        t100BaseDoseMg: number,
        shbgMultiplier: number,
        bmiMultiplier: number,
        medicationMultiplier: number,
        geneticMultiplier: number
    ): number {
        const { patientDemographics, tierSelection } = params;
        let t200BaseDoseMg = patientDemographics.weight * this.t200DosageTiersMapping[tierSelection.selectedTier];


        const baseRemainder = t200BaseDoseMg % 200;
        if (baseRemainder < 100) {
            t200BaseDoseMg = Math.floor(t200BaseDoseMg / 200) * 200;
        } else {
            t200BaseDoseMg = Math.ceil(t200BaseDoseMg / 200) * 200;
        }

        let adjustedDoseMg = t200BaseDoseMg;
        adjustedDoseMg = adjustedDoseMg * shbgMultiplier * bmiMultiplier * medicationMultiplier * geneticMultiplier;


        const preliminaryDoseMg = Math.ceil(adjustedDoseMg / 200) * 200;
        let finalDoseMg = Math.min(preliminaryDoseMg, this.T200_Config.maxDoseMg);
        const remainder = finalDoseMg % 200;
        if (remainder < 100) {
            finalDoseMg = Math.floor(finalDoseMg / 200) * 200;
        } else {
            finalDoseMg = Math.ceil(finalDoseMg / 200) * 200;
        }

        return Math.ceil(finalDoseMg / 200);
    }

    private calculateBaseT100Dose(
        weight: number,
        tier: DosageTier,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[]
    ): { baseDoseMg: number; baseDurationDays: number } {
        const baseDoseMg = weight * this.t100DosageTiersMapping[tier] * this.T100_Config.t100Multiplier!;
        const baseDurationDays = this.T100_Config.expectedDurationDays;

        calculationBreakdown.push({
            step: TestosteroneDosageCalculationBreakdownStep.BASE_DOSE,
            condition: "Base dose calculation",
            previousValue: 0,
            multiplier: 1,
            adjustedValue: baseDoseMg,
            previousDurationDays: baseDurationDays,
            adjustedDurationDays: baseDurationDays,
            additionalDurationDays: 0,
        });

        return { baseDoseMg, baseDurationDays };
    }

    private calculateBaseT200Dose(
        weight: number,
        tier: DosageTier,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[]
    ): { baseDoseMg: number; baseDurationDays: number } {
        const baseDoseMg = weight * this.t200DosageTiersMapping[tier];
        const baseDurationDays = this.T200_Config.expectedDurationDays;

        calculationBreakdown.push({
            step: TestosteroneDosageCalculationBreakdownStep.BASE_DOSE,
            condition: "Base dose calculation",
            previousValue: 0,
            multiplier: 1,
            adjustedValue: baseDoseMg,
            previousDurationDays: baseDurationDays,
            adjustedDurationDays: baseDurationDays,
            additionalDurationDays: 0,
        });

        return { baseDoseMg, baseDurationDays };
    }

    private applySHBGModifier(
        shbgLevel: number | undefined,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        isT200: boolean
    ): { multiplier: number; adjustedDoseMg: number } {
        let shbgMultiplier = 1;

        if (shbgLevel && shbgLevel > 50) {
            shbgMultiplier = 1.1;
            const dose = adjustedDoseMg * shbgMultiplier;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.SHBG_MODIFIER,
                condition: "SHBG level is greater than 50",
                previousValue: adjustedDoseMg,
                multiplier: shbgMultiplier,
                adjustedValue: dose,
                alerts: isT200 ? [] : ["High SHBG level detected - increased dose or higher tier recommended."],
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
            });
            return { multiplier: shbgMultiplier, adjustedDoseMg: dose };
        } else if (shbgLevel && shbgLevel < 20) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.SHBG_MODIFIER,
                condition: "SHBG level is less than 20",
                previousValue: adjustedDoseMg,
                multiplier: shbgMultiplier,
                adjustedValue: adjustedDoseMg,
                alerts: isT200 ? ["Consider using conservative tier or lower end of selected tier."] : ["Low SHBG - Patient may be sensitive to standard doses."],
                suggestions: isT200 ? [] : ["Consider conservative tier or monitor closely  at lower dose."],
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
            });
        } else {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.SHBG_MODIFIER,
                condition: "SHBG level is within normal range",
                previousValue: adjustedDoseMg,
                multiplier: shbgMultiplier,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
            });
        }

        return { multiplier: shbgMultiplier, adjustedDoseMg };
    }

    private applyBMIModifier(
        bmi: number,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        isT200: boolean
    ): { multiplier: number; adjustedDoseMg: number } {
        let bmiMultiplier = 1;

        if (bmi >= 30 && bmi < 35) {
            bmiMultiplier = 1.075;
            const dose = adjustedDoseMg * bmiMultiplier;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
                condition: "BMI is greater than 30 and less than 35",
                previousValue: adjustedDoseMg,
                multiplier: bmiMultiplier,
                adjustedValue: dose,
                alerts: isT200 ? [] : ["Obesity detected - increased aromatization risk."],
                recommendations: isT200 ? [
                    "DIM supplementation",
                    "Monitor estradio at follow-up"
                ] : [
                    "DIM supplementation 200 - 300mg daily",
                    "Monitor estradiol at 6 week follow-up"
                ],
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
            });
            return { multiplier: bmiMultiplier, adjustedDoseMg: dose };
        } else if (bmi >= 35) {
            bmiMultiplier = 1.15;
            const dose = adjustedDoseMg * bmiMultiplier;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
                condition: "BMI is greater than 35",
                previousValue: adjustedDoseMg,
                multiplier: bmiMultiplier,
                adjustedValue: dose,
                alerts: isT200 ? [] : ["Severe obesity detected - high aromatization risk."],
                recommendations: isT200 ? [
                    "Aromatase inhibitor (anastrozole)",
                    "DIM supplementation",
                    "Monitor estradiol closely"
                ] : [
                    "Aromatase inhibitor (anastrozole) 0.5mg 2x/week",
                    "DIM supplementation 300mg daily",
                    "Monitor estradiol closely at all follow-ups"
                ],
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
            });
            return { multiplier: bmiMultiplier, adjustedDoseMg: dose };
        }

        return { multiplier: bmiMultiplier, adjustedDoseMg };
    }

    private applyMedicationModifiers(
        medications: TestosteroneDosageMedicationsParams,
        lifeStyleFactors: TestosteroneDosageLifeStyleFactorsParams,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        durationAlert: string[],
        isT200: boolean
    ): {
        multiplier: number;
        adjustedDoseMg: number;
        expectedDuration: number;
        durationWarning: boolean;
        t200RecommendationTriggered: boolean
    } {
        let medicationMultiplier = 1;
        let durationWarning = false;
        let t200RecommendationTriggered = false;
        let currentDose = adjustedDoseMg;
        let currentDuration = expectedDuration;

        if (medications.opiods) {
            medicationMultiplier = 1.15;
            const dose = currentDose * medicationMultiplier;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.MEDICATION_MODIFIER,
                condition: "Patient on opiods",
                previousValue: currentDose,
                multiplier: medicationMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: currentDuration,
                additionalDurationDays: 0,
                alerts: ["Patient on opiods - increased dose needed due to HPG suppression."],
                warnings: isT200 ? [] : ["Monitor for breakthrough symptoms."],
            });
            currentDose = dose;
            t200RecommendationTriggered = true;
        }

        if (medications.adhdStimulants) {
            medicationMultiplier = 1.10;
            const dose = currentDose * medicationMultiplier;
            const additionalDuration = -30;
            const adjustedDuration = currentDuration + additionalDuration;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.MEDICATION_MODIFIER,
                condition: "Patient on adhd stimulants",
                previousValue: currentDose,
                multiplier: medicationMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: adjustedDuration,
                additionalDurationDays: additionalDuration,
                alerts: isT200 ? [
                    "Stimulant use - expect FASTER clearance."
                ] : ["Stimulant use - expect FASTER clearance with T100."],
                suggestions: isT200 ? [] : ["Consider T200 protocol for longer duration."],
            });
            currentDose = dose;
            currentDuration = adjustedDuration;
            durationWarning = true;
            t200RecommendationTriggered = true;
        }

        if (lifeStyleFactors.smokingStatus === SmokingStatus.CURRENT) {
            medicationMultiplier = 1.10;
            const dose = currentDose * medicationMultiplier;
            const additionalDuration = -30;
            const adjustedDuration = currentDuration + additionalDuration;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.MEDICATION_MODIFIER,
                condition: "Patient is a smoker",
                previousValue: currentDose,
                multiplier: medicationMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: adjustedDuration,
                additionalDurationDays: additionalDuration,
                alerts: isT200 ? [
                    "Smoking reduces pellet duration"
                ] : ["Smoking reduces pellet duration significatly with T100."],
                suggestions: isT200 ? [] : ["Consider T200 protocol for longer duration."],
            });
            currentDose = dose;
            currentDuration = adjustedDuration;
            durationWarning = true;
            t200RecommendationTriggered = true;
        }

        if (!isT200 && medications.otherMedicationsList && medications.otherMedicationsList.length > 0) {
            const dose = currentDose * medicationMultiplier;
            const adjustedDuration = Math.min(currentDuration, 75);
            const additionalDuration = adjustedDuration - currentDuration;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.MEDICATION_MODIFIER,
                condition: "Patient on other medications",
                previousValue: currentDose,
                multiplier: medicationMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: adjustedDuration,
                additionalDurationDays: additionalDuration,
                criticalAlerts: ["MULTIPLE fast-clearance factors detected!"],
                recommendations: ["Strongly consider T200 protocol instead."],
            });
            currentDose = dose;
            currentDuration = adjustedDuration;
            durationWarning = true;
            durationAlert.push(" - Multiple fast-clearance factors detected!");
            t200RecommendationTriggered = true;
        }

        return {
            multiplier: medicationMultiplier,
            adjustedDoseMg: currentDose,
            expectedDuration: currentDuration,
            durationWarning,
            t200RecommendationTriggered
        };
    }

    private applyGeneticModifiers(
        geneticData: TestosteroneDosageGeneticDataParams,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        durationAlert: string[],
        isT200: boolean
    ): {
        multiplier: number;
        adjustedDoseMg: number;
        expectedDuration: number;
        durationWarning: boolean;
        t200RecommendationTriggered: boolean;
    } {
        let geneticMultiplier = 1;
        let currentDose = adjustedDoseMg;
        let currentDuration = expectedDuration;
        let durationWarning = false;
        let t200RecommendationTriggered = false;

        if (geneticData.cyp19a1Status && geneticData.cyp19a1Status === Cyp19a1Status.HIGH_EXPRESSION) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CYP19A1 high expression",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: currentDose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: currentDuration,
                additionalDurationDays: 0,
                supplements: isT200 ? [
                    "Aromatase inhibitor (anastrozole)",
                    "DIM"
                ] : ["Aromatase inhibitor (anastrozole) or DIM"],
                monitoring: isT200 ? [] : ["Estadiol at all follow-ups"],
                alerts: ["High aromatization risk - monitor estradiol closely."],
            });
        }

        if (!isT200 && geneticData.cyp3a4Status && geneticData.cyp3a4Status === Cyp3a4Status.FAST) {
            geneticMultiplier = 1.125;
            const dose = currentDose * geneticMultiplier;
            const additionalDuration = -14;
            const adjustedDuration = currentDuration + additionalDuration;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CYP3A4 fast metabolizer",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: adjustedDuration,
                additionalDurationDays: additionalDuration,
                alerts: ["CYP3A4 fast metabolizer - increased dose and SHORTER duration."],
                warnings: ["T100 duration may be only 10 - 12 weeks for this patient."]
            });
            currentDose = dose;
            currentDuration = adjustedDuration;
            durationWarning = true;
            durationAlert.push("CYP3A4 fast metabolizer - increased dose and SHORTER duration.");
            t200RecommendationTriggered = true;
        }

        if (!isT200 && geneticData.ugt2b17Status && (geneticData.ugt2b17Status === Ugt2b17Status.DELETION || geneticData.ugt2b17Status === Ugt2b17Status.FAST)) {
            geneticMultiplier = 1.125;
            const dose = currentDose * geneticMultiplier;
            const additionalDuration = -14;
            const adjustedDuration = currentDuration + additionalDuration;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "UGT2B17 fast metabolizer",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: adjustedDuration,
                additionalDurationDays: additionalDuration,
                criticalAlerts: ["UGT2B17 fast metabolizer DETECTED!"],
                warnings: ["This is a HIGH-IMPACT genotype for T100 protocol"],
                suggestions: ["Expected duration may be only 9 - 11 weeks."],
                recommendations: ["STRONGLY consider T200 protocol for longer duration."],
            });
            currentDose = dose;
            currentDuration = adjustedDuration;
            durationWarning = true;
            t200RecommendationTriggered = true;
        }

        if (!isT200 && geneticData.cyp3a4Status && geneticData.cyp3a4Status === Cyp3a4Status.FAST && geneticData.ugt2b17Status && geneticData.ugt2b17Status === Ugt2b17Status.FAST) {
            geneticMultiplier = 1;
            const dose = currentDose * geneticMultiplier;
            const newDuration = 70;
            const additionalDuration = Math.min(newDuration, currentDuration);
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CYP3A4 and UGT2B17 fast metabolizers",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: newDuration,
                additionalDurationDays: additionalDuration,
                criticalAlerts: ["DUAL fast metabolizer genotype!"],
                warnings: ["T100 duration likely <10 weeks for this patient."],
                recommendations: ["T200 protocol strongly recommended over T100."],
            });
            currentDose = dose;
            currentDuration = newDuration;
            durationWarning = true;
            t200RecommendationTriggered = true;
        }

        if (isT200 && ((geneticData.cyp3a4Status && geneticData.cyp3a4Status === Cyp3a4Status.FAST) || (geneticData.ugt2b17Status && geneticData.ugt2b17Status === Ugt2b17Status.FAST))) {
            geneticMultiplier = 1.125;
            const dose = currentDose * geneticMultiplier;
            const additionalDuration = -14;
            const adjustedDuration = currentDuration + additionalDuration;
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CYP3A4 or UGT2B17 fast metabolizer",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: dose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: adjustedDuration,
                additionalDurationDays: additionalDuration,
                alerts: ["Fast metabolizer detected - increased dose recommended"],
            });
            currentDose = dose;
            currentDuration = adjustedDuration;
        }

        if (!isT200 && geneticData.cyp3a4Status && geneticData.cyp3a4Status === Cyp3a4Status.SLOW && geneticData.ugt2b17Status && geneticData.ugt2b17Status === Ugt2b17Status.NORMAL) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CYP3A4 slow metabolizer and UGT2B17 normal metabolizer",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: currentDose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: currentDuration,
                additionalDurationDays: 0,
                alerts: ["Slow metabolizer detected."],
                notes: ["T100 effects may extend to 4-5 months (similar to T200)"],
                suggestions: ["This patient may do well with T100 protocol."]
            });
        }

        if (geneticData.srd5a2Status && geneticData.srd5a2Status === Srd5a2Status.HIGH) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "SRD5A2 high activity",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: currentDose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: currentDuration,
                additionalDurationDays: 0,
                alerts: ["Monitor for DHT-related side effects (acne, hair loss, oily skin)"],
                monitoring: ["DHT levels at follow-up"],
                supplements: isT200 ? [
                    "Zinc",
                    "Saw palmetto",
                    "DIM"
                ] : [
                    "Zinc 30mg daily.",
                    "Saw palmetto 320mg daily.",
                    "DIM 200-300mg daily.",
                ]
            });
        }

        if (geneticData.vdrStatus && geneticData.vdrStatus === VdrStatus.LOW_FUNCTION) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "VDR low function",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: currentDose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: currentDuration,
                additionalDurationDays: 0,
                alerts: ["Low VDR function - optimize vitamin D before treatment"],
                prerequisites: ["Vitamin D >30 ng/mL required before insertion"],
                recommendations: isT200 ? [] : ["Target Vitamin D 40-50 ng/mL for optimal response."],
            });
        }

        if (geneticData.antioxidantSnps && geneticData.antioxidantSnps === AntioxidantSnpsStatus.POOR_FUNCTION) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "Antioxidant SNPs poor function",
                previousValue: currentDose,
                multiplier: geneticMultiplier,
                adjustedValue: currentDose,
                previousDurationDays: currentDuration,
                adjustedDurationDays: currentDuration,
                additionalDurationDays: 0,
                notes: isT200 ? [] : ["Antioxidant support recommended for optimal response."],
                supplements: isT200 ? [
                    "NAC (N-acetylcysteine)",
                    "Zinc"
                ] : [
                    "NAC (N-acetylcysteine) 600mg daily.",
                    "Zinc 30mg daily."
                ],
            });
        }

        return {
            multiplier: geneticMultiplier,
            adjustedDoseMg: currentDose,
            expectedDuration: currentDuration,
            durationWarning,
            t200RecommendationTriggered
        };
    }

    private applyVitaminDAndVDRModifiers(
        clinical: TestosteroneDosageClinicalParams,
        geneticData: TestosteroneDosageGeneticDataParams,
        adjustedDoseMg: number,
        expectedDuration: number,
        geneticMultiplier: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        isT200: boolean
    ): void {
        if (clinical.vitaminDLevel && clinical.vitaminDLevel < 30) {
            const alerts: string[] = ["Vitamin D deficiency/insufficency detected"];
            const warnings: string[] = [];
            const strongRecommendations: string[] = [];
            const recommendations: string[] = isT200 ? [
                "Supplement with Vitamin D3 (5000 IU daily) + K2",
            ] : ["Supplement with Vitamin D3 (5000 IU daily) + K2 (100 - 200 mcg)"];
            const cautions: string[] = [];
            const notes: string[] = [];

            if (clinical.vitaminDLevel < 20) {
                strongRecommendations.push("Delay pellet insertion 4-8 weeks to optimize vitaminD");
                if (!isT200) {
                    warnings.push("SEVERE Vitamin D deficiency");
                    notes.push("Suboptimal testosterone response expected without correction.");
                }
                else {
                    warnings.push("Suboptimal testosterone response expected");
                }
            } else if (!isT200 && clinical.vitaminDLevel >= 20 && clinical.vitaminDLevel < 30) {
                cautions.push("May proceed but response may be suboptimal.");
                recommendations.push("Aggressive Vitamin D supplementation (10,000 IU daily x 4 weeks).");
            }

            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.VITAMIN_D_LEVEL_VDR_CONSIDERATIONS_MODIFIER,
                condition: "Vitamin D level is less than 30",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                alerts,
                recommendations,
                warnings,
                strongRecommendations,
                cautions,
                notes,
            });
        }

        if (geneticData.vdrStatus && geneticData.vdrStatus === VdrStatus.LOW_FUNCTION) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.VITAMIN_D_LEVEL_VDR_CONSIDERATIONS_MODIFIER,
                condition: "VDR low function",
                previousValue: adjustedDoseMg,
                multiplier: geneticMultiplier,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                alerts: ["VDR polymorphism detected - may reduce treatment response"],
                recommendations: isT200 ? [
                    "Target Vitamin D >40 ng/mL for this patient",
                ] : ["Target Vitamin D >40 ng/mL (higher than standard)."],
                monitoring: ["Monitor response closely at 6-week labs"],
                notes: isT200 ? [] : ["Patient may require higher testosterone doses due to reduced recepttor sensitivity."]
            });
        }
    }

    private applyEstradiolModifiers(
        clinical: TestosteroneDosageClinicalParams,
        bmi: number,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        isT200: boolean
    ): void {
        if (clinical.baselineEstradiol && clinical.baselineEstradiol >= 40) {
            const alerts: string[] = ["Elevated baseline Estradiol - high aromatase activity suspected."];
            const recommendations: string[] = isT200 ? [
                "DIM supplementation from day 1",
            ] : ["DIM supplementation 200-300mg daily from day 1"];
            const monitoring: string[] = ["Check Estradiol at 6-week follow-up"];
            const strongRecommendations: string[] = [];

            if (!isT200 && bmi >= 30) {
                strongRecommendations.push("Consider aromatase inhibitor due to obesity + elevated E2");
            }
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER,
                condition: "Baseline Estradiol is greater than 40",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                alerts,
                strongRecommendations,
                recommendations,
                monitoring,
            });
        }

        if (clinical.postInsertionEstradiol && clinical.postInsertionEstradiol >= 60) {
            const alerts: string[] = ["Excessive Estradiol detected at peak"];
            const monitoring: string[] = ["Recheck Estradiol in 4-6 weeks"];
            const warnings: string[] = isT200 ? [
                "Monitor for symptoms: water retention, mood changes, breast tenderness"
            ] : [
                "Monitor for symptoms: water retention, gynecosmastia, mood changes, sexual dysfunction"
            ];
            const criticalAlerts: string[] = [];
            const treatments: string[] = isT200 ? [
                "Inititate anastrozole 0.5mg twice weekly",
                "Continue DIM supplementation",
            ] : [
                "Inititate anastrozole 0.5mg twice weekly",
                "Continue or add DIM supplementation 300mg daily",
            ];
            const urgentMonitoring: string[] = [];

            if (!isT200 && clinical.postInsertionEstradiol >= 80) {
                criticalAlerts.push("VERY high estradiol - immediate intervention required");
                treatments.push("Anastrozole 0.5mg THREE times weekly");
                urgentMonitoring.push("Recheck estradiol in 2-3 weeks");
            }

            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER,
                condition: "Post-insertion Estradiol is greater than 60",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                alerts,
                monitoring,
                warnings,
                criticalAlerts,
                treatments,
                urgentMonitoring,
            });
        }

        if (!isT200 && clinical.postInsertionEstradiol && clinical.postInsertionEstradiol < 15) {
            const alerts: string[] = ["Estradiol may be too low"];
            const notes: string[] = ["Some estradiol is beneficial for bone health, libido, cardiovascular health"];
            const actions: string[] = ["Reduce or discontinue AI if currently using"];

            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER,
                condition: "Post-insertion Estradiol is less than 15",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                alerts,
                notes,
                actions,
            });
        }
    }

    private applyPSAAndProstateModifiers(
        patientDemographics: TestosteroneDosagePatientDemographicsParams,
        clinical: TestosteroneDosageClinicalParams,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
    ): number | undefined {
        if (patientDemographics.age >= 40 && !clinical.currentPSA) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
                condition: "Patient is 40 years or older and has not had a PSA test in the last year",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                requirements: ["PSA test required before testosterone therapy"]
            });
        }

        if (clinical.currentPSA && clinical.currentPSA > 4) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
                condition: "PSA is greater than 4",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                contraindications: ["PSA >4.0 - urological clearance requeired before TRT"],
                actions: ["Refer to urologist for evaluation"],
                holds: ["Do not proceed with pellet instruction"]
            });
        }

        if (clinical.currentPSA && clinical.currentPSA >= 2.5 && clinical.currentPSA <= 4) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
                condition: "PSA is between 2.5 and 4",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                cautions: ["Borderline elevated PSA"],
                requirements: ["Digital rectal exam (DRE) recommended"],
                monitoring: ["PSA at 6 weeks and 12 weeks post-insertion."]
            });
        }

        let psaVelocity: number | undefined;
        if (clinical.currentPSA && clinical.previousPSA && clinical.monthsBetweenPSA) {
            psaVelocity = ((clinical.currentPSA - clinical.previousPSA) / clinical.monthsBetweenPSA) * 12;
        }

        if (psaVelocity && psaVelocity > 1.5) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
                condition: "PSA velocity is greater than 1.5",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                criticalAlerts: ["Rapid PSA rise detected"],
                urgentActions: ["Immediate urological referral"],
                holds: ["Consider holding further testosterone until evaluated"]
            });
        } else if (psaVelocity && psaVelocity > 0.75) {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
                condition: "PSA velocity is greater than 0.75",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
                alerts: ["PSA velocity exceeds 0.75 ng/mL/year"],
                actions: ["Urological referral recommended"],
                considerations: ["May need to hold testosterone therapy pending evaluation"]
            });
        }

        return psaVelocity;
    }

    private calculateFinalDose(
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        isT200: boolean
    ): { preliminaryDoseMg: number; finalDoseMg: number; pelletCount: number; newExpectedDuration: number } {
        if (!isT200) {
            const newExpectedDuration = Math.max(expectedDuration, 60);
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.FINAL_DOSE,
                condition: "Final dose calculation",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: newExpectedDuration,
                additionalDurationDays: newExpectedDuration - expectedDuration,
                ...newExpectedDuration < 75 ? {
                    criticalAlerts: ["Expected duration is VERY short (<2.5 months)"],
                    strongRecommendations: ["Consider T200 protocol instead"]
                } : {}
            });

            const preliminaryDoseMg = Math.ceil(adjustedDoseMg / 100) * 100;
            let finalDoseMg = Math.min(preliminaryDoseMg, this.T100_Config.maxDoseMg);
            const remainder = finalDoseMg % 100;
            if (remainder < 50) {
                finalDoseMg = Math.floor(finalDoseMg / 100) * 100;
            } else {
                finalDoseMg = Math.ceil(finalDoseMg / 100) * 100;
            }
            const pelletCount = Math.ceil(finalDoseMg / 100);

            return { preliminaryDoseMg, finalDoseMg, pelletCount, newExpectedDuration };
        }
        else {
            calculationBreakdown.push({
                step: TestosteroneDosageCalculationBreakdownStep.FINAL_DOSE,
                condition: "Final dose calculation",
                previousValue: adjustedDoseMg,
                multiplier: 1,
                adjustedValue: adjustedDoseMg,
                previousDurationDays: expectedDuration,
                adjustedDurationDays: expectedDuration,
                additionalDurationDays: 0,
            });

            const preliminaryDoseMg = Math.ceil(adjustedDoseMg / 200) * 200;
            let finalDoseMg = Math.min(preliminaryDoseMg, this.T200_Config.maxDoseMg);
            const remainder = finalDoseMg % 200;
            if (remainder < 100) {
                finalDoseMg = Math.floor(finalDoseMg / 200) * 200;
            } else {
                finalDoseMg = Math.ceil(finalDoseMg / 200) * 200;
            }
            const pelletCount = Math.ceil(finalDoseMg / 200);

            return { preliminaryDoseMg, finalDoseMg, pelletCount, newExpectedDuration: expectedDuration };
        }
    }

    private buildDosingResult(
        params: TestosteroneDosageParams,
        baseDoseMg: number,
        shbgMultiplier: number,
        bmiMultiplier: number,
        medicationMultiplier: number,
        geneticMultiplier: number,
        preliminaryDoseMg: number,
        finalDoseMg: number,
        pelletCount: number,
        basePelletCount: number,
        baseDurationDays: number,
        expectedDuration: number,
        newExpectedDuration: number,
        durationWarning: boolean,
        durationAlert: string[],
        t200RecommendationTriggered: boolean,
        calculationBreakdown: TestosteroneDosageCalculationBreakdown[],
        psaVelocity: number | undefined,
        clinical: TestosteroneDosageClinicalParams,
    ): TestosteroneDosageResult {
        const isT100 = params.protocolSelection.pelletType === PelletType.T100;

        const dosingCalculation: TestosteroneDosageCalculation = {
            baseDoseMg,
            shbgMultiplier,
            bmiMultiplier,
            medicationMultiplier,
            geneticMultiplier,
            preliminaryDoseMg,
            finalDoseMg,
            pelletCount,
            basePelletCount,
            calculationBreakdown,
            ...isT100 ? {
                t100Multiplier: this.T100_Config.t100Multiplier,
                doseAfterT100Factor: finalDoseMg
            } : {}
        };

        const supplements: Supplement[] = [...this.T100_Config.coreSupplements];

        const clinicalRecommendations: TestosteroneDosageClinicalRecommendation = {
            supplements,
            monitoringSchedules: [],
            expectedDurationDays: newExpectedDuration,
            alerts: calculationBreakdown.map(step => step.alerts || []).flat().filter(Boolean) as string[],
            warnings: calculationBreakdown.map(step => [...step.warnings || [], ...step.cautions || []]).flat().filter(Boolean) as string[],
            criticalAlerts: calculationBreakdown.map(step => step.criticalAlerts || []).flat().filter(Boolean) as string[],
            suggestions: calculationBreakdown.map(step => [...step.suggestions || [], ...step.considerations || [], ...step.strongRecommendations || []]).flat().filter(Boolean) as string[],
            recommendations: calculationBreakdown.map(step => step.recommendations || []).flat().filter(Boolean) as string[],
        };

        const insertionDate = params.clinical.insertionDate || null;

        const followUpSchedule: TestosteroneDosageFollowUpSchedule = {
            peakLabsDate: insertionDate ? moment(insertionDate).add(this.T100_Config.peakLabsDays, 'days').toDate() : undefined,
            troughLabsDate: insertionDate ? moment(insertionDate).add(this.T100_Config.troughAssessmentDays, 'days').toDate() : undefined,
            symptomCheckDate: insertionDate ? moment(insertionDate).add(this.T100_Config.symptomCheckDays, 'days').toDate() : undefined,
            psaCheckDate: insertionDate ? moment(insertionDate).add(this.T100_Config.psaCheckDays, 'days').toDate() : undefined,
            nextInsertionEstimatedDate: insertionDate ? moment(insertionDate).add(expectedDuration, 'days').toDate() : undefined,
        };

        const prostateMonitoring: TestosteroneDosageProstateMonitoring = {
            baselinePSA: clinical.currentPSA,
            psaThroldAlert: psaVelocity && psaVelocity > 0.75 ? true : false,
            psaVelocity: psaVelocity ? Number(psaVelocity.toFixed(2)) : undefined,
            psaMonitoringFrequency: "Monthly",
            urologicalReferralNeeded: psaVelocity && psaVelocity > 0.75 ? true : false,
        };

        const { estimatedT100Duration, protocol, estimatedT200Duration, t100Note } = this.recommendPelletProtocolForMale({
            lifeStyleFactors: params.lifeStyleFactors,
            medications: params.medications,
            geneticData: params.geneticData,
            protocolSelection: params.protocolSelection,
        });


        let protocolComparison: TestosteroneDosageProtocolComparison | undefined;
        let durationPrediction: TestosteroneDosageDurationPrediction | undefined;
        if (isT100) {
            const t200PelletCount = this.calculateT200PelletCountEstimate(params, baseDoseMg, shbgMultiplier, bmiMultiplier, medicationMultiplier, geneticMultiplier);
            protocolComparison = {
                t100DurationEstimatedDays: estimatedT100Duration,
                t200DurationEstimatedDays: estimatedT200Duration,
                t100PelletCount: pelletCount,
                t200PelletCount: t200PelletCount,
                recommendSwitchtoT200: protocol === PelletType.T200,
                switchRationale: t100Note,
            };

            let medicationAdjustmentDays = 0;
            let geneticAdjustmentDays = 0;

            calculationBreakdown.forEach(step => {
                if (step.step === TestosteroneDosageCalculationBreakdownStep.MEDICATION_MODIFIER) {
                    medicationAdjustmentDays += step.additionalDurationDays;
                }
                if (step.step === TestosteroneDosageCalculationBreakdownStep.GENETIC_MODIFIER) {
                    geneticAdjustmentDays += step.additionalDurationDays;
                }
            });

            durationPrediction = {
                baseDurationDays,
                medicationAdjustmentDays,
                geneticAdjustmentDays,
                finalExpectedDurationDays: expectedDuration,
                durationWarning,
                durationAlert: durationAlert.join(", "),
                t200RecommendationTriggered,
            };
        }


        return {
            dosingCalculation,
            clinicalRecommendations,
            followUpSchedule,
            prostateMonitoring,
            protocolComparison,
            durationPrediction,
        };
    }

    public calculateT100Dosage(params: TestosteroneDosageParams): TestosteroneDosageResult {
        const { patientDemographics, clinical, lifeStyleFactors, medications, geneticData, tierSelection } = params;

        const calculationBreakdown: TestosteroneDosageCalculationBreakdown[] = [];
        const bmi = this.calculateBMI(patientDemographics.weight, patientDemographics.height);

        const { baseDoseMg, baseDurationDays } = this.calculateBaseT100Dose(patientDemographics.weight, tierSelection.selectedTier, calculationBreakdown);
        let expectedDuration = baseDurationDays;

        let durationWarning = false;
        const durationAlert: string[] = [];
        let t200RecommendationTriggered = false;

        let shbgMultiplier = 1;
        let adjustedDoseMg = baseDoseMg;

        const shbgResult = this.applySHBGModifier(clinical.shbgLevel, adjustedDoseMg, expectedDuration, calculationBreakdown, false);
        shbgMultiplier = shbgResult.multiplier;
        adjustedDoseMg = shbgResult.adjustedDoseMg;

        const bmiResult = this.applyBMIModifier(bmi, adjustedDoseMg, expectedDuration, calculationBreakdown, false);
        const bmiMultiplier = bmiResult.multiplier;
        adjustedDoseMg = bmiResult.adjustedDoseMg;

        const medicationResult = this.applyMedicationModifiers(
            medications,
            lifeStyleFactors,
            adjustedDoseMg,
            expectedDuration,
            calculationBreakdown,
            durationAlert,
            false
        );
        const medicationMultiplier = medicationResult.multiplier;
        adjustedDoseMg = medicationResult.adjustedDoseMg;
        expectedDuration = medicationResult.expectedDuration;
        durationWarning = medicationResult.durationWarning;
        t200RecommendationTriggered = medicationResult.t200RecommendationTriggered;

        const geneticResult = this.applyGeneticModifiers(
            geneticData,
            adjustedDoseMg,
            expectedDuration,
            calculationBreakdown,
            durationAlert,
            false
        );
        const geneticMultiplier = geneticResult.multiplier;
        adjustedDoseMg = geneticResult.adjustedDoseMg;
        expectedDuration = geneticResult.expectedDuration;
        if (geneticResult.durationWarning) durationWarning = true;
        if (geneticResult.t200RecommendationTriggered) t200RecommendationTriggered = true;

        this.applyVitaminDAndVDRModifiers(clinical, geneticData, adjustedDoseMg, expectedDuration, geneticMultiplier, calculationBreakdown, false);
        this.applyEstradiolModifiers(clinical, bmi, adjustedDoseMg, expectedDuration, calculationBreakdown, false);
        const psaVelocity = this.applyPSAAndProstateModifiers(patientDemographics, clinical, adjustedDoseMg, expectedDuration, calculationBreakdown);

        const { preliminaryDoseMg, finalDoseMg, pelletCount, newExpectedDuration } = this.calculateFinalDose(adjustedDoseMg, expectedDuration, calculationBreakdown, false);

        const finalBaseDose = baseDoseMg % 100 < 50 ? Math.floor(baseDoseMg / 100) * 100 : Math.ceil(baseDoseMg / 100) * 100;
        const basePelletCount = Math.ceil(finalBaseDose / 100);
        return this.buildDosingResult(
            params,
            finalBaseDose,
            shbgMultiplier,
            bmiMultiplier,
            medicationMultiplier,
            geneticMultiplier,
            preliminaryDoseMg,
            finalDoseMg,
            pelletCount,
            basePelletCount,
            baseDurationDays,
            expectedDuration,
            newExpectedDuration,
            durationWarning,
            durationAlert,
            t200RecommendationTriggered,
            calculationBreakdown,
            psaVelocity,
            clinical
        );
    }

    public calculateT200Dosage(params: TestosteroneDosageParams): TestosteroneDosageResult {
        const { patientDemographics, clinical, lifeStyleFactors, medications, geneticData, tierSelection } = params;

        const calculationBreakdown: TestosteroneDosageCalculationBreakdown[] = [];
        const bmi = this.calculateBMI(patientDemographics.weight, patientDemographics.height);

        const { baseDoseMg, baseDurationDays } = this.calculateBaseT200Dose(patientDemographics.weight, tierSelection.selectedTier, calculationBreakdown);
        let expectedDuration = baseDurationDays;

        let shbgMultiplier = 1;
        let adjustedDoseMg = baseDoseMg;

        const shbgResult = this.applySHBGModifier(clinical.shbgLevel, adjustedDoseMg, expectedDuration, calculationBreakdown, true);
        shbgMultiplier = shbgResult.multiplier;
        adjustedDoseMg = shbgResult.adjustedDoseMg;

        const bmiResult = this.applyBMIModifier(bmi, adjustedDoseMg, expectedDuration, calculationBreakdown, true);
        const bmiMultiplier = bmiResult.multiplier;
        adjustedDoseMg = bmiResult.adjustedDoseMg;

        const medicationResult = this.applyMedicationModifiers(
            medications,
            lifeStyleFactors,
            adjustedDoseMg,
            expectedDuration,
            calculationBreakdown,
            [],
            true
        );
        const medicationMultiplier = medicationResult.multiplier;
        adjustedDoseMg = medicationResult.adjustedDoseMg;
        expectedDuration = medicationResult.expectedDuration;

        const geneticResult = this.applyGeneticModifiers(
            geneticData,
            adjustedDoseMg,
            expectedDuration,
            calculationBreakdown,
            [],
            true
        );
        const geneticMultiplier = geneticResult.multiplier;
        adjustedDoseMg = geneticResult.adjustedDoseMg;
        expectedDuration = geneticResult.expectedDuration;

        this.applyVitaminDAndVDRModifiers(clinical, geneticData, adjustedDoseMg, expectedDuration, geneticMultiplier, calculationBreakdown, true);
        this.applyEstradiolModifiers(clinical, bmi, adjustedDoseMg, expectedDuration, calculationBreakdown, true);

        const { preliminaryDoseMg, finalDoseMg, pelletCount, newExpectedDuration } = this.calculateFinalDose(adjustedDoseMg, expectedDuration, calculationBreakdown, true);

        const finalBaseDose = baseDoseMg % 100 < 50 ? Math.floor(baseDoseMg / 100) * 100 : Math.ceil(baseDoseMg / 100) * 100;
        const basePelletCount = Math.ceil(finalBaseDose / 100);
        return this.buildDosingResult(
            params,
            finalBaseDose,
            shbgMultiplier,
            bmiMultiplier,
            medicationMultiplier,
            geneticMultiplier,
            preliminaryDoseMg,
            finalDoseMg,
            pelletCount,
            basePelletCount,
            baseDurationDays,
            expectedDuration,
            newExpectedDuration,
            false,
            [],
            false,
            calculationBreakdown,
            0,
            clinical
        );
    }

    public calculateEstradiolDosage() { }

    public recommendPelletProtocolForMale(params: RecommendPelletProtocolForMaleParams): RecommendPelletProtocolForMaleResult {
        const { lifeStyleFactors, medications, geneticData, protocolSelection } = params;

        let hasT100Indication = false;

        let fastClearanceCount = 0;

        const factors = [];


        if (geneticData.cyp3a4Status && geneticData.cyp3a4Status === Cyp3a4Status.FAST) {
            fastClearanceCount++;
            factors.push("CYP3A4 fast metabolizer");
        }

        if (geneticData.ugt2b17Status && geneticData.ugt2b17Status === Ugt2b17Status.FAST) {
            fastClearanceCount++;
            factors.push("UGT2B17 fast metabolizer");
        }

        if (medications.adhdStimulants) {
            fastClearanceCount++;
            factors.push("ADHD stimulants use");
        }

        if (lifeStyleFactors.smokingStatus && lifeStyleFactors.smokingStatus === SmokingStatus.CURRENT) {
            fastClearanceCount++;
            factors.push("Current smoker");
        }

        const validT100Indications: ValidT100Indications[] = [
            ValidT100Indications.FIRST_TIME_PELLET_TRIAL,
            ValidT100Indications.PREFER_SHORTER_DURATION,
            ValidT100Indications.ATHLETE_PRECISE_CONTROL,
            ValidT100Indications.FREQUENT_MONITORING_PREFERENCE,
            ValidT100Indications.SPECIFIC_METABOLIC_PROFILE,
        ];

        if (protocolSelection?.t100Indication && validT100Indications.includes(protocolSelection.t100Indication as ValidT100Indications)) {
            hasT100Indication = true;
        }

        if (fastClearanceCount >= 3) {
            return {
                protocol: PelletType.T200,
                strength: RecommendationStrength.STRONGLY_RECOMMENDED,
                rationale: `Multiple fast-clearance factors detected: ${factors.join(", ")}. T100 duration would be <10 weeks. T200 is recommended.`,
                estimatedT100Duration: 60,
                estimatedT200Duration: 90,
                allowT100Override: false,
            }
        }
        else if (fastClearanceCount === 2) {
            return {
                protocol: PelletType.T200,
                strength: RecommendationStrength.RECOMMENDED,
                rationale: `Two fast-clearance factors present: ${factors.join(", ")}. T100 duration would be 10 ~ 12 weeks. T200 is recommended.`,
                estimatedT100Duration: 75,
                estimatedT200Duration: 105,
                allowT100Override: false,
            }
        }
        else if (fastClearanceCount === 1 && !hasT100Indication) {
            return {
                protocol: PelletType.T200,
                strength: RecommendationStrength.RECOMMENDED,
                rationale: `One fast-clearance factor present: ${factors.join(", ")}. T200 is standard protocol for males.`,
                estimatedT100Duration: 90,
                estimatedT200Duration: 120,
                allowT100Override: true,
            }
        }
        else if (fastClearanceCount <= 1 && hasT100Indication) {
            return {
                protocol: PelletType.T100,
                strength: RecommendationStrength.ACCEPTABLE,
                rationale: `Valid T100 indication present: ${protocolSelection?.t100Indication}. `,
                estimatedT100Duration: 105,
                estimatedT200Duration: 150,
                allowT100Override: true,
                t200Alternative: "T200 remains the standard protocol and provides longer duration"
            }
        }
        else {
            return {
                protocol: PelletType.T200,
                strength: RecommendationStrength.STANDARD,
                rationale: "T200 is the standard protocol for male patients. Provides 5 -6 month duration with stable hormone levels.",
                estimatedT100Duration: 90,
                estimatedT200Duration: 120,
                allowT100Override: true,
                t100Note: "T100 acceptable if patient has specific preference, but requires valid clinical indication."
            }
        }
    }

    public validateT100MaleCalcuation(result: TestosteroneDosageResult, params: TestosteroneDosageParams): { valid: boolean, errors: string[], warnings: string[] } {
        const { patientDemographics, clinical, lifeStyleFactors, medications, geneticData, protocolSelection } = params;
        const { dosingCalculation, durationPrediction } = result;

        const errors: string[] = [];
        const warnings: string[] = [];

        if (patientDemographics.biologicalSex !== Gender.MALE) {
            errors.push("T100 Male protocol used for non-male patient.");
        }

        if (dosingCalculation?.t100Multiplier && dosingCalculation.t100Multiplier !== 0.6) {
            errors.push("T100 multiplier of 0.6 not applied to base dose.");
        }

        if (dosingCalculation?.finalDoseMg && dosingCalculation.finalDoseMg > 1700) {
            errors.push(`Dose ${dosingCalculation?.finalDoseMg}mg exceeds T100 maximum of 1700mg.`);
        }

        if (dosingCalculation.finalDoseMg % 100 !== 0) {
            errors.push(`Final dose ${dosingCalculation?.finalDoseMg}mg not rounded to nearest 100mg.`);
        }

        if (patientDemographics.age > 40 && !clinical.currentPSA) {
            errors.push("PSA level not provided for patient over 40 years of age.");
        }

        if (clinical.currentPSA && clinical.currentPSA > 4) {
            errors.push("PSA >4.0 is contraindication - urological clearance requeired")
        }

        if (clinical.hematocrit && clinical.hematocrit > 52) {
            errors.push("Hemtocrit >52% is contraindication to testosterone replacement therapy.")
        }

        if (durationPrediction?.finalExpectedDurationDays && durationPrediction.finalExpectedDurationDays < 60) {
            warnings.push("Final expected duration <2 months - T200 protocol strongly recommended.")
        }

        if (durationPrediction?.finalExpectedDurationDays && durationPrediction.finalExpectedDurationDays < 75) {
            warnings.push("Final expected duration <2.5 months - consider T200 protocol.")
        }

        const expectedPellets = dosingCalculation.finalDoseMg / 100;

        if (expectedPellets !== dosingCalculation.pelletCount) {
            errors.push(`Pellet count mismatch: ${dosingCalculation.pelletCount} vs expected ${expectedPellets}.`)
        }

        let fastClearanceCount = 0;

        if (geneticData.cyp3a4Status && geneticData.cyp3a4Status === Cyp3a4Status.FAST) {
            fastClearanceCount++;
        }

        if (geneticData.ugt2b17Status && (geneticData.ugt2b17Status === Ugt2b17Status.FAST || geneticData.ugt2b17Status === Ugt2b17Status.DELETION)) {
            fastClearanceCount++;
        }

        if (medications.adhdStimulants) {
            fastClearanceCount++;
        }

        if (lifeStyleFactors.smokingStatus && lifeStyleFactors.smokingStatus === SmokingStatus.CURRENT) {
            fastClearanceCount++;
        }

        if (fastClearanceCount >= 2) {
            warnings.push("Multiple fast-clearance factors present - T200 protocol recommended.")
        }

        const totalMultiplier = dosingCalculation.shbgMultiplier * dosingCalculation.bmiMultiplier * dosingCalculation.medicationMultiplier * dosingCalculation.geneticMultiplier;

        if (totalMultiplier > 1.5) {
            warnings.push(`Very high total multiplier (${totalMultiplier.toFixed(2)}) - verify calculations.`)
        }

        if (!protocolSelection?.t100Indication) {
            warnings.push("T100 selected without documented clinical indication. T200 is standard for males.")
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        }
    }
}

export const dosingHelper = new DosingHelper();
export default dosingHelper;
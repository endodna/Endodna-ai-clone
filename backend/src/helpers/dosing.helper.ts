import { Gender } from "@prisma/client";
import moment from "moment";
import {
    TestosteroneDosageConfig,
    DosageTier,
    TestosteroneDosageParams,
    DosageCalculationBreakdown,
    DosageCalculationBreakdownStep,
    DosageClinicalParams,
    TestosteroneDosageLifeStyleFactorsParams,
    TestosteroneDosageMedicationsParams,
    DosageGeneticDataParams,
    PatientDemographicsParams,
    SmokingStatus,
    Cyp19a1Status,
    Cyp3a4Status,
    Ugt2b17Status,
    Srd5a2Status,
    VdrStatus,
    AntioxidantSnpsStatus,
    PelletType,
    TestosteroneDosageResult,
    DosageCalculation,
    TestosteroneDosageClinicalRecommendation,
    Supplement,
    MonitoringSchedule,
    TestosteroneDosageFollowUpSchedule,
    TestosteroneDosageProstateMonitoring,
    TestosteroneDosageProtocolComparison,
    TestosteroneDosageDurationPrediction,
    RecommendPelletProtocolForMaleParams,
    RecommendPelletProtocolForMaleResult,
    RecommendationStrength,
    ValidT100Indications,
    EstradiolDosageParams,
    EstradiolDosageResult,
    EstradiolDosageConfig,
} from "../types";

class BaseDosingHelper {
    public calculateBMI(weight: number, height: number): number {
        height = height / 100;
        return parseFloat((weight / (height * height)).toFixed(2));
    }
}

class TestosteroneDosingHelper extends BaseDosingHelper {
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
                dose: "5000",
                unit: "IU",
                frequency: "Daily",
                purpose: "Optimize receptor function",
                timing: "Start pre-treatment if <30ng/mL",
                isCore: true,
            },
            {
                name: "Vitamin K2 (MK-7)",
                dose: "100 - 200",
                unit: "mcg",
                frequency: "Daily",
                purpose: "Calcium metabolism, cardiovascular",
                timing: "Pair with Vitamin D",
                isCore: true,
            },
            {
                name: "DIM",
                dose: "200 - 300",
                unit: "mg",
                frequency: "Daily",
                purpose: "Estrogen metabolism support",
                timing: "Start with pellet insertion",
                isCore: true,
            },
        ]
    }

    private T200_Config: TestosteroneDosageConfig = {
        maxDoseMg: 2800,
        maxPelletsCount: 14,
        t100Multiplier: 1,
        expectedDurationDays: 150,
        peakLabsDays: 42,
        troughAssessmentDays: 150,
        symptomCheckDays: 90,
        psaCheckDays: 42,
        coreSupplements: [
            {
                name: "Vitamin D3",
                dose: "5000",
                unit: "IU",
                frequency: "Daily",
                purpose: "Optimize receptor function",
                timing: "Start pre-treatment if <30ng/mL",
                isCore: true,
            },
            {
                name: "Vitamin K2 (MK-7)",
                dose: "100 - 200",
                unit: "mcg",
                frequency: "Daily",
                purpose: "Calcium metabolism, cardiovascular",
                timing: "Pair with Vitamin D",
                isCore: true,
            },
            {
                name: "DIM",
                dose: "200 - 300",
                unit: "mg",
                frequency: "Daily",
                purpose: "Estrogen metabolism support",
                timing: "Start with pellet insertion",
                isCore: true,
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

    private calculateT200PelletCountEstimate(
        params: TestosteroneDosageParams,
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
        calculationBreakdown: DosageCalculationBreakdown[]
    ): { baseDoseMg: number; baseDurationDays: number } {
        const baseDoseMg = weight * this.t100DosageTiersMapping[tier] * this.T100_Config.t100Multiplier!;
        const baseDurationDays = this.T100_Config.expectedDurationDays;

        calculationBreakdown.push({
            step: DosageCalculationBreakdownStep.BASE_DOSE,
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
        calculationBreakdown: DosageCalculationBreakdown[]
    ): { baseDoseMg: number; baseDurationDays: number } {
        const baseDoseMg = weight * this.t200DosageTiersMapping[tier];
        const baseDurationDays = this.T200_Config.expectedDurationDays;

        calculationBreakdown.push({
            step: DosageCalculationBreakdownStep.BASE_DOSE,
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
        calculationBreakdown: DosageCalculationBreakdown[],
        isT200: boolean
    ): { multiplier: number; adjustedDoseMg: number } {
        let shbgMultiplier = 1;

        if (shbgLevel && shbgLevel > 50) {
            shbgMultiplier = 1.1;
            const dose = adjustedDoseMg * shbgMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.SHBG_MODIFIER,
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
                step: DosageCalculationBreakdownStep.SHBG_MODIFIER,
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
                step: DosageCalculationBreakdownStep.SHBG_MODIFIER,
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
        calculationBreakdown: DosageCalculationBreakdown[],
        isT200: boolean
    ): { multiplier: number; adjustedDoseMg: number } {
        let bmiMultiplier = 1;

        if (bmi >= 30 && bmi < 35) {
            bmiMultiplier = 1.075;
            const dose = adjustedDoseMg * bmiMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
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
                step: DosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
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
        calculationBreakdown: DosageCalculationBreakdown[],
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
                step: DosageCalculationBreakdownStep.MEDICATION_MODIFIER,
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
                step: DosageCalculationBreakdownStep.MEDICATION_MODIFIER,
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
                step: DosageCalculationBreakdownStep.MEDICATION_MODIFIER,
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
                step: DosageCalculationBreakdownStep.MEDICATION_MODIFIER,
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
        geneticData: DosageGeneticDataParams,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: DosageCalculationBreakdown[],
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
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
        clinical: DosageClinicalParams,
        geneticData: DosageGeneticDataParams,
        adjustedDoseMg: number,
        expectedDuration: number,
        geneticMultiplier: number,
        calculationBreakdown: DosageCalculationBreakdown[],
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
                step: DosageCalculationBreakdownStep.VITAMIN_D_LEVEL_VDR_CONSIDERATIONS_MODIFIER,
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
                step: DosageCalculationBreakdownStep.VITAMIN_D_LEVEL_VDR_CONSIDERATIONS_MODIFIER,
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
        clinical: DosageClinicalParams,
        bmi: number,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: DosageCalculationBreakdown[],
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
                step: DosageCalculationBreakdownStep.ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER,
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
                step: DosageCalculationBreakdownStep.ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER,
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
                step: DosageCalculationBreakdownStep.ESTRADIOL_MONITORING_MANAGEMENT_MODIFIER,
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
        patientDemographics: PatientDemographicsParams,
        clinical: DosageClinicalParams,
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: DosageCalculationBreakdown[],
    ): number | undefined {
        if (patientDemographics.age >= 40 && !clinical.currentPSA) {
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
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
                step: DosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
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
                step: DosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
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
                step: DosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
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
                step: DosageCalculationBreakdownStep.PSA_PROSTATE_MONITORING_MODIFIER,
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

    private getMonitoringSchedule(
        clinical: DosageClinicalParams,
        isT200: boolean
    ): MonitoringSchedule[] {
        const monitoringSchedule: MonitoringSchedule[] = [];

        const insertionDate = clinical.insertionDate || null;

        if (!isT200) {
            const peakLabsDate = insertionDate ? moment(insertionDate).add(this.T100_Config.peakLabsDays, 'days').toDate() : undefined
            const symptomCheckDate = insertionDate ? moment(insertionDate).add(this.T100_Config.symptomCheckDays, 'days').toDate() : undefined

            monitoringSchedule.push(...[
                {
                    timepoint: "Baseline (pre-insertion)",
                    testsRequired: "Total T, Free T, SHBG, Estradiol, CBC, CMP, PSA",
                    purpose: "Establish baseline, rule out contraindications",
                    notes: "PSA mandatory for males > 40"
                },
                {
                    timepoint: "6 weeks (peak)",
                    idealDate: peakLabsDate,
                    testsRequired: "Total T, Free T, Estradiol, Hematocrit",
                    purpose: "Assess peak levels, detect aromatization",
                    notes: "Peak occurs earlier than T200"
                },
                {
                    timepoint: "10 - 12 weeks (mid-point)",
                    idealDate: symptomCheckDate,
                    testsRequired: "Total T, Free T, Estradiol, PSA,CBC",
                    purpose: "Determin if through is approaching",
                    notes: "Critical for T100 due to shorter duration"
                },
                {
                    timepoint: "As needed",
                    testsRequired: "Based on symptoms",
                    purpose: "Early trough detection",
                    notes: "T100 patients may need labs earlier if symptoms return"
                },
            ])
        }
        else {
            const peakLabsDate = insertionDate ? moment(insertionDate).add(this.T200_Config.peakLabsDays, 'days').toDate() : undefined
            const troughLabsDate = insertionDate ? moment(insertionDate).add(this.T200_Config.troughAssessmentDays, 'days').toDate() : undefined
            const symptomCheckDate = insertionDate ? moment(insertionDate).add(this.T200_Config.symptomCheckDays, 'days').toDate() : undefined

            monitoringSchedule.push(...[
                {
                    timepoint: "Baseline pre-insertion",
                    testsRequired: "Total T, Free T, SHBG, Estradiol, CBC, CMP, PSA (males > 40)",
                    purpose: "Establish baseline, identify risk factors"
                },
                {
                    timepoint: "4 - 6 weeks (peak)",
                    idealDate: peakLabsDate,
                    testsRequired: "Total T, Free T, Estradiol, Hematocrit",
                    purpose: "Assess peak levels, detect excessive aromatization"
                },
                {
                    timepoint: "12 - 14 weeks (mid-point)",
                    idealDate: symptomCheckDate,
                    testsRequired: "Total T, Free T, Estradiol, CBC",
                    purpose: "Monitor maintenance level"
                },
                {
                    timepoint: "20 - 30 weeks (trough)",
                    idealDate: troughLabsDate,
                    testsRequired: "Total T, Free T, Estradiol, CBC, CMP",
                    purpose: "Determin re-pellet timing, assess response"
                },
            ])
        }


        return monitoringSchedule;
    }

    private getConditionalSupplements(
        patientDemographics: PatientDemographicsParams,
        clinical: DosageClinicalParams,
        geneticData: DosageGeneticDataParams,
        isT200: boolean
    ): Supplement[] {
        const bmi = this.calculateBMI(patientDemographics.weight, patientDemographics.height);

        const supplements: Supplement[] = [
            ...(!isT200 ? this.T100_Config.coreSupplements : this.T200_Config.coreSupplements)
        ];

        if (!isT200) {
            if (bmi >= 35) {
                supplements.push({
                    name: "Anastrozole + DIM",
                    dose: "0.5mg 2x/week + 300mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "Aromatase inhibition",
                })
            }
            else if (bmi >= 30) {
                supplements.push({
                    name: "DIM",
                    dose: "300",
                    unit: "mg",
                    frequency: "Daily",
                    purpose: "Enhanced estrogen metabolism"
                })
            }

            if (geneticData.cyp19a1Status && geneticData.cyp19a1Status === Cyp19a1Status.HIGH_EXPRESSION) {
                supplements.push({
                    name: "Anastrozole or DIM",
                    dose: "0.5mg 2x/week OR 300mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "Prevent excessive E2"
                })
            }

            if (geneticData.srd5a2Status && geneticData.srd5a2Status === Srd5a2Status.HIGH) {
                supplements.push({
                    name: "Zinc + Saw Palmetto + DIM",
                    dose: "30mg + 320mg + 300mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "DHT management"
                })
            }

            if (geneticData.antioxidantSnps && geneticData.antioxidantSnps === AntioxidantSnpsStatus.POOR_FUNCTION) {
                supplements.push({
                    name: "NAC + Zinc",
                    dose: "600mg + 30mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "Oxidative stress protection"
                })
            }
            if (clinical.postInsertionEstradiol && clinical.postInsertionEstradiol > 60) {
                supplements.push({
                    name: "Anastrozole",
                    dose: "0.5mg",
                    unit: "mg",
                    frequency: "2x/week",
                    purpose: "Active E2 reduction"
                })
            }
        }
        else {
            if (bmi >= 35) {
                supplements.push({
                    name: "Anastrozole + DIM",
                    dose: "0.5mg 2x/week + 300mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "Aromatase inhibition"
                })
            }
            else if (bmi >= 30) {
                supplements.push({
                    name: "DIM",
                    dose: "300",
                    unit: "mg",
                    frequency: "Daily",
                    purpose: "Enhanced estrogen metabolism"
                })
            }

            if (geneticData.cyp19a1Status && geneticData.cyp19a1Status === Cyp19a1Status.HIGH_EXPRESSION) {
                supplements.push({
                    name: "Anastrozole or DIM",
                    dose: "0.5mg 2x/week OR 300mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "Prevent excessive E2"
                })
            }

            if (geneticData.srd5a2Status && geneticData.srd5a2Status === Srd5a2Status.HIGH) {
                supplements.push({
                    name: "Zinc + Saw Palmetto + DIM",
                    dose: "30mg + 320mg + 300mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "DHT management"
                })
            }

            if (geneticData.antioxidantSnps && geneticData.antioxidantSnps === AntioxidantSnpsStatus.POOR_FUNCTION) {
                supplements.push({
                    name: "NAC + Zinc",
                    dose: "600mg + 30mg daily",
                    unit: "",
                    frequency: "",
                    purpose: "Oxidative stress protection"
                })
            }
            if (clinical.postInsertionEstradiol && clinical.postInsertionEstradiol > 60) {
                supplements.push({
                    name: "Anastrozole",
                    dose: "0.5mg",
                    unit: "mg",
                    frequency: "2x/week",
                    purpose: "Active E2 reduction"
                })
            }
        }

        return supplements;
    }

    private calculateFinalDose(
        adjustedDoseMg: number,
        expectedDuration: number,
        calculationBreakdown: DosageCalculationBreakdown[],
        isT200: boolean,
        isFemale: boolean
    ): { preliminaryDoseMg: number; finalDoseMg: number; pelletCount: number; newExpectedDuration: number } {
        if (!isT200) {
            const newExpectedDuration = Math.max(expectedDuration, 60);
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.FINAL_DOSE,
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

            let preliminaryDoseMg: number;
            let finalDoseMg: number;
            let pelletCount: number;

            if (isFemale) {
                preliminaryDoseMg = Math.round(adjustedDoseMg / 12.5) * 12.5;
                finalDoseMg = Math.min(preliminaryDoseMg, this.T100_Config.maxDoseMg);
                pelletCount = Math.ceil(finalDoseMg / 100);
            } else {
                preliminaryDoseMg = Math.ceil(adjustedDoseMg / 100) * 100;
                finalDoseMg = Math.min(preliminaryDoseMg, this.T100_Config.maxDoseMg);
                const remainder = finalDoseMg % 100;
                if (remainder < 50) {
                    finalDoseMg = Math.floor(finalDoseMg / 100) * 100;
                } else {
                    finalDoseMg = Math.ceil(finalDoseMg / 100) * 100;
                }
                pelletCount = Math.ceil(finalDoseMg / 100);
            }

            return { preliminaryDoseMg, finalDoseMg, pelletCount, newExpectedDuration };
        }
        else {
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.FINAL_DOSE,
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
        calculationBreakdown: DosageCalculationBreakdown[],
        psaVelocity: number | undefined,
        clinical: DosageClinicalParams,
        monitoringSchedules: MonitoringSchedule[],
        supplements: Supplement[]
    ): TestosteroneDosageResult {
        const isT100 = params.protocolSelection.pelletType === PelletType.T100;

        const dosingCalculation: DosageCalculation = {
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

        const clinicalRecommendations: TestosteroneDosageClinicalRecommendation = {
            supplements,
            monitoringSchedules,
            expectedDurationDays: newExpectedDuration,
            alerts: calculationBreakdown.map(step => step.alerts || []).flat().filter(Boolean) as string[],
            warnings: calculationBreakdown.map(step => [...step.warnings || [], ...step.cautions || []]).flat().filter(Boolean) as string[],
            criticalAlerts: calculationBreakdown.map(step => [...step.criticalAlerts || [], ...step.contraindications || []]).flat().filter(Boolean) as string[],
            suggestions: calculationBreakdown.map(step => [...step.suggestions || [], ...step.considerations || [], ...step.notes || []]).flat().filter(Boolean) as string[],
            recommendations: calculationBreakdown.map(step => [...step.recommendations || [], ...step.strongRecommendations || [], ...step.prerequisites || []]).flat().filter(Boolean) as string[],
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
            const t200PelletCount = this.calculateT200PelletCountEstimate(params, shbgMultiplier, bmiMultiplier, medicationMultiplier, geneticMultiplier);
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
                if (step.step === DosageCalculationBreakdownStep.MEDICATION_MODIFIER) {
                    medicationAdjustmentDays += step.additionalDurationDays;
                }
                if (step.step === DosageCalculationBreakdownStep.GENETIC_MODIFIER) {
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

        const calculationBreakdown: DosageCalculationBreakdown[] = [];
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

        const { preliminaryDoseMg, finalDoseMg, pelletCount, newExpectedDuration } = this.calculateFinalDose(adjustedDoseMg, expectedDuration, calculationBreakdown, false, patientDemographics.biologicalSex === Gender.FEMALE);

        const finalBaseDose = baseDoseMg % 100 < 50 ? Math.floor(baseDoseMg / 100) * 100 : Math.ceil(baseDoseMg / 100) * 100;
        const basePelletCount = Math.ceil(finalBaseDose / 100);

        const monitoringSchedules = this.getMonitoringSchedule(clinical, false);
        const supplements = this.getConditionalSupplements(patientDemographics, clinical, geneticData, false);

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
            clinical,
            monitoringSchedules,
            supplements
        );
    }

    public calculateT200Dosage(params: TestosteroneDosageParams): TestosteroneDosageResult {
        const { patientDemographics, clinical, lifeStyleFactors, medications, geneticData, tierSelection } = params;

        const calculationBreakdown: DosageCalculationBreakdown[] = [];
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

        const { preliminaryDoseMg, finalDoseMg, pelletCount, newExpectedDuration } = this.calculateFinalDose(adjustedDoseMg, expectedDuration, calculationBreakdown, true, patientDemographics.biologicalSex === Gender.FEMALE);

        const finalBaseDose = baseDoseMg % 100 < 50 ? Math.floor(baseDoseMg / 100) * 100 : Math.ceil(baseDoseMg / 100) * 100;
        const basePelletCount = Math.ceil(finalBaseDose / 100);

        const monitoringSchedules = this.getMonitoringSchedule(clinical, true);
        const supplements = this.getConditionalSupplements(patientDemographics, clinical, geneticData, true);

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
            clinical,
            monitoringSchedules,
            supplements
        );
    }

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

class EstradiolDosingHelper extends BaseDosingHelper {
    private Estradiol_Config: EstradiolDosageConfig = {
        incrementMg: 6.25,
    }

    private estradiolDosageTiersMapping: Record<DosageTier, number> = {
        [DosageTier.CONSERVATIVE]: 0.1,
        [DosageTier.STANDARD]: 0.15,
        [DosageTier.AGGRESSIVE]: 0.20,
        [DosageTier.HIGH_PERFORMANCE]: 0.25,
    }

    public calculateEstradiolDosage(params: EstradiolDosageParams): EstradiolDosageResult {
        const { patientDemographics, clinical, tier, geneticData } = params;

        const bmi = this.calculateBMI(patientDemographics.weight, patientDemographics.height);
        const calculationBreakdown: DosageCalculationBreakdown[] = []
        const baseDoseMg = patientDemographics.weight * this.estradiolDosageTiersMapping[tier];

        calculationBreakdown.push({
            step: DosageCalculationBreakdownStep.BASE_DOSE,
            condition: "Base dose calculation",
            previousValue: 0,
            multiplier: 1,
            adjustedValue: baseDoseMg,
            previousDurationDays: 0,
            adjustedDurationDays: 0,
            additionalDurationDays: 0,
        });

        let adjustedDosage = baseDoseMg;

        let shbgMultiplier = 1;

        if (clinical.shbgLevel && clinical.shbgLevel < 20) {
            shbgMultiplier = 0.9
            const dose = adjustedDosage * shbgMultiplier;

            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.SHBG_MODIFIER,
                condition: "SHBG level is lower than 20",
                previousValue: adjustedDosage,
                multiplier: shbgMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["More free estradiol available, need less dose"]
            });
            adjustedDosage = dose;
        }
        else if (clinical.shbgLevel && clinical.shbgLevel >= 20 && clinical.shbgLevel < 80) {
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.SHBG_MODIFIER,
                condition: "SHBG level is greater than 20 but less than 80",
                previousValue: adjustedDosage,
                multiplier: shbgMultiplier,
                adjustedValue: adjustedDosage,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Standard bioavailability"]
            });
        }
        else if (clinical.shbgLevel && clinical.shbgLevel >= 80) {
            shbgMultiplier = 1.1;
            const dose = adjustedDosage * shbgMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.SHBG_MODIFIER,
                condition: "SHBG level is greater than 80",
                previousValue: adjustedDosage,
                multiplier: shbgMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["More binding, less free estradiol, need higher dose"]
            });
            adjustedDosage = dose;
        }

        let bmiMultiplier = 1;

        if (bmi >= 18.5 && bmi <= 24.9) {
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
                condition: "BMI is greater than 18.4 and less than 15",
                previousValue: adjustedDosage,
                multiplier: bmiMultiplier,
                adjustedValue: adjustedDosage,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Standard absorption"]
            });
        }
        else if (bmi >= 25 && bmi <= 29.9) {
            bmiMultiplier = 1.1
            const dose = adjustedDosage * bmiMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
                condition: "BMI is between 25 and 30",
                previousValue: adjustedDosage,
                multiplier: bmiMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Increased adipose tissue, slightly more needed"]
            });
            adjustedDosage = dose
        }
        else if (bmi >= 30 && bmi <= 34.9) {
            bmiMultiplier = 1.15
            const dose = adjustedDosage * bmiMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
                condition: "BMI is between 30 and 35",
                previousValue: adjustedDosage,
                multiplier: bmiMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Increased binding in adipose tissue"]
            });
            adjustedDosage = dose
        }
        else if (bmi >= 35) {
            bmiMultiplier = 1.2
            const dose = adjustedDosage * bmiMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.BMI_AROMATIZATION_MODIFIER,
                condition: "BMI is 35 or greater than 35",
                previousValue: adjustedDosage,
                multiplier: bmiMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Increased adipose tissue, slightly more needed"]
            });
            adjustedDosage = dose
        }

        let geneticMultiplier = 1;
        if (geneticData.cyp19a1Status && geneticData.cyp19a1Status === Cyp19a1Status.HIGH_EXPRESSION) {
            geneticMultiplier = 0.9
            const dose = adjustedDosage * geneticMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CY191A1 high activity variant present",
                previousValue: adjustedDosage,
                multiplier: geneticMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["More endogenous conversion, less exogenous needed"]
            });
            adjustedDosage = dose
        }
        if (geneticData.cyp19a1Status && geneticData.cyp19a1Status === Cyp19a1Status.NORMAL) {
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CY191A1 normal",
                previousValue: adjustedDosage,
                multiplier: geneticMultiplier,
                adjustedValue: adjustedDosage,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Standard dosing"]
            });
        }
        if (geneticData.cyp19a1Status && geneticData.cyp19a1Status === Cyp19a1Status.LOW_EXPRESSION) {
            geneticMultiplier = 1.1
            const dose = adjustedDosage * geneticMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.GENETIC_MODIFIER,
                condition: "CY191A1 low activity variant",
                previousValue: adjustedDosage,
                multiplier: geneticMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Less endogenous conversion, more exogenous needed"]
            });
            adjustedDosage = dose
        }

        let ageMultiplier = 1;
        if (patientDemographics.age >= 45 && patientDemographics.age <= 55) {
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.AGE_MODIFIER,
                condition: "Patient age is between 45 and 55",
                previousValue: adjustedDosage,
                multiplier: ageMultiplier,
                adjustedValue: adjustedDosage,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Standard perimenopausal/early menopause"]
            });
        }
        if (patientDemographics.age >= 56 && patientDemographics.age <= 65) {
            ageMultiplier = 1.05
            const dose = adjustedDosage * ageMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.AGE_MODIFIER,
                condition: "Patient age is between 56 and 65",
                previousValue: adjustedDosage,
                multiplier: ageMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["May need slightly more due to decreased absorption"]
            });
            adjustedDosage = dose
        }
        if (patientDemographics.age >= 66) {
            ageMultiplier = 1.1
            const dose = adjustedDosage * ageMultiplier;
            calculationBreakdown.push({
                step: DosageCalculationBreakdownStep.AGE_MODIFIER,
                condition: "Patient age is over 65",
                previousValue: adjustedDosage,
                multiplier: ageMultiplier,
                adjustedValue: dose,
                previousDurationDays: 0,
                adjustedDurationDays: 0,
                additionalDurationDays: 0,
                notes: ["Age-related metabolic change"]
            });
            adjustedDosage = dose
        }

        const monitoringSchedules: MonitoringSchedule[] = [
            {
                timepoint: "Pre-treatment",
                testsRequired: "Estradiol, FSH, SHBG",
                purpose: "Establish baseline, determine menopause status"
            },
            {
                timepoint: "6 weeks (Peak)",
                testsRequired: "Estradiol, FSH",
                purpose: "Measure peak levels, calculate metabolism rate"
            },
            {
                timepoint: "12 weeks (Through)",
                testsRequired: "Estradiol, FSH",
                purpose: "Measure through levels, determine re-pellet timing"
            }
        ]

        const baseDoseNormalized = Math.ceil(baseDoseMg / this.Estradiol_Config.incrementMg) * this.Estradiol_Config.incrementMg;
        const basePelletCount = baseDoseNormalized / this.Estradiol_Config.incrementMg

        const finalDoseMg = Math.ceil(adjustedDosage / this.Estradiol_Config.incrementMg) * this.Estradiol_Config.incrementMg;
        const pelletCount = finalDoseMg / this.Estradiol_Config.incrementMg

        return {
            dosingCalculation: {
                baseDoseMg,
                shbgMultiplier,
                bmiMultiplier,
                geneticMultiplier,
                ageMultiplier,
                medicationMultiplier: 1,
                preliminaryDoseMg: adjustedDosage,
                finalDoseMg,
                pelletCount,
                basePelletCount,
                calculationBreakdown,
                pelletConfiguration: `${pelletCount} x 6.25mg`,
                confidence: "high",
                alternativeDoses: []
            },
            clinicalRecommendations: {
                monitoringSchedules,
                supplements: [],
                expectedDurationDays: 0,
                alerts: [],
                warnings: [],
                criticalAlerts: [],
                suggestions: calculationBreakdown.map(step => [...step.suggestions || [], ...step.considerations || [], ...step.notes || []]).flat().filter(Boolean) as string[],
                recommendations: [],
            }
        }
    }
}

export const estradiolDosingHelper = new EstradiolDosingHelper();
export const testosteroneDosingHelper = new TestosteroneDosingHelper();

export default {
    testosteroneDosingHelper,
    estradiolDosingHelper,
}
import { describe, it, expect } from "@jest/globals";
import { testosteroneDosingHelper } from "../../src/helpers/dosing.helper";
import {
    TestosteroneDosageParams,
    DosageTier,
    PelletType,
    Cyp3a4Status,
    Ugt2b17Status,
} from "../../src/types";
import { Gender } from "@prisma/client";

describe("calculateT100Dosage", () => {
    const basePatientDemographics = {
        weight: 80,
        height: 1.75,
        age: 35,
        biologicalSex: Gender.MALE,
    };

    const baseParams: Omit<TestosteroneDosageParams, "tierSelection" | "protocolSelection"> = {
        patientDemographics: basePatientDemographics,
        clinical: {},
        lifeStyleFactors: {},
        medications: {},
        geneticData: {},
    };

    describe("Basic calculations for different tiers", () => {
        it("should calculate conservative tier correctly", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.CONSERVATIVE,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg).toBeGreaterThan(0);
            expect(result.dosingCalculation.finalDoseMg).toBeLessThanOrEqual(1700);
            expect(result.dosingCalculation.finalDoseMg % 100).toBe(0);
            expect(result.dosingCalculation.pelletCount).toBe(result.dosingCalculation.finalDoseMg / 100);
        });

        it("should calculate standard tier correctly", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "prefer_shorter_duration",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg).toBeGreaterThan(0);
            expect(result.dosingCalculation.finalDoseMg).toBeLessThanOrEqual(1700);
        });

        it("should calculate aggressive tier correctly", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.AGGRESSIVE,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "athlete_precise_control",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg).toBeGreaterThan(0);
            expect(result.dosingCalculation.finalDoseMg).toBeLessThanOrEqual(1700);
        });

        it("should calculate high_performance tier correctly", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.HIGH_PERFORMANCE,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "specific_metabolic_profile",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg).toBeGreaterThan(0);
            expect(result.dosingCalculation.finalDoseMg).toBeLessThanOrEqual(1700);
        });
    });

    describe("Validation errors", () => {
        it("should error for non-male patient", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                patientDemographics: {
                    ...basePatientDemographics,
                    biologicalSex: Gender.FEMALE,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("T100 Male protocol used for non-male patient.");
        });

        it("should error when PSA > 4.0", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                clinical: {
                    currentPSA: 4.5,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("PSA >4.0 is contraindication - urological clearance requeired");
        });

        it("should error when hematocrit > 52%", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                clinical: {
                    hematocrit: 55,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("Hemtocrit >52% is contraindication to testosterone replacement therapy.");
        });

        it("should error when patient over 40 without PSA", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                patientDemographics: {
                    ...basePatientDemographics,
                    age: 45,
                },
                clinical: {},
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("PSA level not provided for patient over 40 years of age.");
        });

        it("should not error when patient over 40 with PSA", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                patientDemographics: {
                    ...basePatientDemographics,
                    age: 45,
                },
                clinical: {
                    currentPSA: 2.5,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.errors).not.toContain("PSA level not provided for patient over 40 years of age.");
        });
    });

    describe("SHBG modifier", () => {
        it("should apply SHBG modifier for low SHBG", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                clinical: {
                    shbgLevel: 15, // Low SHBG
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            // Low SHBG doesn't change multiplier but adds alerts
            const shbgStep = result.dosingCalculation.calculationBreakdown.find(
                step => step.step === "shbg_modifier"
            );
            expect(shbgStep).toBeDefined();
            expect(shbgStep?.alerts).toContain("Low SHBG - Patient may be sensitive to standard doses.");
        });

        it("should apply SHBG modifier for high SHBG", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                clinical: {
                    shbgLevel: 80, // High SHBG
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.shbgMultiplier).not.toBe(1);
        });
    });

    describe("BMI modifier", () => {
        it("should apply BMI modifier for high BMI", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                patientDemographics: {
                    ...basePatientDemographics,
                    weight: 120, // High weight
                    height: 1.75,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.bmiMultiplier).not.toBe(1);
        });
    });

    describe("Medication modifiers", () => {
        it("should apply modifier for opioids", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                medications: {
                    opiods: true,
                    opiodsList: ["Oxycodone"],
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.medicationMultiplier).not.toBe(1);
        });

        it("should apply modifier for ADHD stimulants", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                medications: {
                    adhdStimulants: true,
                    adhdStimulantsList: ["Adderall"],
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.medicationMultiplier).not.toBe(1);
        });
    });

    describe("Genetic modifiers", () => {
        it("should apply modifier for fast CYP3A4", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                geneticData: {
                    cyp3a4Status: Cyp3a4Status.FAST,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.geneticMultiplier).not.toBe(1);
        });

        it("should apply modifier for UGT2B17 deletion", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                geneticData: {
                    ugt2b17Status: Ugt2b17Status.DELETION,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.geneticMultiplier).not.toBe(1);
        });
    });

    describe("Fast clearance factors", () => {
        it("should warn when multiple fast-clearance factors present", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                geneticData: {
                    cyp3a4Status: Cyp3a4Status.FAST,
                    ugt2b17Status: Ugt2b17Status.FAST,
                },
                medications: {
                    adhdStimulants: true,
                    adhdStimulantsList: ["Adderall"],
                },
                lifeStyleFactors: {
                    smokingStatus: "current" as any,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.warnings).toContain("Multiple fast-clearance factors present - T200 protocol recommended.");
        });
    });

    describe("Duration warnings", () => {
        it("should warn when duration < 60 days", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                medications: {
                    opiods: true,
                    opiodsList: ["Morphine"],
                    adhdStimulants: true,
                    adhdStimulantsList: ["Adderall", "Vyvanse"],
                },
                geneticData: {
                    cyp3a4Status: Cyp3a4Status.FAST,
                    ugt2b17Status: Ugt2b17Status.DELETION,
                },
                lifeStyleFactors: {
                    smokingStatus: "current" as any,
                },
                tierSelection: {
                    selectedTier: DosageTier.CONSERVATIVE,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            if (result.durationPrediction?.finalExpectedDurationDays && result.durationPrediction.finalExpectedDurationDays < 60) {
                expect(validation.warnings).toContain("Final expected duration <2 months - T200 protocol strongly recommended.");
            }
            expect(validation).toBeDefined();
        });

        it("should warn when duration < 75 days", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                medications: {
                    adhdStimulants: true,
                    adhdStimulantsList: ["Adderall"],
                },
                geneticData: {
                    cyp3a4Status: Cyp3a4Status.FAST,
                },
                tierSelection: {
                    selectedTier: DosageTier.CONSERVATIVE,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            if (result.durationPrediction?.finalExpectedDurationDays && result.durationPrediction.finalExpectedDurationDays < 75) {
                expect(validation.warnings).toContain("Final expected duration <2.5 months - consider T200 protocol.");
            }
            expect(validation).toBeDefined();
        });
    });

    describe("T100 indication warning", () => {
        it("should warn when T100 selected without indication", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.warnings).toContain("T100 selected without documented clinical indication. T200 is standard for males.");
        });

        it("should not warn when T100 indication is provided", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.warnings).not.toContain("T100 selected without documented clinical indication. T200 is standard for males.");
        });
    });

    describe("Dose calculations", () => {
        it("should round final dose to nearest 100mg", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg % 100).toBe(0);
        });

        it("should not exceed maximum dose of 1700mg", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                patientDemographics: {
                    ...basePatientDemographics,
                    weight: 200, // Very high weight
                },
                tierSelection: {
                    selectedTier: DosageTier.HIGH_PERFORMANCE,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg).toBeLessThanOrEqual(1700);
        });

        it("should match pellet count to final dose", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.pelletCount).toBe(result.dosingCalculation.finalDoseMg / 100);
        });
    });

    describe("T100 multiplier", () => {
        it("should apply T100 multiplier of 0.6", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            if (result.dosingCalculation.t100Multiplier !== undefined) {
                expect(result.dosingCalculation.t100Multiplier).toBe(0.6);
            }
        });
    });

    describe("Complex scenarios", () => {
        it("should handle patient with all modifiers", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                patientDemographics: {
                    ...basePatientDemographics,
                    age: 45,
                },
                clinical: {
                    shbgLevel: 20,
                    currentPSA: 2.5,
                    hematocrit: 48,
                    baselineEstradiol: 30,
                    vitaminDLevel: 25,
                },
                medications: {
                    opiods: true,
                    opiodsList: ["Oxycodone"],
                    adhdStimulants: true,
                    adhdStimulantsList: ["Adderall"],
                },
                geneticData: {
                    cyp3a4Status: Cyp3a4Status.FAST,
                    ugt2b17Status: Ugt2b17Status.INTERMEDIATE,
                },
                lifeStyleFactors: {
                    smokingStatus: "former" as any,
                    exerciseLevel: "moderate" as any,
                },
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg).toBeGreaterThan(0);
            expect(result.dosingCalculation.finalDoseMg).toBeLessThanOrEqual(1700);
            expect(result.dosingCalculation.finalDoseMg % 100).toBe(0);
            expect(result.dosingCalculation.pelletCount).toBe(result.dosingCalculation.finalDoseMg / 100);
        });

        it("should handle patient with minimal data", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                clinical: {},
                medications: {},
                geneticData: {},
                lifeStyleFactors: {},
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);
            const validation = testosteroneDosingHelper.validateT100MaleCalcuation(result, params);

            expect(validation.valid).toBe(true);
            expect(result.dosingCalculation.finalDoseMg).toBeGreaterThan(0);
            expect(result.dosingCalculation.finalDoseMg).toBeLessThanOrEqual(1700);
        });
    });

    describe("Response structure", () => {
        it("should return complete result structure", () => {
            const params: TestosteroneDosageParams = {
                ...baseParams,
                tierSelection: {
                    selectedTier: DosageTier.STANDARD,
                },
                protocolSelection: {
                    pelletType: PelletType.T100,
                    t100Indication: "first_time_pellet_trial",
                },
            };

            const result = testosteroneDosingHelper.calculateT100Dosage(params);

            expect(result).toHaveProperty("dosingCalculation");
            expect(result).toHaveProperty("clinicalRecommendations");
            expect(result).toHaveProperty("followUpSchedule");
            expect(result).toHaveProperty("prostateMonitoring");
            expect(result).toHaveProperty("protocolComparison");
            expect(result).toHaveProperty("durationPrediction");

            expect(result.dosingCalculation).toHaveProperty("baseDoseMg");
            expect(result.dosingCalculation).toHaveProperty("finalDoseMg");
            expect(result.dosingCalculation).toHaveProperty("pelletCount");
            expect(result.dosingCalculation).toHaveProperty("calculationBreakdown");

            expect(result.clinicalRecommendations).toHaveProperty("supplements");
            expect(result.clinicalRecommendations).toHaveProperty("monitoringSchedules");
            expect(result.clinicalRecommendations).toHaveProperty("expectedDurationDays");
        });
    });
});
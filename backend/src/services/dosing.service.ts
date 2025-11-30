import { estradiolDosingHelper, testosteroneDosingHelper } from "../helpers/dosing.helper";
import { PelletType, TestosteroneDosageParams, TestosteroneDosageResult, DosageTier, EstradiolDosageParams, EstradiolDosageResult } from "../types";

export type TestosteroneDosingSuggestionsResponse = Record<DosageTier, TestosteroneDosageResult>;
export type EstradiolDosingSuggestionsResponse = Record<DosageTier, EstradiolDosageResult>;

const tiers = [DosageTier.CONSERVATIVE, DosageTier.STANDARD, DosageTier.AGGRESSIVE, DosageTier.HIGH_PERFORMANCE];

export const getTestosteroneDosingSuggestions = (params: TestosteroneDosageParams): TestosteroneDosingSuggestionsResponse => {
    const results: Partial<TestosteroneDosingSuggestionsResponse> = {};
    if (params.protocolSelection.pelletType === PelletType.T100) {
        for (const tier of tiers) {
            results[tier] = testosteroneDosingHelper.calculateT100Dosage({
                ...params,
                tierSelection: {
                    selectedTier: tier,
                },
            });
        }
    }
    else {
        for (const tier of tiers) {
            results[tier] = testosteroneDosingHelper.calculateT200Dosage({
                ...params,
                tierSelection: {
                    selectedTier: tier,
                },
            });
        }
    }

    return results as TestosteroneDosingSuggestionsResponse;
}

export const getEstradiolDosingSuggestions = (params: EstradiolDosageParams): EstradiolDosingSuggestionsResponse => {
    const results: Partial<EstradiolDosingSuggestionsResponse> = {};
    for (const tier of tiers) {
        results[tier] = estradiolDosingHelper.calculateEstradiolDosage({
            ...params,
        });
    }
    return results as EstradiolDosingSuggestionsResponse;
}
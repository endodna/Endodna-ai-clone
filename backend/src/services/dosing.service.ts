import dosingHelper, { PelletType, TestosteroneDosageParams, TestosteroneDosageResult, DosageTier } from "../helpers/dosing.helper";

export type TestosteroneDosingSuggestionsResponse = Record<DosageTier, TestosteroneDosageResult>;

export const getTestosteroneDosingSuggestions = (params: TestosteroneDosageParams): TestosteroneDosingSuggestionsResponse => {
    const tiers = [DosageTier.CONSERVATIVE, DosageTier.STANDARD, DosageTier.AGGRESSIVE, DosageTier.HIGH_PERFORMANCE];

    const results: Partial<TestosteroneDosingSuggestionsResponse> = {};
    if (params.protocolSelection.pelletType === PelletType.T100) {
        for (const tier of tiers) {
            results[tier] = dosingHelper.calculateT100Dosage({
                ...params,
                tierSelection: {
                    selectedTier: tier,
                },
            });
        }
    }
    else {
        for (const tier of tiers) {
            results[tier] = dosingHelper.calculateT200Dosage({
                ...params,
                tierSelection: {
                    selectedTier: tier,
                },
            });
        }
    }

    return results as TestosteroneDosingSuggestionsResponse;
}
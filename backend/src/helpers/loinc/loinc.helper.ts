import { logger } from "../logger.helper";

export interface LOINCSearchParams {
    query: string;
    limit?: number;
    component_filter?: string;
    property_filter?: string;
    system_filter?: string;
    class_filter?: string;
    include_details?: boolean;
}

export interface LOINCCode {
    LOINC_NUM?: string;
    LONG_COMMON_NAME?: string;
    COMPONENT?: string;
    PROPERTY?: string;
    SYSTEM?: string;
    SCALE?: string;
    TIME_ASPCT?: string;
    CLASS?: string;
    METHOD?: string;
    [key: string]: any;
}

export interface LOINCSearchResult {
    query: string;
    count: number;
    results: LOINCCode[];
    status: string;
    message?: string;
    api_error?: string;
}

export interface LOINCDetailsResult {
    loinc_code: string;
    details: LOINCCode;
    answer_list?: any;
}

class LOINCHelper {
    private readonly baseUrl: string = "https://loinc.regenstrief.org/searchapi/";
    private readonly authToken: string = "c2FtdWVsX2VuZG9kbmE6U25zMiQzajZtRXl5Ml9G";


    private async makeRequest(
        endpoint: string,
        params: Record<string, any>,
        traceId?: string,
    ): Promise<any> {
        const url = new URL(endpoint, this.baseUrl);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });

        try {
            logger.debug("Calling LOINC API", {
                traceId,
                endpoint,
                url: url.toString(),
                params,
            });

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Basic ${this.authToken}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `LOINC API error: ${response.status} ${response.statusText}. ${errorText}`,
                );
            }

            const data = (await response.json()) as any;

            if (data.Results) {
                return {
                    ...data,
                    results: data.Results,
                };
            }

            if (Array.isArray(data)) {
                return {
                    results: data,
                };
            }

            return data;
        } catch (error) {
            logger.error("Error calling LOINC API", {
                traceId,
                endpoint,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    async searchLOINCCodes(
        params: LOINCSearchParams,
        traceId?: string,
    ): Promise<LOINCSearchResult> {
        try {
            const apiParams: Record<string, any> = {
                Query: params.query,
                Limit: params.limit || 10,
            };

            let result = await this.makeRequest("loincs", apiParams, traceId);

            if (!result.results || result.results.length === 0) {
                logger.debug("No results with capitalized params, trying lowercase", {
                    traceId,
                    query: params.query,
                });
                const lowercaseParams = {
                    query: params.query,
                    limit: params.limit || 10,
                };
                const lowercaseResult = await this.makeRequest("loincs", lowercaseParams, traceId);
                if (lowercaseResult.results && lowercaseResult.results.length > 0) {
                    result = lowercaseResult;
                }
            }

            let filteredResults = result.results || [];
            if (params.component_filter) {
                filteredResults = filteredResults.filter((code: LOINCCode) =>
                    code.COMPONENT?.toLowerCase().includes(params.component_filter!.toLowerCase()),
                );
            }
            if (params.property_filter) {
                filteredResults = filteredResults.filter((code: LOINCCode) =>
                    code.PROPERTY?.toLowerCase().includes(params.property_filter!.toLowerCase()),
                );
            }
            if (params.system_filter) {
                filteredResults = filteredResults.filter((code: LOINCCode) =>
                    code.SYSTEM?.toLowerCase().includes(params.system_filter!.toLowerCase()),
                );
            }
            if (params.class_filter) {
                filteredResults = filteredResults.filter((code: LOINCCode) =>
                    code.CLASS?.toLowerCase().includes(params.class_filter!.toLowerCase()),
                );
            }

            return {
                query: params.query,
                count: filteredResults.length,
                results: filteredResults,
                status: filteredResults.length > 0 ? "success" : "success_no_results",
            };
        } catch (error) {
            logger.error("Error searching LOINC codes", {
                traceId,
                query: params.query,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    async getLOINCDetails(
        loincCode: string,
        traceId?: string,
    ): Promise<LOINCDetailsResult | null> {
        try {
            const searchResult = await this.searchLOINCCodes(
                {
                    query: loincCode,
                    limit: 1,
                },
                traceId,
            );

            const matchingCode = searchResult.results.find(
                (code) => code.LOINC_NUM === loincCode,
            );

            if (!matchingCode) {
                logger.warn("LOINC code not found", {
                    traceId,
                    loincCode,
                });
                return null;
            }

            let answerList: any = null;
            try {
                const answerListResult = await this.makeRequest(
                    "answerlists",
                    { LoincNumber: loincCode },
                    traceId,
                );
                answerList = answerListResult;
            } catch (error) {
                logger.debug("Could not fetch answer list", {
                    traceId,
                    loincCode,
                    error: error instanceof Error ? error.message : String(error),
                });
            }

            return {
                loinc_code: loincCode,
                details: matchingCode,
                answer_list: answerList,
            };
        } catch (error) {
            logger.error("Error getting LOINC code details", {
                traceId,
                loincCode,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }

    async matchBiomarkerToLOINC(
        biomarkerName: string,
        unit?: string,
        traceId?: string,
    ): Promise<{ code: string; longName: string; component?: string } | null> {
        try {
            logger.debug("Matching biomarker to LOINC", {
                traceId,
                biomarkerName,
                unit,
                method: "LOINCHelper.matchBiomarkerToLOINC",
            });

            const searchResult = await this.searchLOINCCodes(
                {
                    query: biomarkerName,
                    limit: 10,
                    include_details: true,
                },
                traceId,
            );

            if (!searchResult.results || searchResult.results.length === 0) {
                logger.debug("No LOINC codes found for biomarker", {
                    traceId,
                    biomarkerName,
                });
                return null;
            }

            // Score matches based on relevance
            const scoredMatches = searchResult.results.map((code) => {
                let score = 0;
                const nameLower = biomarkerName.toLowerCase();
                const componentLower = (code.COMPONENT || "").toLowerCase();
                const longNameLower = (code.LONG_COMMON_NAME || "").toLowerCase();

                if (componentLower.includes(nameLower) || longNameLower.includes(nameLower)) {
                    score += 10;
                }

                const nameWords = nameLower.split(/\s+/);
                const componentWords = componentLower.split(/\s+/);
                const matchingWords = nameWords.filter((word) =>
                    componentWords.some((cw) => cw.includes(word) || word.includes(cw)),
                );
                score += matchingWords.length * 2;

                if (unit) {
                    const unitLower = unit.toLowerCase();
                    const codeString = JSON.stringify(code).toLowerCase();
                    if (codeString.includes(unitLower)) {
                        score += 5;
                    }
                }

                return { code, score };
            });

            scoredMatches.sort((a, b) => b.score - a.score);
            const bestMatch = scoredMatches[0];

            if (bestMatch.score > 0) {
                const loincCode = bestMatch.code.LOINC_NUM || "";
                const longName = bestMatch.code.LONG_COMMON_NAME || bestMatch.code.COMPONENT || "";

                logger.info("Matched biomarker to LOINC code", {
                    traceId,
                    biomarkerName,
                    loincCode,
                    longName,
                    score: bestMatch.score,
                });

                return {
                    code: loincCode,
                    longName,
                    component: bestMatch.code.COMPONENT,
                };
            }

            const firstCode = searchResult.results[0];
            const loincCode = firstCode.LOINC_NUM || "";
            const longName = firstCode.LONG_COMMON_NAME || firstCode.COMPONENT || "";

            logger.debug("Using first LOINC result as fallback", {
                traceId,
                biomarkerName,
                loincCode,
                longName,
            });

            return {
                code: loincCode,
                longName,
                component: firstCode.COMPONENT,
            };
        } catch (error) {
            logger.error("Error matching biomarker to LOINC", {
                traceId,
                biomarkerName,
                unit,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
}

export const loincHelper = new LOINCHelper();
export default loincHelper;


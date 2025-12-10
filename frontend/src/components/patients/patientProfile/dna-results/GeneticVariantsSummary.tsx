import { useMemo } from "react";

interface VariantCounts {
  benign: number;
  likelyBenign: number;
  vus: number;
  likelyPathogenic: number;
  pathogenic: number;
}

function calculateVariantCountsFromReports(
  reports: PatientGeneticsReport[]
): VariantCounts {
  const counts: VariantCounts = {
    benign: 0,
    likelyBenign: 0,
    vus: 0,
    likelyPathogenic: 0,
    pathogenic: 0,
  };

  reports.forEach((report) => {
    switch (report.variantStatus) {
      case "Benign":
        counts.benign++;
        break;
      case "Likely Benign":
        counts.likelyBenign++;
        break;
      case "VUS":
        counts.vus++;
        break;
      case "Likely Impactful":
        counts.likelyPathogenic++;
        break;
      case "Impactful":
        counts.pathogenic++;
        break;
    }
  });

  return counts;
}

export function GeneticVariantsSummary({
  reports,
  variantsCount,
  selectedClassification,
  onClassificationClick,
}: {
  reports: PatientGeneticsReport[];
  variantsCount?: {
    total: number;
    benign: number;
    likelyBenign: number;
    vus: number;
    likelyImpactful: number;
    impactful: number;
  };
  selectedClassification?: string | null;
  onClassificationClick?: (classification: string | null) => void;
}) {
  const variantCounts = useMemo(() => {
    if (variantsCount) {
      return {
        benign: variantsCount.benign,
        likelyBenign: variantsCount.likelyBenign,
        vus: variantsCount.vus,
        likelyPathogenic: variantsCount.likelyImpactful,
        pathogenic: variantsCount.impactful,
      };
    }
    return calculateVariantCountsFromReports(reports);
  }, [reports, variantsCount]);

  const total = useMemo(() => {
    return (
      variantCounts.benign +
      variantCounts.likelyBenign +
      variantCounts.vus +
      variantCounts.likelyPathogenic +
      variantCounts.pathogenic
    );
  }, [variantCounts]);

  const classifications = [
    { label: "Benign", count: variantCounts.benign },
    { label: "Likely Benign", count: variantCounts.likelyBenign },
    { label: "VUS", count: variantCounts.vus },
    { label: "Likely Impactful", count: variantCounts.likelyPathogenic },
    { label: "Impactful", count: variantCounts.pathogenic },
  ];

  const getProgressBarSegments = () => {
    if (total === 0) return [];

    // Map classification labels to their colors
    const classificationColors: Record<string, string> = {
      Benign: "bg-teal-400",
      "Likely Benign": "bg-lime-400",
      VUS: "bg-yellow-400",
      "Likely Impactful": "bg-violet-400",
      Impactful: "bg-violet-600",
    };

    const segments = [
      {
        label: "Benign",
        width: (variantCounts.benign / total) * 100,
        color: classificationColors["Benign"],
      },
      {
        label: "Likely Benign",
        width: (variantCounts.likelyBenign / total) * 100,
        color: classificationColors["Likely Benign"],
      },
      {
        label: "VUS",
        width: (variantCounts.vus / total) * 100,
        color: classificationColors["VUS"],
      },
      {
        label: "Likely Impactful",
        width: (variantCounts.likelyPathogenic / total) * 100,
        color: classificationColors["Likely Impactful"],
      },
      {
        label: "Impactful",
        width: (variantCounts.pathogenic / total) * 100,
        color: classificationColors["Impactful"],
      },
    ].filter((segment) => segment.width > 0);

    // If a classification is selected, show only that color, others gray
    if (selectedClassification) {
      return segments.map((segment) => ({
        ...segment,
        color:
          segment.label === selectedClassification
            ? segment.color
            : "bg-gray-300",
      }));
    }

    // If no selection, show all colors
    return segments;
  };

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-md">
      <div className="mb-6">
        <h3 className="text-neutral-900 text-2xl font-semibold">
          Genetic Variants
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 w-full">
        <button
          onClick={() => {
            if (onClassificationClick) {
              onClassificationClick(null);
            }
          }}
          className={`flex flex-col rounded-lg justify-center items-center text-center h-[85px] transition-all cursor-pointer ${
            !selectedClassification ? "bg-transparent" : "hover:bg-neutral-50"
          }`}
        >
          <span
            className={`text-5xl ${
              !selectedClassification
                ? "text-neutral-900 font-normal"
                : "text-neutral-600 font-thin"
            }`}
          >
            {total}
          </span>
          <span
            className={`text-sm ${
              !selectedClassification
                ? "text-neutral-900 font-semibold"
                : "text-neutral-600 font-normal"
            }`}
          >
            Total
          </span>
        </button>

        {classifications.map((classification) => {
          const isSelected = selectedClassification === classification.label;
          return (
            <button
              key={classification.label}
              onClick={() => {
                if (onClassificationClick) {
                  onClassificationClick(
                    isSelected ? null : classification.label
                  );
                }
              }}
              className="rounded-lg border flex flex-col justify-center items-center text-center gap-1 px-4 py-2 h-[85px] transition-all cursor-pointer border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
            >
              <div
                className={`text-5xl ${
                  isSelected
                    ? "text-neutral-900 font-normal"
                    : "text-neutral-600 font-thin"
                }`}
              >
                {classification.count}
              </div>
              <div
                className={`text-sm ${
                  isSelected
                    ? "text-neutral-900 font-semibold"
                    : "text-neutral-600 font-normal"
                }`}
              >
                {classification.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full h-2 flex gap-2">
        {getProgressBarSegments().map((segment, index) => (
          <div
            key={`${segment.label}-${index}`}
            className={`h-full ${segment.color} rounded-full transition-colors`}
            style={{ width: `${segment.width}%` }}
          />
        ))}
      </div>
    </div>
  );
}

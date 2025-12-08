import { useMemo } from "react";

interface VariantCounts {
  benign: number;
  likelyBenign: number;
  vus: number;
  likelyPathogenic: number;
  pathogenic: number;
}

function normalizePathogenicity(
  pathogenicity: string | null | undefined
): keyof VariantCounts | null {
  if (!pathogenicity) return null;
  const normalized = pathogenicity.toLowerCase().trim();

  if (normalized.includes("benign") && !normalized.includes("likely"))
    return "benign";
  if (normalized.includes("likely") && normalized.includes("benign"))
    return "likelyBenign";
  if (
    normalized.includes("vus") ||
    normalized.includes("uncertain") ||
    normalized.includes("uncertain significance")
  )
    return "vus";
  if (normalized.includes("likely") && normalized.includes("pathogenic"))
    return "likelyPathogenic";
  if (normalized.includes("pathogenic") && !normalized.includes("likely"))
    return "pathogenic";

  return null;
}

function calculateVariantCounts(results: PatientDNAResult[]): VariantCounts {
  const counts: VariantCounts = {
    benign: 21,
    likelyBenign: 7,
    vus: 18,
    likelyPathogenic: 4,
    pathogenic: 2,
  };

  results.forEach((result) => {
    result.patientDNAResultBreakdown?.forEach((breakdown) => {
      const pathogenicity = (breakdown as any).pathogenicity;
      const classification = normalizePathogenicity(pathogenicity);
      if (classification) {
        counts[classification]++;
      }
    });
  });

  return counts;
}

export function GeneticVariantsSummary({
  results,
}: {
  results: PatientDNAResult[];
}) {
  const variantCounts = useMemo(
    () => calculateVariantCounts(results),
    [results]
  );

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
    { label: "Likely Pathogenic", count: variantCounts.likelyPathogenic },
    { label: "Pathogenic", count: variantCounts.pathogenic },
  ];

  const getProgressBarSegments = () => {
    if (total === 0) return [];

    const segments = [
      {
        width:
          ((variantCounts.benign + variantCounts.likelyBenign) / total) * 100,
        color: "bg-teal-400",
      },
      {
        width: (variantCounts.likelyBenign / total) * 100,
        color: "bg-lime-400",
      },
      {
        width: (variantCounts.vus / total) * 100,
        color: "bg-yellow-400",
      },
      {
        width: (variantCounts.likelyPathogenic / total) * 100,
        color: "bg-orange-400",
      },
      {
        width: (variantCounts.pathogenic / total) * 100,
        color: "bg-red-400",
      },
    ].filter((segment) => segment.width > 0);

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
        <div className="flex flex-col rounded-lg justify-center items-center text-center h-[85px]">
          <span className="text-neutral-900 text-5xl font-normal">{total}</span>
          <span className="text-neutral-900 text-sm font-semibold">Total</span>
        </div>

        {classifications.map((classification) => (
          <div
            key={classification.label}
            className="rounded-lg border border-neutral-200 flex flex-col justify-center items-center text-center gap-1 px-4 py-2 h-[85px]"
          >
            <div className="text-neutral-600 text-5xl font-thin">
              {classification.count}
            </div>
            <div className="text-neutral-600 text-sm font-normal">
              {classification.label}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full h-2 flex gap-2">
        {getProgressBarSegments().map((segment, index) => (
          <div
            key={index}
            className={`h-full ${segment.color} rounded-full`}
            style={{ width: `${segment.width}%` }}
          />
        ))}
      </div>
    </div>
  );
}

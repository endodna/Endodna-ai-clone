import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useGetPatientGenetics,
  useGetPatientGeneticsReports,
  useOrderDNAKit,
} from "@/hooks/useDoctor";
import { formatDate } from "@/utils/date.utils";
import { shouldSkipStep2 } from "@/utils/orderType.utils";
import { DnaResultsTable } from "@/components/patients/patientProfile/dna-results/DnaResultsTable";
import { OrderTestOptionsModal } from "@/components/patients/patientProfile/dna-results/OrderTestOptionsModal";
import { OrderTestStep1Modal } from "@/components/patients/patientProfile/dna-results/OrderTestStep1Modal";
import { OrderTestStep2Modal } from "@/components/patients/patientProfile/dna-results/OrderTestStep2Modal";
import { GeneticVariantsSummary } from "@/components/patients/patientProfile/dna-results/GeneticVariantsSummary";
import { ReportsList } from "@/components/patients/patientProfile/dna-results/ReportsList";

interface DnaResultsTabProps {
  patientId?: string;
  patient?: PatientDetail | null;
}

export type Step1Data = {
  barcode: string;
  reportId: string;
  addressId?: string;
};

export function DnaResultsTab({
  patientId,
  patient,
}: Readonly<DnaResultsTabProps>) {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showStep1Modal, setShowStep1Modal] = useState(false);
  const [showStep2Modal, setShowStep2Modal] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<string | null>(
    null
  );
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<
    string | null
  >(null);

  const { data: geneticsResponse } = useGetPatientGenetics(patientId ?? "", {
    enabled: Boolean(patientId),
  });
  const results = geneticsResponse?.data ?? [];

  const { data: reportsResponse } = useGetPatientGeneticsReports(
    patientId ?? "",
    {
      enabled: Boolean(patientId),
    }
  );

  const reportsData = reportsResponse?.data as any;
  const reports = useMemo(() => {
    if (
      !reportsData ||
      !reportsData.reports ||
      !Array.isArray(reportsData.reports)
    ) {
      return [];
    }

    const flatReports: PatientGeneticsReport[] = [];
    reportsData.reports.forEach((report: any, reportIndex: number) => {
      if (report.categories && Array.isArray(report.categories)) {
        report.categories.forEach((category: any, categoryIndex: number) => {
          const normalizedStatus = (category.variantStatus || "")
            .toLowerCase()
            .trim();
          let variantStatus: PatientGeneticsReport["variantStatus"] = "VUS";
          if (normalizedStatus === "benign") variantStatus = "Benign";
          else if (normalizedStatus === "likely benign")
            variantStatus = "Likely Benign";
          else if (normalizedStatus === "vus") variantStatus = "VUS";
          else if (
            normalizedStatus === "likely impactful" ||
            normalizedStatus === "likely pathogenic"
          )
            variantStatus = "Likely Pathogenic";
          else if (
            normalizedStatus === "impactful" ||
            normalizedStatus === "pathogenic"
          )
            variantStatus = "Pathogenic";

          flatReports.push({
            id: `${reportIndex}-${categoryIndex}`,
            name: category.categoryName || "",
            variantStatus,
          });
        });
      }
    });
    return flatReports;
  }, [reportsData]);

  const variantsCount = reportsData?.variantsCount;

  const orderMutation = useOrderDNAKit();

  const lastUpdated = useMemo(() => {
    const [firstResult] = results;
    if (!firstResult?.updatedAt) return null;
    return formatDate(firstResult.updatedAt);
  }, [results]);

  const resetFlow = () => {
    setShowOptionsModal(false);
    setShowStep1Modal(false);
    setShowStep2Modal(false);
    setSelectedOrderType(null);
    setStep1Data(null);
    setStep1Error(null);
  };

  const handleSelectOption = (option: string) => {
    setStep1Error(null);
    setStep1Data(null);
    setSelectedOrderType(option);
    setShowOptionsModal(false);
    setShowStep1Modal(true);
  };

  const submitOrder = async (data: Step1Data, orderType: string) => {
    if (!patientId) return null;
    return orderMutation.mutateAsync({
      patientId,
      data: {
        ...data,
        orderType,
      },
    });
  };

  const handleStep1Submit = async (data: Step1Data) => {
    if (!selectedOrderType || !patientId) return;
    setStep1Error(null);
    setStep1Data(data);
    try {
      const response = await submitOrder(data, selectedOrderType);
      if (!response || response.error) {
        setStep1Error(
          response?.message ?? "Failed to submit order. Please try again."
        );
        return;
      }
      if (shouldSkipStep2(selectedOrderType)) {
        resetFlow();
        return;
      }
      setShowStep1Modal(false);
      setShowStep2Modal(true);
    } catch (error) {
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit order. Please try again.";
      setStep1Error(fallbackMessage);
    }
  };

  const handleConfirmFromStep2 = () => {
    if (!selectedOrderType || !step1Data) return;
    console.log("Step 2 confirm clicked", { selectedOrderType, step1Data });
    resetFlow();
  };

  if (!patientId) {
    return (
      <div className="rounded-3xl border border-muted-foreground bg-primary-foreground p-6">
        <p className="typo-body-2 text-muted-foreground">
          Select a patient to view DNA results.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex justify-end">
        <Button
          className="relative top-0 xl:-top-12 px-4 md:px-6 py-1 md:py-[9.5px]"
          onClick={() => setShowOptionsModal(true)}
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="typo-body-2">Order Test</span>
        </Button>
      </div>
      {showDetailsView ? (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => {
              setShowDetailsView(false);
              setSelectedClassification(null);
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
          <GeneticVariantsSummary
            reports={reports}
            variantsCount={variantsCount}
            selectedClassification={selectedClassification}
            onClassificationClick={setSelectedClassification}
          />
          <ReportsList
            initialFilter={selectedClassification || undefined}
            patientId={patientId}
            onFilterChange={(filter) => {
              setSelectedClassification(filter);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 bg-primary-foreground p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground">Results</h3>
            {lastUpdated && (
              <p className="typo-body-2 text-muted-foreground">
                Updated on {lastUpdated}
              </p>
            )}
          </div>

          <DnaResultsTable
            patientId={patientId}
            onOpenClick={() => setShowDetailsView(true)}
          />
        </div>
      )}

      <OrderTestOptionsModal
        open={showOptionsModal}
        onOpenChange={(open) => {
          setShowOptionsModal(open);
          if (!open) {
            setSelectedOrderType(null);
            setStep1Error(null);
            setStep1Data(null);
          }
        }}
        onSelectOption={handleSelectOption}
      />

      {selectedOrderType && (
        <>
          <OrderTestStep1Modal
            open={showStep1Modal}
            onOpenChange={(open) => {
              setShowStep1Modal(open);
              if (!open && !showStep2Modal) {
                setStep1Data(null);
                setSelectedOrderType(null);
                setStep1Error(null);
              }
            }}
            patientId={patientId}
            orderType={selectedOrderType}
            onSubmit={handleStep1Submit}
            patient={patient}
            isSubmitting={orderMutation.isPending}
            errorMessage={step1Error}
          />

          {!shouldSkipStep2(selectedOrderType) && step1Data && (
            <OrderTestStep2Modal
              open={showStep2Modal}
              onOpenChange={(open) => {
                setShowStep2Modal(open);
                if (!open) {
                  setStep1Data(null);
                  setSelectedOrderType(null);
                }
              }}
              patientId={patientId}
              orderType={selectedOrderType}
              step1Data={step1Data}
              onConfirm={handleConfirmFromStep2}
              onCancel={resetFlow}
              isSubmitting={orderMutation.isPending}
              patient={patient}
            />
          )}
        </>
      )}
    </div>
  );
}

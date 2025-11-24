import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useGetPatientGenetics, useOrderDNAKit } from "@/hooks/useDoctor";
import { formatDate } from "@/utils/date.utils";

import { DnaResultsTable } from "@/components/patients/patientProfile/dna-results/DnaResultsTable";
import { OrderTestOptionsModal } from "@/components/patients/patientProfile/dna-results/OrderTestOptionsModal";
import { OrderTestStep1Modal } from "@/components/patients/patientProfile/dna-results/OrderTestStep1Modal";
import { OrderTestStep2Modal } from "@/components/patients/patientProfile/dna-results/OrderTestStep2Modal";

interface DnaResultsTabProps {
    patientId?: string;
    patient?: PatientDetail | null;
}

export type Step1Data = {
    barcode: string;
    reportId: string;
    addressId?: string;
};



export function DnaResultsTab({ patientId, patient }: Readonly<DnaResultsTabProps>) {
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showStep1Modal, setShowStep1Modal] = useState(false);
    const [showStep2Modal, setShowStep2Modal] = useState(false);
    const [selectedOrderType, setSelectedOrderType] = useState<DnaOrderType | null>(null);
    const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
    const [step1Error, setStep1Error] = useState<string | null>(null);

    const { data: geneticsResponse } = useGetPatientGenetics(patientId ?? "", {
        enabled: Boolean(patientId),
    });
    const results = geneticsResponse?.data ?? [];

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

    const handleSelectOption = (option: DnaOrderType) => {
        setStep1Error(null);
        setStep1Data(null);
        setSelectedOrderType(option);
        setShowOptionsModal(false);
        setShowStep1Modal(true);
    };

    const submitOrder = async (data: Step1Data, orderType: DnaOrderType) => {
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
                setStep1Error(response?.message ?? "Failed to submit order. Please try again.");
                return;
            }
            if (selectedOrderType === "PATIENT_SELF_PURCHASE") {
                resetFlow();
                return;
            }
            setShowStep1Modal(false);
            setShowStep2Modal(true);
        } catch (error) {
            const fallbackMessage =
                error instanceof Error ? error.message : "Failed to submit order. Please try again.";
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
            <div className="rounded-3xl border border-neutral-100 bg-white p-6">
                <p className="text-sm text-neutral-600">Select a patient to view DNA results.</p>
            </div>
        );
    }

    return (
        <div className="">
            <div className="flex justify-end">
                <Button
                    className="bg-violet-700 hover:bg-violet-800 text-white relative -top-12 px-4 md:px-6 py-1 md:py-[9.5px]"
                    onClick={() => setShowOptionsModal(true)}
                >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm font-medium leading-normal">Order Test</span>
                </Button>
            </div>
            <div className="space-y-4 md:space-y-6 bg-white p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-neutral-900">Results</h3>
                    {lastUpdated && (
                        <p className="text-smfont-regular text-neutral-500">Updated on {lastUpdated}</p>
                    )}
                </div>

                <DnaResultsTable />

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

                        {selectedOrderType !== "PATIENT_SELF_PURCHASE" && step1Data && (
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
        </div>
    );
}
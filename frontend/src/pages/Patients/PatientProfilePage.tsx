import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PatientHeader } from "@/components/patients/patientProfile/PatientHeader";

export default function PatientProfilePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <Button
          onClick={() => navigate("/dashboard/patients")}
          className="px-2 md:px-4 py-2 md:py-[11.38px]"
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-neutral-700 text-sm font-medium leading-normal">
            Back
          </span>
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-[63px]">
        <PatientHeader patientId={patientId} />

        <div className="flex-1 rounded-3xl border border-dashed border-neutral-200 bg-white p-6 text-center text-neutral-500">
          Patient summary and tabs will appear here.
        </div>
      </div>
    </div>
  );
}

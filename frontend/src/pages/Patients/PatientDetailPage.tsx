import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate("/dashboard/patients")}
          variant="ghost"
          size="icon"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-5xl font-semibold text-neutral-900">
          Patient Details
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        <div>
          <p className="text-neutral-600">ID: {patientId}</p>
        </div>
      </div>
    </div>
  );
}


import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PatientProfileBreadcrumbProps {
  readonly onBack?: () => void;
}

export function PatientProfileBreadcrumb({ onBack }: Readonly<PatientProfileBreadcrumbProps>) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <Button
        onClick={onBack}
        className="px-2 md:px-4 py-2 md:py-[11.38px] w-fit"
        variant="ghost"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-foreground typo-body-2  ">
          Back
        </span>
      </Button>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="typo-body-2">
              <Link to="/dashboard">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="typo-body-2  ">
              <Link to="/dashboard/patients">Patients</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="typo-body-2  ">
              Patient details
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}


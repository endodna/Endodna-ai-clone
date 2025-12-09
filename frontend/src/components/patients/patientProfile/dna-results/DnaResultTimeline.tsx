"use client";

import React from "react";
import {
  DNA_TEST_STEPS,
  DNA_STEP_STATUS,
} from "@/components/constants/DnaResults";
import type {
  DnaTestStepId,
  DnaStepStatus,
} from "@/components/constants/DnaResults";
import type { StepStatusResult } from "@/utils/dnaResult.utils";
import { Circle, CircleCheckBig, CircleDot, CircleX } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

// Define steps manually
const DNA_STEPS = [
  { id: DNA_TEST_STEPS.TEST_ORDER, title: "Test Ordered" },
  { id: DNA_TEST_STEPS.SAMPLE_COLLECTION, title: "Sample Received" },
  { id: DNA_TEST_STEPS.QUALITY_CONTROL, title: "QC Passed" },
  { id: DNA_TEST_STEPS.DNA_EXTRACTION, title: "DNA Extracted" },
  { id: DNA_TEST_STEPS.GENOTYPING, title: "Genotyping Accepted" },
  { id: DNA_TEST_STEPS.FILE_DELIVERY, title: "File Delivery" },
] as const;

// label for the step & per status
const labelFor = (stepId: DnaTestStepId, status: DnaStepStatus): string => {
  // positive labels for the steps
  const baseLabels: Record<DnaTestStepId, string> = {
    TEST_ORDER: "Test Ordered",
    SAMPLE_COLLECTION: "Sample Received",
    QUALITY_CONTROL: "QC Passed",
    DNA_EXTRACTION: "DNA Extracted",
    GENOTYPING: "Genotyping Accepted",
    FILE_DELIVERY: "File Delivery",
  };

  // failure labels for the steps
  const failedLabels: Record<DnaTestStepId, string> = {
    TEST_ORDER: "Test Order Failed",
    SAMPLE_COLLECTION: "Sample Collection Failed",
    QUALITY_CONTROL: "QC Failed",
    DNA_EXTRACTION: "DNA Extraction Failed",
    GENOTYPING: "Genotyping Failed",
    FILE_DELIVERY: "File Delivery Failed",
  };

  if (status === DNA_STEP_STATUS.FAILED) {
    return failedLabels[stepId] ?? "Failed";
  }

  return baseLabels[stepId] ?? "Unknown";
};

// icon/visual helpers
const Icon = ({ status }: { status: DnaStepStatus }) => {
  const baseClasses = "flex-shrink-0";

  switch (status) {
    case DNA_STEP_STATUS.COMPLETE:
      return (
        <CircleCheckBig className={`h-7 w-7 text-teal-600 ${baseClasses}`} />
      );
    case DNA_STEP_STATUS.FAILED:
      return <CircleX className={`h-7 w-7 text-destructive ${baseClasses}`} />;
    case DNA_STEP_STATUS.CURRENT:
      return <CircleDot className={`h-7 w-7 text-teal-600 ${baseClasses}`} />;
    default:
      return (
        <Circle className={`h-7 w-7 text-primary ${baseClasses}`} />
      );
  }
};

// Build ordered steps with status inferred from provided (active) step id + stepStatus
const buildSteps = (
  activeId: DnaTestStepId | null,
  _activeStatus: DnaStepStatus
) => {
  const steps = DNA_STEPS as readonly { id: DnaTestStepId; title?: string }[];
  const activeIndex = activeId ? steps.findIndex((s) => s.id === activeId) : -1;

  return steps.map((s, idx) => {
    let status: DnaStepStatus;
    if (activeIndex === -1) {
      // No active id provided → everything upcoming
      status = DNA_STEP_STATUS.UPCOMING;
    } else if (idx < activeIndex) {
      status = DNA_STEP_STATUS.COMPLETE;
    } else if (idx === activeIndex) {
      // Always set the active step to CURRENT
      status = DNA_STEP_STATUS.CURRENT;
    } else {
      status = DNA_STEP_STATUS.UPCOMING;
    }

    return {
      id: s.id,
      title: s.title ?? s.id,
      status,
    } as const;
  });
};

// Shared timeline component that works for both horizontal and vertical
const Timeline = ({
  steps,
  activeId,
  variant = "horizontal",
}: {
  steps: ReturnType<typeof buildSteps>;
  activeId: DnaTestStepId;
  variant?: "horizontal" | "vertical";
}) => {
  if (variant === "vertical") {
    return (
      <ol className="flex flex-col items-start gap-4 py-4">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          // Vertical connector styling
          let connectorClasses = "border-muted-foreground";
          if (step.status === DNA_STEP_STATUS.COMPLETE) {
            connectorClasses = "border-dashed border-primary";
          } else if (step.status === DNA_STEP_STATUS.CURRENT) {
            connectorClasses = "border-dashed border-primary";
          }

          // Label styling for vertical variant
          let labelClass = "text-muted-foreground";
          if (step.status === DNA_STEP_STATUS.COMPLETE) {
            labelClass = "text-primary";
          } else if (step.status === DNA_STEP_STATUS.CURRENT) {
            labelClass = "text-primary";
          }

          return (
            <li key={step.id} className="flex items-start gap-3 w-full">
              <div className="flex flex-col items-center">
                <Icon status={step.status} />
                {!isLast && (
                  <div
                    aria-hidden
                    className={`w-0.5 border-l-2 ${connectorClasses} mt-2`}
                    style={{ minHeight: 32, flexGrow: 1 }}
                  />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <span className={`typo-body-2 ${labelClass}`}>
                  {labelFor(step.id, step.status)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  // Horizontal variant
  return (
    <ol className="flex items-center w-full justify-between">
      {steps.map((step, idx) => {
        const isFirst = idx === 0;
        let connectorClasses = "border-primary";
        if (step.status === DNA_STEP_STATUS.CURRENT || step.status === DNA_STEP_STATUS.COMPLETE) {
          connectorClasses = "border-dashed border-teal-600";
        }

        let labelClass = "text-muted-foreground";
        if (
          step.status === DNA_STEP_STATUS.CURRENT ||
          step.status === DNA_STEP_STATUS.COMPLETE
        ) {
          labelClass = "text-teal-600";
        }

        return (
          <li
            key={step.id}
            className="flex items-center justify-center flex-grow gap-1"
          >
            {!isFirst && (
              <div
                aria-hidden
                className={`h-0.5 border border-solid ${connectorClasses}`}
                style={{ flexGrow: 1, minWidth: 36 }}
              />
            )}
            <div className="flex items-center justify-center gap-2 flex-grow mr-1">
              <Icon status={step.status} />
              {step.id === activeId && (
                <span className={`typo-body-2 text-center ${labelClass}`}>
                  {labelFor(step.id, step.status)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const DnaResultTimeline: React.FC<StepStatusResult> = ({
  id,
  status,
}) => {
  if (!id) return null;

  const steps = buildSteps(id, status);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="w-fit cursor-pointer">
          <Timeline steps={steps} activeId={id} variant="horizontal" />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-auto min-w-[260px] bg-primary-brand-teal-1">
        <Timeline steps={steps} activeId={id} variant="vertical" />
      </HoverCardContent>
    </HoverCard>
  );
};

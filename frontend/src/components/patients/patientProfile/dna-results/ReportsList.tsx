import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Report {
  id: string;
  name: string;
  variantStatus:
    | "Benign"
    | "Likely Benign"
    | "VUS"
    | "Likely Pathogenic"
    | "Pathogenic";
}

interface ReportsListProps {
  reports?: Report[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Likely Pathogenic":
      return "bg-orange-500";
    case "Benign":
      return "bg-teal-500";
    case "VUS":
      return "bg-yellow-500";
    case "Likely Benign":
      return "bg-cyan-500";
    case "Pathogenic":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const mockReports: Report[] = [
  {
    id: "1",
    name: "Stress Response & Emotional Regulation Pathway Function",
    variantStatus: "Likely Pathogenic",
  },
  {
    id: "2",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Benign",
  },
  {
    id: "3",
    name: "Bruxism",
    variantStatus: "VUS",
  },
  {
    id: "4",
    name: "Stress Response & Emotional Regulation Pathway Function",
    variantStatus: "Likely Benign",
  },
  {
    id: "5",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Benign",
  },
  {
    id: "6",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Pathogenic",
  },
  {
    id: "7",
    name: "Bruxism",
    variantStatus: "VUS",
  },
  {
    id: "8",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Benign",
  },
  {
    id: "9",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Pathogenic",
  },
  {
    id: "10",
    name: "Bruxism",
    variantStatus: "VUS",
  },
  {
    id: "11",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Benign",
  },
  {
    id: "12",
    name: "Stress Response & Emotional Regulation Pathway Function",
    variantStatus: "Likely Pathogenic",
  },
  {
    id: "13",
    name: "Stress Response & Emotional Regulation Pathway Function",
    variantStatus: "Likely Benign",
  },
  {
    id: "14",
    name: "Bruxism",
    variantStatus: "VUS",
  },
  {
    id: "15",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Benign",
  },
  {
    id: "16",
    name: "Bruxism",
    variantStatus: "VUS",
  },
  {
    id: "17",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Pathogenic",
  },
  {
    id: "18",
    name: "Neurotransmitter Reward Pathway Function",
    variantStatus: "Benign",
  },
  {
    id: "19",
    name: "Stress Response & Emotional Regulation Pathway Function",
    variantStatus: "Likely Pathogenic",
  },
  {
    id: "20",
    name: "Stress Response & Emotional Regulation Pathway Function",
    variantStatus: "Likely Benign",
  },
  {
    id: "21",
    name: "Bruxism",
    variantStatus: "VUS",
  },
];

export function ReportsList({ reports = mockReports }: ReportsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterValue === "all" || report.variantStatus === filterValue;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-md">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-neutral-600 text-2xl font-semibold">Reports</h3>
          <Button
            variant="default"
            className="bg-neutral-100 text-neutral-900 font-medium text-sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Explore with BIOS
          </Button>
        </div>

        <div className="flex justify-between gap-3">
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-600" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-[128px] text-sm font-normal text-neutral-950 border-neutral-300">
              <SelectValue placeholder="All Variants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Variants</SelectItem>
              <SelectItem value="Benign">Benign</SelectItem>
              <SelectItem value="Likely Benign">Likely Benign</SelectItem>
              <SelectItem value="VUS">VUS</SelectItem>
              <SelectItem value="Likely Pathogenic">
                Likely Pathogenic
              </SelectItem>
              <SelectItem value="Pathogenic">Pathogenic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-3 -mx-6" />
      <div className="space-y-0">
        <div className="grid grid-cols-12 gap-4 pb-2">
          <div className="col-span-7">
            <span className="text-sm font-medium text-neutral-950 ml-5">
              Name
            </span>
          </div>
          <div className="col-span-3">
            <span className="text-sm font-medium text-neutral-950">
              Variant Status
            </span>
          </div>
          <div className="col-span-2"></div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No reports found</div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="grid grid-cols-12 gap-4 py-1 border-b border-neutral-300 last:border-b-0 items-center"
            >
              <div className="col-span-7 flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(report.variantStatus)}`}
                />
                <span className="text-sm text-neutral-950 font-normal">
                  {report.name}
                </span>
              </div>
              <div className="col-span-3">
                <span className="text-sm text-neutral-950 font-normal">
                  {report.variantStatus}
                </span>
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-950 font-medium text-xs"
                >
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-950 font-medium text-xs"
                >
                  Ask BIOS
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

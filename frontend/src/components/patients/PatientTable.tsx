import { PatientTableRow, type PatientRow } from "./PatientTableRow";

const samplePatients: PatientRow[] = [
  {
    id: "1",
    name: "Alexander Maximillian Thompson",
    subId: "123456987-0",
    dob: "10/27/1985",
    status: "labs",
    lastActivity: "Lab Results • 10/27/2025",
    healthGoal: "Set a health goal to improve your overall...",
    physician: "Dr. Kaufmann",
  },
  {
    id: "2",
    name: "Maximilian Harrington Alexander",
    subId: "987654012-3",
    dob: "12/3/1992",
    status: "labs",
    lastActivity: "Lab Results • 12/3/1992",
    healthGoal: "Prioritize adding more fruits and vegetabl...",
    physician: "Dr. David Lee",
  },
  {
    id: "3",
    name: "Sebastian Montgomery Harrington III",
    subId: "987654012-3",
    dob: "12/3/1992",
    status: "dna",
    lastActivity: "Lab Results • 12/3/1992",
    healthGoal: "Establish a wellness goal by committing t...",
    physician: "Dr. Michael Thompson",
  },
  // Repeat to simulate multiple rows (design shows many)
  {
    id: "4",
    name: "Alexander Maximilian Thompson",
    subId: "123456987-0",
    dob: "10/27/1985",
    status: "labs",
    lastActivity: "Lab Results • 10/27/2025",
    healthGoal: "Set a health goal to improve your overall...",
    physician: "Dr. Kaufmann",
  },
  {
    id: "5",
    name: "Maximilian Harrington Alexander",
    subId: "987654012-3",
    dob: "12/3/1992",
    status: "labs",
    lastActivity: "Lab Results • 12/3/1992",
    healthGoal: "Prioritize adding more fruits and vegetabl...",
    physician: "Dr. David Lee",
  },
  {
    id: "6",
    name: "Sebastian Montgomery Harrington III",
    subId: "987654012-3",
    dob: "12/3/1992",
    status: "dna",
    lastActivity: "Lab Results • 12/3/1992",
    healthGoal: "Establish a wellness goal by committing t...",
    physician: "Dr. Michael Thompson",
  },
];

export function PatientTable() {
  return (
    <div className="overflow-hidden rounded-2xl">
      <div className="overflow-auto ">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-neutral-500 text-sm">
            <th className="py-3 px-4"></th>
              <th className="py-3 px-4 min-w-64">Patient</th>
              <th className="py-3 px-4 min-w-40">DNA Test Status</th>
              <th className="py-3 px-4 min-w-48">Last activity</th>
              <th className="py-3 px-4 min-w-[22rem]">Health Goals</th>
              <th className="py-3 px-4 min-w-40">Physician</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {samplePatients.map((p) => (
              <PatientTableRow key={p.id} row={p} />
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}



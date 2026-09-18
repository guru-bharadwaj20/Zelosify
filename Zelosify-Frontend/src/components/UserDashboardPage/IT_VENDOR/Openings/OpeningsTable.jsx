"use client";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/Common/date";
import {
  formatStatusLabel,
  getStatusClasses,
} from "@/utils/Dashboard/Vendor/openingUtils";

export default function OpeningsTable({ openings }) {
  const router = useRouter();

  const openDetails = (openingId) => {
    router.push(`/vendor/openings/${openingId}`);
  };

  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-tableHeader">
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-sm font-medium text-primary">
              Title
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-primary">
              Location
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-primary">
              Contract Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-primary">
              Posted Date
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-primary">
              Hiring Manager
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-primary">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {openings.map((opening) => (
            <tr
              key={opening.id}
              tabIndex={0}
              role="button"
              aria-label={`Open details for ${opening.title}`}
              className="border-b border-border hover:bg-tableHeader cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              onClick={() => openDetails(opening.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") openDetails(opening.id);
              }}
            >
              <td className="px-4 py-4 text-sm text-foreground">
                {opening.title}
              </td>
              <td className="px-4 py-4 text-sm text-foreground">
                {opening.location || "-"}
              </td>
              <td className="px-4 py-4 text-sm text-foreground">
                {opening.contractType || "-"}
              </td>
              <td className="px-4 py-4 text-sm text-foreground">
                {formatDate(opening.postedDate)}
              </td>
              <td className="px-4 py-4 text-sm text-foreground">
                {opening.hiringManagerName}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getStatusClasses(
                    opening.status
                  )}`}
                >
                  {formatStatusLabel(opening.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

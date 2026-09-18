import OpeningProfilesLayout from "@/components/UserDashboardPage/HIRING_MANAGER/Openings/OpeningProfilesLayout";

export default async function HiringManagerOpeningProfilesPage({ params }) {
  const { id } = await params;

  return (
    <div className="w-full">
      <OpeningProfilesLayout openingId={id} />
    </div>
  );
}

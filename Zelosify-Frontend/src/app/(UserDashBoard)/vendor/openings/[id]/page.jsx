import OpeningDetailsLayout from "@/components/UserDashboardPage/IT_VENDOR/Openings/OpeningDetailsLayout";

export default async function VendorOpeningDetailsPage({ params }) {
  const { id } = await params;

  return (
    <div className="w-full">
      <OpeningDetailsLayout openingId={id} />
    </div>
  );
}

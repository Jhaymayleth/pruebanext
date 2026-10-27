
import ReservationsClient from "./reservations-client";

type ReservationsPageProps = {
  searchParams: Promise<{
    spaceId?: string;
  }>;
};

export default async function ReservationsPage({
  searchParams,
}: ReservationsPageProps) {
  const params = await searchParams;

  return (
    <ReservationsClient initialSpaceId={params.spaceId ?? ""} />
  );
}

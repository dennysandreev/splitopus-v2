import type { TripMember } from "../store/useStore";

export function getMemberName(
  members: TripMember[],
  idOrName: string | number | undefined,
): string {
  if (idOrName === undefined || idOrName === null) {
    return "Unknown";
  }

  const id = String(idOrName);
  return members.find((member) => String(member.id) === id)?.name ?? id;
}

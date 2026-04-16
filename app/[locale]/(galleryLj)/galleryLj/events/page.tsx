import { getAllGalleryLjExhibitions } from "@/lib/actions/gallery-lj-exhibition-actions";
import { loadGalleryLjExhibitionsSearchParams } from "../exhibitions/searchParams";
import GalleryLjExhibitionsClient from "../exhibitions/GalleryLjEventsClient";
import type { SearchParams } from "nuqs/server";

export const metadata = {
  title: "Evènements Galerie LJ | Administration",
  description: "Gérez les évènements de la galerie LJ",
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function GalleryLjEventsPage({ searchParams }: PageProps) {
  const { sortColumn, sortDirection, page, itemsPerPage } =
    await loadGalleryLjExhibitionsSearchParams(searchParams);

  const allExhibitions = await getAllGalleryLjExhibitions();

  const sortedExhibitions = [...allExhibitions].sort((a, b) => {
    const valueA = (a as Record<string, unknown>)[sortColumn] ?? "";
    const valueB = (b as Record<string, unknown>)[sortColumn] ?? "";
    if (sortDirection === "asc") {
      return typeof valueA === "string"
        ? valueA.localeCompare(valueB as string)
        : (valueA as number) - (valueB as number);
    } else {
      return typeof valueA === "string"
        ? (valueB as string).localeCompare(valueA)
        : (valueB as number) - (valueA as number);
    }
  });

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedExhibitions = sortedExhibitions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <GalleryLjExhibitionsClient
      exhibitions={paginatedExhibitions}
      totalItems={sortedExhibitions.length}
      currentPage={page}
      itemsPerPage={itemsPerPage}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
    />
  );
}

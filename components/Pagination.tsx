import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PaginationForPages({
  currentPage,
  numPages,
  basePath,
}: {
  currentPage: number;
  numPages: number;
  basePath: string;
}) {
  // basePathの末尾にスラッシュがない場合は追加する
  if (!basePath.endsWith("/")) {
    basePath += "/";
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" disabled={currentPage === 1} size="lg">
        <Link
          href={`${basePath}/${currentPage - 1}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      {currentPage !== 1 && (
        <Button variant="outline" size="lg">
          <Link href={`${basePath}/1`}>
            1
          </Link>
        </Button>
      )}
      {currentPage > 3 && <Ellipsis className="h-4 w-4" />}
      {currentPage > 2 && (
        <Button variant="outline" size="lg">
          <Link href={`${basePath}/${currentPage - 1}`}>
            {currentPage - 1}
          </Link>
        </Button>
      )}
      <Button variant="default" disabled>
        {currentPage}
      </Button>
      {currentPage < numPages - 1 && (
        <Button variant="outline" size="lg">
          <Link href={`${basePath}/${currentPage + 1}`}>
            {currentPage + 1}
          </Link>
        </Button>
      )}
      {currentPage < numPages - 2 && <Ellipsis className="h-4 w-4" />}
      {currentPage !== numPages && (
        <Button variant="outline" size="lg">
          <Link href={`${basePath}/${numPages}`}>
            {numPages}
          </Link>
        </Button>
      )}
      <Button variant="outline" disabled={currentPage === numPages} size="lg">
        <Link
          href={`${basePath}/${currentPage + 1}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

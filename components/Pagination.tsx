import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function createNewSearchParams(currentSearchParams: string, page: number) {
  const newSearchParams = new URLSearchParams(currentSearchParams);
  newSearchParams.set("page", page.toString());
  return newSearchParams.toString();
}

/**
 * 
 * @param currentPage 現在のページ番号
 * @param numPages ページネーションの総ページ数
 * @param basePath ページネーションのリンクのベースパス
 * @returns ページネーションコンポーネント
 */
export function PaginationForPages({
  currentPage,
  numPages,
  currentUrl,
  currentSearchParams,
}: {
  currentPage: number;
  numPages: number;
  currentUrl: string;
  currentSearchParams: URLSearchParams;
}) {
  const strCurrentSearchParams = currentSearchParams.toString();
  const pageHref = (page: number) =>
    `${currentUrl}?${createNewSearchParams(strCurrentSearchParams, page)}`;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {currentPage === 1 ? (
        <Button variant="outline" size="lg" disabled>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="lg">
          <Link href={pageHref(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      )}
      {currentPage !== 1 && (
        <Button asChild variant="outline" size="lg">
          <Link href={pageHref(1)}>1</Link>
        </Button>
      )}
      {currentPage > 3 && <Ellipsis className="h-4 w-4" />}
      {currentPage > 2 && (
        <Button asChild variant="outline" size="lg">
          <Link href={pageHref(currentPage - 1)}>{currentPage - 1}</Link>
        </Button>
      )}
      <Button variant="default" disabled>
        {currentPage}
      </Button>
      {currentPage < numPages - 1 && (
        <Button asChild variant="outline" size="lg">
          <Link href={pageHref(currentPage + 1)}>{currentPage + 1}</Link>
        </Button>
      )}
      {currentPage < numPages - 2 && <Ellipsis className="h-4 w-4" />}
      {currentPage !== numPages && (
        <Button asChild variant="outline" size="lg">
          <Link href={pageHref(numPages)}>{numPages}</Link>
        </Button>
      )}
      {currentPage === numPages ? (
        <Button variant="outline" size="lg" disabled>
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="lg">
          <Link href={pageHref(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

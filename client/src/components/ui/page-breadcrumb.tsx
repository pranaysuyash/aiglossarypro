import { Link } from "wouter";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BaseComponentProps } from "@/types/common-props";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface PageBreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
}

export default function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage>
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href || "#"}>
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
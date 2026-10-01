import { Link } from "react-router";

import { PageHead } from "../components/PageHead";
import { PixelGlyph } from "../components/pixel";

export function NotFoundPage() {
  return (
    <>
      <PageHead
        line="404"
        title="No page at this address"
        lede={
          <>
            The route you asked for is not in the table.{" "}
            <Link to="/" className="text-accent">
              Go to the index
            </Link>
            .
          </>
        }
      />

      <div className="page-gutter pb-16">
        <PixelGlyph kind="star" className="h-12 w-12" />
      </div>
    </>
  );
}

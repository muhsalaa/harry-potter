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
            There is no such page in the index. <Link to="/">Back to the front</Link>.
          </>
        }
      />

      <div className="page-gutter pb-16">
        <PixelGlyph kind="star" className="h-12 w-12" />
      </div>
    </>
  );
}

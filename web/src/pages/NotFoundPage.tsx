import { Link } from "react-router";

import { PageHead } from "../components/PageHead";

export function NotFoundPage() {
  return (
    <>
      <PageHead
        line="404"
        title="No page at this address"
        lede={
          <>
            The route you asked for is not in the table. <Link to="/">Go to the index</Link>.
          </>
        }
      />
    </>
  );
}

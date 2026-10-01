-- 16 characters a page, where it used to be 24.
--
-- `list_page` / `list_index` remember where a character sits in PotterDB's
-- page order, so a page can be served from the mirror after its first view
-- (ADR-0001). Those positions — and the corpus row's `pages` count — are only
-- true for the page size they were fetched at. Dropping them is the whole
-- invalidation: the next visit re-fetches at the new size.
--
-- The rows themselves stay: favorites and notes point at `characters.id`.
UPDATE characters SET list_page = NULL, list_index = NULL;

DELETE FROM corpus;

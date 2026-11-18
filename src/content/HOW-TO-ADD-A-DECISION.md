# How to add a decision

1. Open `src/content/decisions.ts` and copy the EXAMPLE ENTRY into the `DECISIONS` list.
2. Fill it in: the next number, the date, one line, the kind, each seat's vote, the result, a short paragraph, the cost in к (or `null` for none).
3. Seats only, never a name. If it was paid, put the transaction id from this site's /tx page in `transactions`.
4. Run `npm test`. It fails with a plain message if an entry is wrong.
5. Commit, open a pull request, merge. The site deploys by itself and the decision is on /decisions.

## A decision published by title only

This file is public. For a withheld decision, do not write the detail in this file at all.

1. Copy the second example, EXAMPLE ENTRY, DETAIL WITHHELD, instead of the first.
2. Fill in the number, the date, the title, the kind, each seat's vote and the result.
3. Keep the line `detailWithheld: true,`. Leave out the detail, the cost, who carries it out and the transactions.
4. The list shows "Not yet" under "Carried out". To change it, add `carriedOut: "Carried out",` or `carriedOut: "No transaction",`.

The site then shows the title, the kind, the vote and the result, and one line: "The detail of this decision is withheld."

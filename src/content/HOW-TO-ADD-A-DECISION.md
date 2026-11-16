# How to add a decision

1. Open `src/content/decisions.ts` and copy the EXAMPLE ENTRY into the `DECISIONS` list.
2. Fill it in: the next number, the date, one line, the kind, each seat's vote, the result, a short paragraph, the cost.
3. Seats only, never a name. If it was paid, put the transaction id from this site's /tx page in `transactions`.
4. Run `npm test`. It fails with a plain message if an entry is wrong.
5. Commit, open a pull request, merge. The site deploys by itself and the decision is on /decisions.

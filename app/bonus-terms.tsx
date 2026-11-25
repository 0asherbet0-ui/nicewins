const labels = {
  wagering: "Wagering requirement",
  wageringBasis: "Applies to",
  expires: "Bonus expiry",
  maxBet: "Maximum bet",
} as const;

type Terms = Partial<Record<keyof typeof labels, string>>;

// Add terms here once confirmed for the matching affiliate offer.
const termsByOffer: Partial<Record<string, Terms>> = {};

export default function BonusTerms({ offerId }: { offerId: string }) {
  const terms = termsByOffer[offerId];
  return (
    <>
      <dl>
        {(Object.keys(labels) as (keyof typeof labels)[]).map(field => (
          <div key={field} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
            <dt>{labels[field]}</dt>
            <dd style={{ margin: 0, textAlign: "right", color: "#c8d7e3" }}>{terms?.[field] ?? "Unconfirmed"}</dd>
          </div>
        ))}
      </dl>
      <p style={{ fontSize: 13, marginBottom: 0 }}>
        Check the terms on the offer page before claiming a bonus.
      </p>
    </>
  );
}

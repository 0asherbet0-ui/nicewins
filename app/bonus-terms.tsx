const detailsByOffer: Partial<Record<string, { minimum: string; methods: string; bonus?: string }>> = {
  winspirit: {
    minimum: "20 $ or €",
    methods: "Visa, Mastercard or Crypto",
    bonus: "100% for the 1st deposit + 100 FS",
  },
  slotoro: {
    minimum: "30 $ or €",
    methods: "Visa or Crypto",
  },
  coldbet: {
    minimum: "20 $ or €",
    methods: "Visa, Mastercard or Crypto",
  },
};

export default function OfferInfo({ offerId }: { offerId: string }) {
  const details = detailsByOffer[offerId];
  if (!details) return <p>Offer information is currently unavailable.</p>;

  return (
    <dl style={{ display: "grid", gap: 10, marginBottom: 0 }}>
      <div><dt>Minimum deposit</dt><dd style={{ margin: 0 }}>{details.minimum}</dd></div>
      <div><dt>Deposit method</dt><dd style={{ margin: 0 }}>{details.methods}</dd></div>
      {details.bonus && (
        <div><dt>Welcome bonus</dt><dd style={{ margin: 0 }}>{details.bonus}</dd></div>
      )}
    </dl>
  );
}

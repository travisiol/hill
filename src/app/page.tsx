import { HillStage } from "@/components/HillStage";
import { Rule } from "@/components/Rule";
import { Standing } from "@/components/Standing";
import { Faq } from "@/components/Faq";
import { Mark } from "@/components/Mark";
import { Label } from "@/components/ui/Label";
import { FEE_BPS, pct } from "@/lib/economics";
import { siteConfig } from "@/lib/site-config";

/*
 * Five open questions, on the page rather than only in the README.
 *
 * A launch page that lists nothing unresolved is either finished or lying, and
 * this one is not finished. None of these are stated as settled anywhere else
 * on the site — that is the rule they exist to enforce.
 */
const open = [
  "Where the fee is collected. The mechanic needs a pool whose fee can be routed to the module on every swap, and which venue that is has not been chosen.",
  "Total supply and how it is distributed at launch. A crown is only worth taking if the float is large enough that taking it costs something.",
  "Whether the fee is symmetric. It is written as one rate on both sides; a lower sell-side rate would make the top cheaper to abandon.",
  "How the project funds itself, if at all. There is no protocol cut in the fee path, and there is no other line in its place.",
  "The regulatory reading of a token that routes fees to a holder. Not settled, and not something a landing page settles.",
];

export default function Home() {
  return (
    <>
      {/* ---- hero --------------------------------------------------------- */}
      <section id="hill" className="mx-auto max-w-6xl px-4 pt-14 pb-6 sm:px-6 sm:pt-20">
        <div className="rise">
          <div className="flex flex-wrap items-center gap-3">
            <Label>[01] The hill</Label>
            <span className="type-label rounded-full border border-rule-strong px-2.5 py-1 text-ink-soft">
              {siteConfig.ticker}
            </span>
          </div>

          {/*
            Each sentence is its own inline-block, so the headline can only
            break between sentences. Left to itself it wrapped as "One tile.
            One hour. One / king." — a line ending on the article of the
            phrase it belongs to, which is the one break this headline must
            not make. Splitting on the sentence rather than hard-coding a
            <br> keeps it right if the tagline is ever reworded.
          */}
          <h1 className="type-display mt-6 max-w-[22ch] text-ink">
            {siteConfig.tagline
              .split(/(?<=\.)\s+/)
              .map((sentence) => (
                <span key={sentence} className="inline-block">
                  {sentence}&nbsp;
                </span>
              ))}
          </h1>

          <p className="type-sub mt-7 max-w-[58ch] text-ink-soft">
            One tile at the centre and nothing else to do. Hold more of{" "}
            {siteConfig.ticker} than anyone, take the crown, and every second you
            keep it is counted. Whoever held it longest when the hour ends takes{" "}
            <span className="text-ink">100% of that hour&apos;s fees</span> —{" "}
            {pct(FEE_BPS)} of everything traded, with nothing kept back.
          </p>
        </div>

        <HillStage />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rule-h" />
      </div>

      <Rule />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rule-h" />
      </div>

      <Standing />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rule-h" />
      </div>

      <Faq />

      {/* ---- open questions ----------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <Label>[05] Not decided yet</Label>
        <h2 className="type-head mt-4 max-w-[22ch] text-ink">
          Five things this project has not answered.
        </h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-[3px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {open.map((item, index) => (
            <li key={item} className="bg-field-lit p-5">
              <Label>{String(index + 1).padStart(2, "0")}</Label>
              <p className="type-body mt-3 text-ink-soft">{item}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- footer -------------------------------------------------------- */}
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="type-label text-ink">{siteConfig.name}</span>
            <span className="type-label text-ink-mute">{siteConfig.ticker}</span>
          </div>
          <p className="type-data max-w-[56ch] text-ink-mute">
            Nothing here is financial advice. {siteConfig.wordmark} is a game
            with an hourly payout and it should be treated as money you are
            willing to lose. No contract is deployed at the time of writing, and
            the page says so wherever a figure would otherwise appear.
          </p>
        </div>
      </footer>
    </>
  );
}

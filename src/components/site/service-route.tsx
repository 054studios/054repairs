import type { ReactNode } from "react";
import { RouteRail, RouteStop } from "@/components/ui/route";
import { BenchScene, BookingScene, DriveScene, HandoverScene } from "./illustrations";

export type StopScene = "boeken" | "rijden" | "repareren" | "terug";

const scenes: Record<StopScene, ReactNode> = {
  boeken: <BookingScene />,
  rijden: <DriveScene />,
  repareren: <BenchScene />,
  terug: <HandoverScene />,
};

export type ServiceStop = {
  scene: StopScene;
  title: string;
  body: ReactNode;
  // One concrete fact from the live settings, shown under the text.
  fact?: ReactNode;
};

// The signature: the route rail on the left, each stop with its text and its scene side by side.
export function ServiceRoute({ stops, headingLevel = 3 }: { stops: ServiceStop[]; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <RouteRail>
      {stops.map((stop) => (
        <RouteStop key={stop.scene}>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] md:items-start md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-16">
            <div className="max-w-[54ch]">
              <Heading className="font-display text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] text-steel-50 md:text-3xl">
                {stop.title}
              </Heading>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-steel-400 md:text-[1.0625rem]">
                {stop.body}
              </div>
              {stop.fact ? (
                <p className="figures mt-5 inline-flex rounded-ui bg-ink-850 px-3.5 py-2 text-sm leading-snug text-steel-300 ring-1 ring-line">
                  {stop.fact}
                </p>
              ) : null}
            </div>
            <div className="w-full max-w-[22rem] overflow-hidden rounded-panel bg-ink-900 ring-1 ring-line md:max-w-none">
              {scenes[stop.scene]}
            </div>
          </div>
        </RouteStop>
      ))}
    </RouteRail>
  );
}

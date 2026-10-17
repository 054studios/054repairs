import type { ReactNode } from "react";

// Authored scenes for the four stops of the service. One 1.5px stroke in steel, flat ink fills,
// cyan only where the light is. Styles live in the "Site sections" block of globals.css (.ill).
// Every scene uses the same fixed 4:3 viewBox, so nothing shifts while the page loads.

function Scene({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 320 240"
      aria-hidden="true"
      focusable="false"
      className="ill aspect-[4/3]"
    >
      {children}
    </svg>
  );
}

function Glow({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={id}>
        <stop offset="0" className="g0" />
        <stop offset="1" className="g1" />
      </radialGradient>
    </defs>
  );
}

// Stop 1: the booking on a phone, with the price and the route as progress.
export function BookingScene() {
  return (
    <Scene>
      <Glow id="ill-glow-book" />
      <ellipse
        cx="160"
        cy="120"
        rx="132"
        ry="108"
        fill="url(#ill-glow-book)"
        className="n"
      />
      <rect x="106" y="14" width="108" height="212" rx="22" className="f8 k" />
      <rect x="113" y="21" width="94" height="198" rx="16" className="f0 q" />
      <rect x="145" y="29" width="30" height="9" rx="4.5" className="f8 n" />
      <path d="M126 54H194" className="q" />
      <path d="M126 54H171" className="c" />
      <circle cx="126" cy="54" r="3.5" className="fc n" />
      <circle cx="148.5" cy="54" r="3.5" className="fc n" />
      <circle cx="171" cy="54" r="3.5" className="f0 c" />
      <circle cx="194" cy="54" r="3.5" className="f0 q" />
      <rect x="122" y="68" width="76" height="24" rx="7" className="f9 q" />
      <path d="M130 80h36" className="k" />
      <path d="M185 78.5l3 3 3-3" />
      <rect x="122" y="98" width="76" height="24" rx="7" className="f9 q" />
      <path d="M130 110h26" className="k" />
      <path d="M185 108.5l3 3 3-3" />
      <rect x="122" y="128" width="76" height="18" rx="6" className="f9 q" />
      <rect x="124" y="130" width="36" height="14" rx="4.5" className="f7 c" />
      <path d="M138 160.5a7.5 7.5 0 1 0 0 11" className="k" />
      <path d="M126 164h9M126 168h9" className="k" />
      <rect x="145" y="158" width="34" height="14" rx="4" className="fk n" />
      <rect x="182" y="158" width="12" height="7" rx="2.5" className="fs n" />
      <rect x="122" y="188" width="76" height="18" rx="9" className="fc n" />
    </Scene>
  );
}

// Stop 2: a route to the customer's location.
export function DriveScene() {
  return (
    <Scene>
      <Glow id="ill-location" />
      <circle
        cx="160"
        cy="120"
        r="104"
        fill="url(#ill-location)"
        className="n"
      />
      <path
        d="M32 182h78q24 0 24-24v-28q0-24 24-24h47"
        className="c"
        strokeDasharray="5 7"
      />
      <circle cx="32" cy="182" r="9" className="f8 c" />
      <path d="M188 188v-57l42-34 42 34v57z" className="f8 k" />
      <rect x="220" y="155" width="21" height="33" rx="3" className="f0 c" />
      <rect x="199" y="140" width="12" height="14" rx="2" className="fc n" />
      <path
        d="M230 79c-16-18-25-30-25-43a25 25 0 0 1 50 0c0 13-9 25-25 43z"
        className="f8 c"
      />
      <circle cx="230" cy="36" r="8" className="fc n" />
      <rect x="50" y="50" width="61" height="98" rx="12" className="f8 k" />
      <rect x="57" y="58" width="47" height="81" rx="7" className="f0 q" />
      <path d="M69 99l8 8 16-18" className="c" />
    </Scene>
  );
}

// Stop 3: the repair. An opened iPhone under the work lamp, the new screen folding in.
export function BenchScene() {
  return (
    <Scene>
      <Glow id="ill-glow-bench" />
      <path d="M0 30Q160 0 320 30" className="q" />
      <rect x="252" y="38" width="54" height="44" rx="11" className="f0 q" />
      <circle cx="266" cy="52" r="1.2" className="fs n" />
      <circle cx="288" cy="66" r="1" className="fs n" />
      <circle cx="294" cy="50" r="1.2" className="fs n" />
      <rect x="0" y="178" width="320" height="62" className="f9 n" />
      <path d="M0 178H320" className="k" />
      <path d="M103 64l35-5 44 119H74z" className="fb" />
      <rect x="88" y="76" width="70" height="102" rx="12" className="f8 k" />
      <rect x="96" y="84" width="22" height="12" rx="4" className="f9 q" />
      <rect x="96" y="102" width="34" height="66" rx="5" className="f9 q" />
      <path d="M105 128h16M108 136h10" className="q" />
      <rect x="136" y="84" width="14" height="84" rx="3" className="f7 q" />
      <rect x="139" y="90" width="8" height="6" rx="1.5" className="fc n" />
      <g transform="rotate(-12 206 112)">
        <rect x="172" y="61" width="68" height="102" rx="12" className="f0 c" />
        <rect
          x="178"
          y="67"
          width="56"
          height="90"
          rx="8"
          fill="url(#ill-glow-bench)"
          className="n"
        />
      </g>
      <path d="M167 95c-7-1-13-2-20-2" className="c" />
      <path d="M214 172h20" className="k" />
      <rect x="234" y="167" width="32" height="10" rx="4" className="f8 k" />
      <rect x="22" y="170" width="30" height="8" rx="3" className="f8 k" />
      <path d="M37 170l15-66 64-60" className="k" />
      <circle cx="52" cy="104" r="4" className="f8 k" />
      <path d="M108 42l20-4 10 20-36 6z" className="f8 k" />
      <path d="M104.5 63.2l32-5.2" className="c" />
    </Scene>
  );
}

// Stop 4: the repaired phone back in your hand.
export function HandoverScene() {
  return (
    <Scene>
      <Glow id="ill-glow-hand" />
      <circle
        cx="160"
        cy="104"
        r="100"
        fill="url(#ill-glow-hand)"
        className="n"
      />
      <path
        d="M112 240c-2-22-4-46 4-62 8-14 24-20 44-20s38 6 46 20c8 16 6 40 4 62z"
        className="f7 k"
      />
      <rect x="118" y="30" width="84" height="150" rx="17" className="f8 k" />
      <rect x="124" y="36" width="72" height="138" rx="12" className="f0 q" />
      <rect x="149" y="43" width="22" height="7" rx="3.5" className="f8 n" />
      <circle cx="160" cy="98" r="17" className="c" />
      <path d="M152 98.5l6 6 11-12" className="c" />
      <path d="M140 134h40M147 144h26" className="q" />
      <rect x="104" y="100" width="22" height="14" rx="7" className="f7 k" />
      <rect x="102" y="118" width="24" height="14" rx="7" className="f7 k" />
      <rect x="104" y="136" width="22" height="14" rx="7" className="f7 k" />
      <rect x="108" y="154" width="18" height="13" rx="6.5" className="f7 k" />
      <rect
        x="190"
        y="120"
        width="16"
        height="44"
        rx="8"
        transform="rotate(-28 198 142)"
        className="f7 k"
      />
    </Scene>
  );
}

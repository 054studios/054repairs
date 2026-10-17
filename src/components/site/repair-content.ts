export const repairPages = [
  {
    slug: "scherm-vervangen",
    title: "iPhone scherm vervangen",
    match: "scherm|display",
    intro:
      "Een gebarsten scherm, strepen in beeld of een touchscreen dat niet goed reageert? Bekijk welke schermreparatie beschikbaar is voor jouw iPhone.",
    explanation:
      "Schade aan het glas en problemen met beeld of aanraking kunnen verschillende oorzaken hebben. Geef bij je boeking aan wat je ziet en of je iPhone is gevallen. Bij twijfel kun je eerst contact opnemen.",
    preparation:
      "Maak als dat nog lukt een back-up. Noteer problemen met beeld of aanraking, zodat we die vooraf kunnen bespreken. Deel je toegangscode niet via e-mail of telefoon.",
  },
  {
    slug: "batterij-vervangen",
    title: "iPhone batterij vervangen",
    match: "batterij|accu",
    intro:
      "Is je iPhone snel leeg of valt hij onverwacht uit? Bekijk de beschikbare batterijreparaties en prijzen per model.",
    explanation:
      "Een versleten batterij kan invloed hebben op de gebruiksduur. Kijk bij Instellingen > Batterij > Batterijconditie en opladen welke melding je iPhone geeft. Ook apps of instellingen kunnen extra stroom verbruiken; beschrijf daarom je klacht.",
    preparation:
      "Maak vooraf een back-up en geef de klacht door bij je boeking. Bij twijfel over de oorzaak kun je eerst contact met ons opnemen.",
  },
  {
    slug: "laadpoort-repareren",
    title: "iPhone laadpoort repareren",
    match: "laadpoort|oplaadpoort|laadconnector",
    intro:
      "Laadt je iPhone niet goed op of maakt de kabel geen goede verbinding? Bekijk de beschikbare laadpoortreparaties voor jouw model.",
    explanation:
      "Laadproblemen kunnen door de laadpoort komen, maar ook door een kabel, adapter of batterij. Geef aan welke kabels je hebt geprobeerd en wat je iPhone doet als je hem aansluit. Bij twijfel kun je eerst contact opnemen.",
    preparation:
      "Maak vooraf een back-up. Noteer of je iPhone nog draadloos kan laden en of er een melding verschijnt wanneer je de kabel aansluit. Vermeld dit bij je boeking.",
  },
] as const;
export function repairPage(slug: string) {
  return repairPages.find((page) => page.slug === slug);
}

/**
 * Supplied editorial photographs, matched only to scenes they actually depict.
 * If there is no suitable supplied photograph, the UI shows an empty state instead of
 * substituting generated artwork or an unrelated photograph. User uploads are never replaced.
 */
export const editorialPhotos: Record<string, { slug: string; alt: string }> = {
  "kitchen-1947": { slug: "flour-kitchen", alt: "A mother and child making pastry together in a flour-dusted kitchen." },
  "breadboard-1947": { slug: "flour-breadboard", alt: "A flour-dusted breadboard in a kitchen in Portland." },
  "harbor-1952": { slug: "winter-harbor", alt: "Boats moored in Portland Harbor under a grey winter sky." },
  "ferry-1934": { slug: "harbor-ferry", alt: "A harbor ferry beside a timber dock, with the town beyond." },
  "lighthouse-1950s": { slug: "lighthouse-family", alt: "A family sitting on coastal rocks below a lighthouse." },
  "house-1979": { slug: "maple-house", alt: "A family home shaded by a mature maple tree." },
  "road-1983": { slug: "roadside-wagon", alt: "A station wagon parked beside an open Nebraska road." },
  "bookshop-1989": { slug: "london-bookshop", alt: "A quiet bookshop lined with shelves and well-loved books." },
  "window-1961": { slug: "boston-suitcase", alt: "A blue suitcase beside a window overlooking Boston rooftops." },
  "rooftops-1998": { slug: "florence-rooftops", alt: "Terracotta rooftops and a cathedral dome in Florence." },
  "rooftops-2000": { slug: "florence-rooftops", alt: "Terracotta rooftops and a cathedral dome in Florence." },
  "radio-1949": { slug: "valve-radio", alt: "A valve radio on a repair bench beside tools and circuit drawings." },
  "classroom-1966": { slug: "physics-classroom", alt: "Afternoon light falling across a physics classroom." },
  "pie-1979": { slug: "apple-pie", alt: "A lattice-topped apple pie cooling beside a sunny kitchen window." },
  "kitchen-1950": { slug: "kneading-dough", alt: "A mother kneading dough while her daughter watches at the kitchen table." },
  "nursery-1968": { slug: "nursery-mobile", alt: "A delicate balsa sailboat mobile beside a nursery window." },
  "table-2019": { slug: "november-supper", alt: "Three generations gathered for a November supper." },
  "backyard-2010": { slug: "backyard-rope-swing", alt: "A rope swing hanging in a leafy summer backyard." },
  "bookshop-1998": { slug: "charles-bookshop", alt: "Autumn light in a bookshop on Charles Street." },
  "letter-1958": { slug: "folded-letter", alt: "A folded letter resting on a wool coat." },
  "shells-1972": { slug: "red-bucket-cove", alt: "A red bucket on the rocky shore of a Maine cove." },
  "gallery-1976": { slug: "handmade-blue-bowl", alt: "A handmade blue ceramic bowl in a light-filled loft." },
  "blanket-2005": { slug: "baby-blanket", alt: "A folded baby blanket beside a window." },
  "pancakes-2016": { slug: "morning-pancakes", alt: "Homemade pancakes with butter and syrup in the morning light." },
  "bluebowl-2022": { slug: "sea-glass-bowl", alt: "Sea glass and notes collected in a cobalt bowl beside the sea." },
  "canoe-1979": { slug: "misty-canoe", alt: "A weathered canoe beside a misty lake in Maine." },
  "canoe-1985": { slug: "canoe-lesson", alt: "A father teaching his son to paddle a canoe in Acadia." },
  "dock-2018": { slug: "tiny-fish", alt: "A father and son releasing a small fish beside the water." },
  "pancakes-2012": { slug: "sunday-pancakes", alt: "A stack of homemade pancakes with syrup and melting butter." },
  "rocker-1985": { slug: "cherrywood-rocker", alt: "A handmade cherrywood rocking chair." },
  "letter-1952": { slug: "montreal-letter", alt: "A handwritten letter from Montreal with its stamped envelope." },
  "letters-1952": { slug: "montreal-letter", alt: "A handwritten Montreal letter beside a fountain pen." },
  "dance-2007": { slug: "kitchen-dance", alt: "A couple slow-dancing barefoot in their kitchen." },
  "birthday-2018": { slug: "birthday-friends", alt: "Friends gathered around a birthday table, photographed with flash." },
  "table-2020": { slug: "kitchen-stories", alt: "A family sharing stories around the kitchen table." },
  "station-1958": { slug: "new-england-platform", alt: "A quiet train platform in New England." },
  "cafe-1963": { slug: "physics-coffee", alt: "Two mismatched coffee cups beside a physics diagram on a napkin." },
  "cliffs-1983": { slug: "pacific-dusk", alt: "Pacific coast cliffs at dusk." },
  "kiln-1986": { slug: "garage-kiln", alt: "The warm glow of a pottery kiln in a garage." },
  "garden-1992": { slug: "paris-garden-bench", alt: "A quiet bench in a Paris church garden." },
  "porch-2024": { slug: "porch-margaret", alt: "A woman sitting on a porch on the Maine coast." },
  "nightlight-2005": { slug: "nursery-lamplight", alt: "A nursery lit by a small lamp at night." },
  "nightlight-2004": { slug: "first-night-home", alt: "A family's quiet first night home with a baby." },
  "roadtrip-2003": { slug: "nova-scotia-drive", alt: "A coastal drive through Nova Scotia." },
  "porch-2025": { slug: "maine-coffee", alt: "Quiet coffee together on the Maine coast." },
  "umbrella-1965": { slug: "rainy-wedding", alt: "A couple beneath a red umbrella on a rainy wedding day." },
  "lemons-1998": { slug: "florentine-lemons", alt: "Three lemons in a handmade Florentine pottery bowl." },
  "workshop-2013": { slug: "quiet-woodshop", alt: "A quiet woodshop with a bandsaw and an empty chair." },
  "portrait-margaret": { slug: "porch-margaret", alt: "A woman seated on a porch beside the Maine coast." },
  "portrait-thomas": { slug: "thomas-workbench", alt: "A man working at a well-used workbench." },
  "portrait-sarah": { slug: "sarah-kitchen-window", alt: "A woman standing by the kitchen window." },
};

export const editorialPhotoUrl = (slug: string) =>
  `${import.meta.env.BASE_URL}media/editorial/${slug}.webp`;

export function photoForPlate(plateId: string) {
  const photo = editorialPhotos[plateId];
  return photo ? { ...photo, url: editorialPhotoUrl(photo.slug) } : undefined;
}

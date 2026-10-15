import { readdir, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = fileURLToPath(new URL("../../../attached_assets/", import.meta.url));
const target = fileURLToPath(new URL("../public/media/editorial/", import.meta.url));
const photos: Record<string, string> = {
  "1934_Portland_Harbor_Ferry_": "harbor-ferry",
  "1947_flour-dusted_kitchen_still_life_": "flour-kitchen",
  "1949_valve_radio_workbench_": "valve-radio",
  "1950s_Cape_Elizabeth_Lighthouse_in_Sea_Fog_": "lighthouse-family",
  "1979_Apple_Pie_by_the_Window_": "apple-pie",
  "1979_Arlington_House_Under_a_Maple_Tree_": "maple-house",
  "1983_Nebraska_Roadside_Station_Wagon_": "roadside-wagon",
  "1989_Family_Picnic_in_the_Park_": "family-picnic",
  "1997_Christmas_dinner_with_three_generations_": "christmas-dinner",
  "A_Quiet_1989_London_Bookshop_": "london-bookshop",
  "A_Walnut_Box_of_Memories_": "walnut-keepsake",
  "Afternoon_Light_in_a_1966_Physics_Classroom_": "physics-classroom",
  "Arlington_Family_Home,_1979_": "arlington-home",
  "Autumn_Light_in_a_Charles_Street_Bookshop_": "charles-bookshop",
  "Balsa_sailboat_mobile_by_nursery_window_": "nursery-mobile",
  "Barefoot_slow_dance_in_the_kitchen_": "kitchen-dance",
  "Blue_suitcase_above_Boston_rooftops_": "boston-suitcase",
  "Blue_suitcase_over_Boston_rooftops_": "boston-rooftops",
  "Cobalt_Bowl,_Sea_Glass,_and_Notes_": "sea-glass-bowl",
  "Colette's_1952_Montreal_letter_": "montreal-letter",
  "Crooked_Pancakes_in_Morning_Light_": "morning-pancakes",
  "Dad_and_daughter’s_first_ride_": "first-bike-ride",
  "Eleanor_and_Margaret_knead_dough_": "kneading-dough",
  "Faded_Canoe_on_a_Misty_Maine_Lake_": "misty-canoe",
  "Family_dash_from_a_wave_": "family-wave",
  "Family_Keepsakes_in_Morning_Light_": "family-keepsakes",
  "Family_stories_at_the_kitchen_table_": "kitchen-stories",
  "Father_and_son_release_a_tiny_fish_": "tiny-fish",
  "Father_and_Son's_Acadia_Canoe_Lesson_": "canoe-lesson",
  "Flash-lit_friends_around_a_birthday_table_": "birthday-friends",
  "Florence_rooftops_and_cathedral_dome_": "florence-rooftops",
  "Flour-Dusted_Breadboard,_Portland_1947_": "flour-breadboard",
  "Folded_baby_blanket_by_the_window_": "baby-blanket",
  "Folded_Letter_on_a_Wool_Coat_": "folded-letter",
  "Grandmother_and_Granddaughter_Mend_Denim_": "mending-denim",
  "Grandmother_and_Grandson_Share_a_Keepsake_Surprise_": "keepsake-surprise",
  "Handmade_blue_bowl_in_a_1976_loft_": "handmade-blue-bowl",
  "Handmade_Cherrywood_Rocking_Chair,_1985_": "cherrywood-rocker",
  "Hands_Folding_a_Family_Letter_": "letter-hands",
  "Joyful_1972_Family_Moment_on_Maine_Coast_": "maine-family-1972",
  "Lamp-lit_nursery_at_night_": "nursery-lamplight",
  "Laughter_on_the_City_Ferry_": "city-ferry-laughter",
  "Margaret_Ellis_family_storybook_": "family-storybook",
  "Margaret_on_the_Maine_Porch_": "porch-margaret",
  "Mismatched_Cups_and_a_Physics_Napkin_": "physics-coffee",
  "Morning_Bread_in_the_Maine_Kitchen_": "morning-bread",
  "Morning_coffee_over_Florence_": "florence-coffee",
  "Nebraska_roadside_station_wagon,_1983_": "nebraska-wagon",
  "Nova_Scotia_Coastal_Drive,_2003_": "nova-scotia-drive",
  "Old_photos,_shared_family_memories_": "shared-family-photos",
  "Pacific_Cliffs_at_Dusk,_1983_": "pacific-dusk",
  "Pacific_Coast_cliffs_in_evening_mist_": "pacific-mist",
  "Portland_Harbor_in_Winter,_1952_": "winter-harbor",
  "Quiet_1958_New_England_train_platform_": "new-england-platform",
  "Quiet_Bench_in_a_Paris_Church_Garden_": "paris-garden-bench",
  "Quiet_coffee_on_the_Maine_coast_": "maine-coffee",
  "Quiet_first_night_home_": "first-night-home",
  "Quiet_Kiln_Glow_in_the_Garage_": "garage-kiln",
};
await mkdir(target, { recursive: true });
const files = await readdir(source);
await Promise.all(Object.entries(photos).map(async ([prefix, slug]) => {
  const file = files.find(name => name.startsWith(prefix));
  if (!file) throw new Error(`Missing supplied photo: ${prefix}`);
  const input = sharp(`${source}/${file}`).rotate();
  await input.clone().resize({ width: 1440, withoutEnlargement: true }).webp({ quality: 86, effort: 5 }).toFile(`${target}/${slug}.webp`);
  await input.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(`${target}/${slug}-small.webp`);
}));
console.log(`Optimized ${Object.keys(photos).length} supplied photos in two sizes.`);

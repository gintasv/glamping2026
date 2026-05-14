// Camping checklist — parsed from the user's Group / Sub-Group / Item structure.
// Each item has a stable id used as the Firestore claim key.
//
// Item flags:
//   shared:    true = "one for the whole group" (e.g. axe). Highlighted to discourage doubling up.
//   perFamily: true = "each family brings their own" (e.g. sleeping bags, toothbrush). Hidden from "unclaimed" filter by default.
//   essential: true = safety/critical (first aid, medicine, headlamps).
//
// Items not flagged are "normal" — claiming is optional, multiple families can claim.

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function item(name, opts = {}) {
  return { name, ...opts };
}

const CHECKLIST = [
  {
    group: "Shelter & Bedding",
    subgroups: [
      {
        name: "Main Shelter",
        items: [item("tent", { perFamily: true })],
      },
      {
        name: "Shelter Accessories",
        items: [
          item("canopy", { shared: true }),
          item("beach half tent", { shared: true }),
          item("tent stakes", { perFamily: true }),
          item("extra tent for kids to play or storage", { shared: true }),
          item("tarp"),
          item("umbrella"),
          item("entry mat", { perFamily: true }),
        ],
      },
      {
        name: "Sleeping Gear",
        items: [
          item("mattress", { perFamily: true }),
          item("mattress pump", { shared: true }),
          item("bedding or sleeping bags", { perFamily: true }),
          item("pillows", { perFamily: true }),
          item("hammock"),
        ],
      },
      {
        name: "Furniture",
        items: [
          item("camping chairs", { perFamily: true }),
          item("camping tables"),
          item("night stand"),
          item("table cloth"),
        ],
      },
      {
        name: "Cleaning Supplies",
        items: [item("small brush", { shared: true }), item("broom", { shared: true })],
      },
    ],
  },
  {
    group: "Lighting & Power",
    subgroups: [
      {
        name: "Lighting",
        items: [item("camping lights"), item("lanterns"), item("light poles", { shared: true })],
      },
      {
        name: "Power Supply",
        items: [
          item("AA and AAA batteries"),
          item("power inverter", { shared: true }),
          item("Ryobi battery", { shared: true }),
          item("chargers", { perFamily: true }),
          item("power banks", { perFamily: true }),
          item("extension cords", { shared: true }),
        ],
      },
    ],
  },
  {
    group: "Entertainment & Comfort",
    subgroups: [
      {
        name: "Entertainment",
        items: [
          item("camping decorations"),
          item("frisbee", { shared: true }),
          item("soccer ball, volleyball, etc"),
          item("playing cards", { shared: true }),
          item("boombox / audio system", { shared: true }),
          item("kite", { shared: true }),
          item("fire color packets", { shared: true }),
          item("volleyball net & volleyball", { shared: true }),
        ],
      },
    ],
  },
  {
    group: "Emergency & Tools",
    subgroups: [
      {
        name: "Miscellaneous",
        items: [
          item("axe", { shared: true, essential: true }),
          item("firestarter", { essential: true }),
          item("local firewood"),
          item("jumping cable", { shared: true, essential: true }),
          item("medicine", { perFamily: true, essential: true }),
          item("first aid kit", { essential: true }),
          item("rope or paracord", { shared: true, essential: true }),
          item("bear spray", {
            shared: true,
            note: "Devil's Lake has no bears typical — optional.",
          }),
        ],
      },
    ],
  },
  {
    group: "Cooking & Eating",
    subgroups: [
      {
        name: "Cooking Equipment",
        items: [
          item("stove"),
          item("grill", { shared: true }),
          item("toaster", { shared: true }),
          item("propane"),
          item("grilling equipment"),
          item("french press", { shared: true }),
          item("cutting board"),
          item("spatula"),
          item("can opener", { shared: true }),
          item("bottle opener", { shared: true }),
          item("sponge/scrubber"),
          item("Ziploc bags / food storage"),
          item("aluminum foil"),
          item("oven mitts"),
          item("kettle", { shared: true }),
          item("tongs"),
          item("sugar, salt, pepper"),
          item("lighter", { essential: true }),
        ],
      },
      {
        name: "Coolers & Ice",
        items: [item("coolers"), item("ice"), item("camping fridge", { shared: true })],
      },
      {
        name: "Eating Utensils",
        items: [
          item("coffee mugs", { perFamily: true }),
          item("forks", { perFamily: true }),
          item("knives", { perFamily: true }),
          item("spoons", { perFamily: true }),
          item("plates", { perFamily: true }),
          item("bowls", { perFamily: true }),
        ],
      },
      {
        name: "Food & Beverages",
        items: [
          item("coffee & coffee bean grinder"),
          item("tea"),
          item("water jug"),
          item("water jug pump", { shared: true }),
          item("cereal"),
          item("marshmallows"),
          item("s'mores crackers"),
          item("chocolate (for s'mores)"),
          item("eggs"),
          item("bagels"),
          item("potato chips"),
          item("water & mineral water"),
          item("beer & wine"),
          item("hard liquor"),
          item("juice for kids and adults"),
          item("snacks (trail mix, granola)"),
          item("bananas"),
          item("milk"),
          item("blueberries"),
          item("butter"),
        ],
      },
      {
        name: "Condiments & Extras",
        items: [item("cooking oil"), item("ketchup"), item("pickles"), item("peppers")],
      },
      {
        name: "Cleaning Supplies",
        items: [item("dish soap"), item("cleaning towels"), item("paper towels"), item("trash bags")],
      },
      {
        name: "Miscellaneous",
        items: [
          item("napkins"),
          item("torch"),
          item("mosquito screens for food"),
        ],
      },
    ],
  },
  {
    group: "Clothing",
    note: "Per family — bring your own. Listed here as a reminder.",
    perFamilyGroup: true,
    subgroups: [
      {
        name: "Tops",
        items: [item("T-shirts", { perFamily: true }), item("long sleeve shirts", { perFamily: true })],
      },
      {
        name: "Bottoms",
        items: [item("pants/jeans", { perFamily: true }), item("shorts", { perFamily: true })],
      },
      {
        name: "Outerwear",
        items: [
          item("sunglasses", { perFamily: true }),
          item("hats", { perFamily: true }),
          item("jackets", { perFamily: true }),
          item("raincoats/ponchos", { perFamily: true }),
          item("sweaters/hoodies", { perFamily: true }),
          item("thermal wear", { perFamily: true }),
        ],
      },
      {
        name: "Swimwear",
        items: [item("swimwear", { perFamily: true })],
      },
      {
        name: "Footwear",
        items: [
          item("flip flops", { perFamily: true }),
          item("hiking boots/shoes", { perFamily: true }),
          item("sandals/flip flops", { perFamily: true }),
          item("rain boots", { perFamily: true }),
          item("water shoes", { perFamily: true, essential: true }),
        ],
      },
      {
        name: "Accessories",
        items: [
          item("socks", { perFamily: true }),
          item("underwear", { perFamily: true }),
          item("hat/caps", { perFamily: true }),
          item("gloves", { perFamily: true }),
          item("scarf", { perFamily: true }),
          item("sleepwear", { perFamily: true }),
          item("bandanas", { perFamily: true }),
          item("belts", { perFamily: true }),
          item("towels", { perFamily: true }),
          item("headlamp", { perFamily: true, essential: true }),
          item("backpack", { perFamily: true }),
          item("lip balm", { perFamily: true }),
        ],
      },
    ],
  },
  {
    group: "Cleaning & Hygiene",
    subgroups: [
      {
        name: "Personal Care",
        items: [
          item("sunburn lotion - aloe", { perFamily: true }),
          item("sunscreen", { perFamily: true, essential: true }),
          item("shampoo", { perFamily: true }),
          item("hand sanitizer"),
          item("soap", { perFamily: true }),
          item("toothpicks"),
          item("toothpaste", { perFamily: true }),
          item("toothbrush", { perFamily: true }),
          item("makeup", { perFamily: true }),
          item("hygiene products", { perFamily: true }),
        ],
      },
      {
        name: "Toiletries",
        items: [item("toilet paper"), item("wet wipes"), item("tissue paper")],
      },
      {
        name: "Health & Safety",
        items: [
          item("mosquito repellent", { perFamily: true, essential: true }),
          item("mosquito anti-itch cream", { essential: true }),
        ],
      },
      {
        name: "Camping Supplies",
        items: [
          item("small vacuum for sand in tent", { shared: true }),
          item("poncho", { perFamily: true }),
        ],
      },
    ],
  },
];

// Build flat list with stable ids for storage/sync.
const CHECKLIST_FLAT = [];
CHECKLIST.forEach((g) => {
  g.subgroups.forEach((sg) => {
    sg.items.forEach((it) => {
      const id = `${slug(g.group)}.${slug(sg.name)}.${slug(it.name)}`;
      CHECKLIST_FLAT.push({
        id,
        group: g.group,
        subgroup: sg.name,
        ...it,
      });
    });
  });
});

window.CHECKLIST = CHECKLIST;
window.CHECKLIST_FLAT = CHECKLIST_FLAT;

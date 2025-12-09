export const LOCAL_WORDS = new Set<string>([
  'APPLE', 'ANGLE', 'ACT', 'ARC', 'AREA', 'ART', 'ASK', 'AXIS', 'ABLE', 'ACID', 'ALERT', 'ALGAE',
  'BARN', 'BASIC', 'BATTLE', 'BREAD', 'BRAVE', 'BRIGHT', 'BREEZE', 'BRICK', 'BRISK', 'BROWN', 'BRAIN', 'BRANCH',
  'CALM', 'CANDY', 'CANAL', 'CART', 'CAST', 'CAVE', 'CHARM', 'CHART', 'CHASE', 'CHEER', 'CHEST', 'CHILL', 'CHIME', 'CHOIR',
  'CIDER', 'CIVIC', 'CLASH', 'CLAY', 'CLEAR', 'CLIFF', 'CLIMB', 'CLOUD', 'COAST', 'COBALT', 'COMET', 'COIN', 'COLD', 'CONE',
  'CONE', 'COPPER', 'CORAL', 'CRAFT', 'CRANE', 'CRASH', 'CRATE', 'CREST', 'CRISP', 'CROWN', 'CYCLE',
  'DANCE', 'DAWN', 'DREAM', 'DRIFT', 'DROPLET', 'DROOP', 'DUSK', 'DUST', 'DWELL', 'DAISY', 'DEPTH', 'DECK', 'DEEP',
  'EAGER', 'EAGLE', 'EARTH', 'ECHO', 'ELM', 'EMBER', 'EMBER', 'EMBLEM', 'EMPTY', 'ENTER', 'EPOCH', 'EQUAL', 'ETHER', 'EVENT',
  'FAIR', 'FABLE', 'FIELD', 'FLAME', 'FLASH', 'FLARE', 'FLOAT', 'FLORA', 'FOAM', 'FOCUS', 'FORGE', 'FORCE', 'FROST', 'FRAME',
  'GLADE', 'GLASS', 'GLEAM', 'GLIDE', 'GLOW', 'GRACE', 'GRAND', 'GRASS', 'GRAVITY', 'GREEN', 'GRIT', 'GROVE',
  'HARBOR', 'HARMONY', 'HAZE', 'HEART', 'HELIX', 'HERO', 'HILL', 'HOLLOW', 'HONEY', 'HORIZON', 'HORN', 'HOVER',
  'ICICLE', 'ICON', 'IDEA', 'IMAGE', 'INLET', 'INPUT', 'IRON', 'ISLE', 'IVY', 'ITEM',
  'JAZZ', 'JADE', 'JELLY', 'JET', 'JOLT', 'JUMP', 'JUNGLE',
  'KIN', 'KING', 'KITE', 'KNACK', 'KNIT', 'KNOB', 'KNOT',
  'LACE', 'LAKE', 'LANTERN', 'LATCH', 'LAYER', 'LEAF', 'LENS', 'LEVEL', 'LIGHT', 'LILY', 'LINE', 'LINK', 'LOOP', 'LOFT', 'LUNAR',
  'MAGIC', 'MAPLE', 'MARBLE', 'MARCH', 'MARINA', 'MEADOW', 'METAL', 'METEOR', 'MICA', 'MIGHT', 'MINT', 'MIST', 'MOMENT', 'MORPH',
  'NEST', 'NEON', 'NEW', 'NIGHT', 'NOBLE', 'NOISE', 'NORTH', 'NOVA', 'NURSE',
  'OAK', 'OASIS', 'OBSIDIAN', 'OCEAN', 'OLIVE', 'OMEGA', 'ONYX', 'OPAL', 'ORBIT', 'ORCHID',
  'PALM', 'PANEL', 'PAUSE', 'PEAK', 'PEARL', 'PEBBLE', 'PEPPER', 'PHASE', 'PILOT', 'PINCH', 'PIXEL', 'PLANE', 'PLANT', 'PLATE',
  'PLUME', 'POEM', 'POINT', 'POISE', 'POLAR', 'PRISM', 'PULSE',
  'QUARTZ', 'QUEEN', 'QUEST', 'QUIET', 'QUILL', 'QUILT',
  'RANCH', 'RANGE', 'RAPID', 'RAY', 'REACH', 'REACT', 'REED', 'REEL', 'RHYME', 'RICE', 'RIDGE', 'RIFT', 'RING', 'RIVER', 'ROAM',
  'ROCK', 'ROOF', 'ROOT', 'ROSE', 'ROUND', 'ROUTE',
  'SAGE', 'SAIL', 'SALT', 'SAND', 'SCARF', 'SCENE', 'SCOPE', 'SCOUT', 'SCROLL', 'SEA', 'SHELL', 'SHIFT', 'SHINE', 'SHORE', 'SILK',
  'SING', 'SKY', 'SLATE', 'SLICE', 'SMOKE', 'SNAP', 'SNOW', 'SOLAR', 'SONG', 'SOUND', 'SPARK', 'SPEAR', 'SPELL', 'SPIRE', 'SPIRIT',
  'SPORE', 'SPRING', 'STONE', 'STORM', 'STREAM', 'STRUM', 'SURGE', 'SWIRL',
  'TALON', 'TANGENT', 'TAR', 'TASTE', 'TETHER', 'THEME', 'THORN', 'THRIVE', 'THRUM', 'TIDE', 'TILT', 'TONE', 'TOWER', 'TRACE',
  'TRACK', 'TREASURE', 'TREE', 'TRIAL', 'TRIBE', 'TRUNK', 'TWIG', 'TWIST',
  'UMBRA', 'UNION', 'UNITY', 'URBAN', 'URGE',
  'VAULT', 'VEIN', 'VELVET', 'VEST', 'VINE', 'VIOLET', 'VISION', 'VIVID', 'VOICE', 'VOID',
  'WAVE', 'WEAVE', 'WHISPER', 'WIDE', 'WIND', 'WING', 'WISP', 'WONDER', 'WOOD', 'WOOL', 'WORLD', 'WRAP',
  'XENON', 'XRAY', 'XYLOPHONE',
  'YARN', 'YEARN', 'YELL', 'YONDER',
  'ZANY', 'ZEAL', 'ZEN', 'ZEST', 'ZINC', 'ZONAL'
])

const EXTENDED_ONLY = [
  'ALLOY',
  'BLADE',
  'CIPHER',
  'DUNES',
  'EMBERLY',
  'FAUNA',
  'GARNET',
  'HABITAT',
  'ION',
  'JUNCTION',
  'KERNEL',
  'LAGOON',
  'MOMENTUM',
  'NUTRIENT',
  'OBELISK',
  'PANGRAM',
  'QUORUM',
  'RESONANCE',
  'SAPPHIRE',
  'TUNDRA',
  'ULTRASONIC',
  'VERVE',
  'WALNUT',
  'YONDERING',
  'ZENITH'
]

export type DictionarySource = 'local' | 'extended'

const DICTIONARY_SOURCES: Record<DictionarySource, Set<string>> = {
  local: LOCAL_WORDS,
  extended: new Set<string>([...LOCAL_WORDS, ...EXTENDED_ONLY.map((word) => word.toUpperCase())])
}

export function getDictionary(source: DictionarySource = 'local'): Set<string> {
  return DICTIONARY_SOURCES[source] ?? LOCAL_WORDS
}

export function isValidWord(word: string, source: DictionarySource = 'local'): boolean {
  return getDictionary(source).has(word.toUpperCase())
}

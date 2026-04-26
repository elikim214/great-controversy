// ============================================================
// The Great Controversy: A Last Day ADVENTure Game
// Famous missionaries data for avatar/identity assignment
// ============================================================

export interface Missionary {
  id: string;
  name: string;
  years: string;
  region: string;
  bio: string;
  avatarSeed: string;
  photoUrl: string;
}

const AVATAR_PALETTES = [
  { bg: '#1a1a3e', accent: '#d4a843' },
  { bg: '#1e2d3d', accent: '#5bb8f5' },
  { bg: '#2d1a2e', accent: '#e07baf' },
  { bg: '#1a2e1a', accent: '#6bcf6b' },
  { bg: '#2e2a1a', accent: '#e8c85a' },
  { bg: '#1a2a2e', accent: '#5be0d0' },
  { bg: '#2e1a1a', accent: '#e06b5b' },
  { bg: '#1e1a2e', accent: '#a07be0' },
  { bg: '#1a2e24', accent: '#7be0a0' },
  { bg: '#2e2420', accent: '#e0a86b' },
  { bg: '#1a1e2e', accent: '#7bb8e0' },
  { bg: '#2a1a2e', accent: '#d07be0' },
  { bg: '#202e1a', accent: '#b8e05b' },
  { bg: '#2e1e1a', accent: '#e0935b' },
  { bg: '#1a2e2e', accent: '#5be0e0' },
];

const AVATAR_SYMBOLS = [
  'M20 6l2 14-2 2-2-2zm0 28l-2-14 2-2 2 2zM6 20l14-2 2 2-2 2zm28 0l-14 2-2-2 2-2z',
  'M20 4C14 4 8 8 8 8v14c0 8 12 14 12 14s12-6 12-14V8s-6-4-12-4zm0 4a2 2 0 110 4 2 2 0 010-4zm-4 8h8v2h-8z',
  'M20 4c0 0-8 10-8 18a8 8 0 0016 0c0-3-1.5-5-3-7 0 3-2 5-5 5s-4-3-4-5c0-4 4-8 4-11z',
  'M20 4l4.5 11.5H36l-9.3 6.8 3.5 11.2L20 26.5l-10.2 7L13.3 22.3 4 15.5h11.5z',
  'M4 34l10-22 4 8 2-4 2 4 4-8L36 34zm16-22l2 4-2 4-2-4z',
  'M10 24c0-6 4-12 10-16 2 4 6 8 12 8-2 4-6 8-10 8h8c-4 4-10 8-16 8-4 0-6-2-6-4s1-3 2-4z',
  'M18 8h4v10h10v4H22v10h-4V22H8v-4h10zm-8-2l4 4m24-4l-4 4M10 34l4-4m16 4l-4-4',
  'M8 28V16l5 6 7-12 7 12 5-6v12zm2-14l-2-4m22 4l2-4M20 8V4',
  'M20 8a3 3 0 100-6 3 3 0 000 6zm0 0v22m0 0c-6 0-10-4-12-10h4m8 10c6 0 10-4 12-10h-4M16 12h8',
  'M14 34l4-12 2 2 2-2 4 12m-12 0h12M18 22v-8c0-2 1-4 2-4s2 2 2 4v8',
  'M20 4v22m0-22l4 4m-4-4l-4 4m-2 22l6-6 6 6m-10-4h8m-4-14l-8 8m8-8l8 8',
  'M20 4a16 16 0 100 32 16 16 0 000-32zm0 0c-4 0-8 7-8 16s4 16 8 16m0-32c4 0 8 7 8 16s-4 16-8 16M4 20h32',
  'M8 18v4l18 8v-20l-18 8zm18-4l6-6m-6 14l6 6m0-14h4',
  'M20 12a8 8 0 100 16 8 8 0 000-16zm0 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM16 22h8M12 10c-3-2-4-6-2-8 4 2 6 4 6 6m8-6c3-2 4-6 2-8-4 2-6 4-6 6',
  'M20 10c-4-4-10-4-14-2v22c4-2 10-2 14 2m0-22c4-4 10-4 14-2v22c-4-2-10-2-14 2',
  'M16 36h8m-6-20h4m-6 0l-2 20h12l-2-20m-6-6v6m0-6a3 3 0 100-6 3 3 0 000 6m-10 4h4m16 0h4m-18-6l-3-3m18 3l3-3',
  'M20 8c-8 0-14 6-16 14h8c0-4 4-8 8-8s8 4 8 8h8c-2-8-8-14-16-14zm-6 18c2 2 4 4 6 4s4-2 6-4l-6 6z',
  'M20 34V14m0 0c-2-4-6-6-10-6 2 4 4 8 10 8m0-2c2-4 6-6 10-6-2 4-4 8-10 8m0-8c-2-3-5-5-8-5 2 3 3 6 8 7m0-2c2-3 5-5 8-5-2 3-3 6-8 7',
  'M26 4l-12 12a6 6 0 100 8l12-12V8h-4V4zm-14 18a2 2 0 110 4 2 2 0 010-4z',
  'M6 28c2 2 6 4 14 4s12-2 14-4l-2-8c-2-2-6-4-12-4s-10 2-12 4zm8-12v-6h4l4 6',
  'M8 32h24M10 28V18h20v10M14 28V20h4v8m4 0V20h4v8M12 18l8-8 8 8M20 6v4',
  'M16 26h8m-8 4h8m-6-14v8m4-8v8m-6-12a6 6 0 1112 0c0 2-2 4-3 4H19c-1 0-3-2-3-4z',
  'M20 20c-8-2-14-8-16-16 4 2 10 6 16 10m0 0c8-2 14-8 16-16-4 2-10 6-16 10m0 0c-6 2-12 8-14 14 4-2 8-6 14-10m0-4c6 2 12 8 14 14-4-2-8-6-14-10',
  'M14 34h12m-2-4c4-2 6-6 6-10H10c0 4 2 8 6 10m4 4v-4m0-24v6c-5 0-8 3-8 6h16c0-3-3-6-8-6V6m-3 0h6',
  'M10 30L24 10m-8 6a3 3 0 10-4-4m2 10a3 3 0 10-4-4m2 10a3 3 0 10-4-4m16-10a3 3 0 10-4-4m-2 10a3 3 0 10-4-4',
  'M8 22c0-8 6-14 14-16 2 0 4 2 4 4v4c4 0 8 2 8 6s-4 6-8 6H14c-4 0-6-2-6-4z',
  'M20 6l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3L16 9h3zm-10 8l1 2.5h2.5l-2 1.5.8 2.5-2-1.5-2 1.5.8-2.5-2-1.5H10zm20 0l1 2.5h2.5l-2 1.5.8 2.5-2-1.5-2 1.5.8-2.5-2-1.5h2.5zM12 26l1 2.5h2.5l-2 1.5.8 2.5-2-1.5-2 1.5.8-2.5-2-1.5H12zm16 0l1 2.5h2.5l-2 1.5.8 2.5-2-1.5-2 1.5.8-2.5-2-1.5h2.5z',
  'M6 28a14 14 0 0128 0m-24 0a10 10 0 0120 0m-16 0a6 6 0 0112 0',
  'M17 36h6m-5-18v14h4V18m-2-4c-1.5-3 0-6 2-8 2 2 3.5 5 2 8a2 2 0 11-4 0z',
  'M10 24c0-6 4-12 10-16 2 4 6 8 12 8-2 4-6 8-10 8h8c-4 4-10 8-16 8-4 0-6-2-6-4s1-3 2-4z',
];

/**
 * Returns an SVG data URL emblem avatar for the given index.
 * Each player gets a unique symbol (Compass, Shield, Flame, Star, etc.) with a colored palette.
 */
export function getMissionaryAvatarUrl(seed: string, index?: number): string {
  const idx = index !== undefined ? index : Math.abs(hashCode(seed)) % AVATAR_SYMBOLS.length;
  const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
  const symbol = AVATAR_SYMBOLS[idx % AVATAR_SYMBOLS.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="19" fill="${palette.bg}" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.6"/><circle cx="20" cy="20" r="16" fill="none" stroke="${palette.accent}" stroke-width="0.3" stroke-opacity="0.2"/><path d="${symbol}" fill="none" stroke="${palette.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Pick a missionary by cycling through the array (backward compatible).
 */
export function pickMissionary(index: number): Missionary {
  const len = MISSIONARIES.length;
  return MISSIONARIES[((index % len) + len) % len];
}

/**
 * Pick a truly random missionary from the full list.
 */
export function pickRandomMissionary(): Missionary {
  return MISSIONARIES[Math.floor(Math.random() * MISSIONARIES.length)];
}

// ============================================================
// 60 Missionaries — 35 SDA, 15 Protestant, 10 Biblical
// ============================================================

export const MISSIONARIES: Missionary[] = [
  // -------------------------------------------------------
  // SEVENTH-DAY ADVENTIST MISSIONARIES (1–35)
  // -------------------------------------------------------
  {
    id: 'missionary-01',
    name: 'J.N. Andrews',
    years: '1829–1883',
    region: 'Switzerland',
    bio: 'The first official Seventh-day Adventist missionary sent overseas, sailing to Switzerland in 1874 with his two children. A brilliant scholar and linguist, he founded Les Signes des Temps, the first Adventist periodical in French, and labored tirelessly to establish the Adventist movement in Europe until his death in Basel.',
    avatarSeed: 'J.N. Andrews',
    photoUrl: '',
  },
  {
    id: 'missionary-02',
    name: 'Ellen G. White',
    years: '1827–1915',
    region: 'Global',
    bio: 'Co-founder of the Seventh-day Adventist Church and one of the most translated female authors in history, writing over 5,000 articles and 40 books. Her prophetic counsel shaped Adventist education, healthcare, and global mission strategy, and her masterwork The Great Controversy continues to guide millions of believers worldwide.',
    avatarSeed: 'Ellen G. White',
    photoUrl: '',
  },
  {
    id: 'missionary-03',
    name: 'James White',
    years: '1821–1881',
    region: 'North America',
    bio: 'Co-founder of the Seventh-day Adventist Church who organized scattered Advent believers into a unified denomination. He established the Review and Herald Publishing Association, founded multiple periodicals, and served as General Conference president three times, building the institutional backbone of the worldwide Adventist movement.',
    avatarSeed: 'James White',
    photoUrl: '',
  },
  {
    id: 'missionary-04',
    name: 'Joseph Bates',
    years: '1792–1872',
    region: 'North America',
    bio: 'Retired sea captain and co-founder of the Seventh-day Adventist Church who championed the seventh-day Sabbath truth after studying Scripture independently. He traveled tirelessly across North America at his own expense, preaching and organizing early Adventist congregations, often sleeping in barns and going without food to spread the message.',
    avatarSeed: 'Joseph Bates',
    photoUrl: '',
  },
  {
    id: 'missionary-05',
    name: 'Abram La Rue',
    years: '1822–1903',
    region: 'Hong Kong & China',
    bio: 'Self-supporting Adventist missionary who sailed to Hong Kong at age 61 after the General Conference told him he was too old for mission service. He spent over two decades distributing literature and sharing the gospel among sailors and Chinese residents, laying the groundwork for the entire Adventist mission presence in East Asia.',
    avatarSeed: 'Abram La Rue',
    photoUrl: '',
  },
  {
    id: 'missionary-06',
    name: 'Fernando Stahl',
    years: '1874–1950',
    region: 'Peru',
    bio: 'Adventist missionary who devoted his life to the Aymara and Quechua people around Lake Titicaca in Peru, establishing schools, clinics, and churches at over 12,000 feet elevation. His tireless advocacy transformed entire indigenous communities, and the Peruvian government recognized his extraordinary service to the nation.',
    avatarSeed: 'Fernando Stahl',
    photoUrl: '',
  },
  {
    id: 'missionary-07',
    name: 'Ana Stahl',
    years: '1876–1968',
    region: 'Peru',
    bio: 'Trained nurse and wife of Fernando Stahl who served alongside him among the indigenous peoples of the Peruvian Andes. She provided critical medical care in remote highland communities where no doctors existed, and her compassionate nursing ministry opened countless doors for the Adventist mission around Lake Titicaca.',
    avatarSeed: 'Ana Stahl',
    photoUrl: '',
  },
  {
    id: 'missionary-08',
    name: 'Eric B. Hare',
    years: '1894–1987',
    region: 'Burma / Myanmar',
    bio: 'Beloved Adventist missionary to Burma who served as a dentist, builder, and master storyteller among the Karen people. His captivating mission stories, told at camp meetings across North America for decades, inspired generations of young Adventists to pursue mission service, and his books remain treasured classics.',
    avatarSeed: 'Eric B. Hare',
    photoUrl: '',
  },
  {
    id: 'missionary-09',
    name: 'Leo Halliwell',
    years: '1891–1967',
    region: 'Brazil',
    bio: 'Known as the "Apostle of the Amazon," this Adventist medical missionary built and operated the Luzeiro medical launch, bringing healthcare and the gospel to remote communities along the Amazon River for over 25 years. He constructed multiple medical boats and treated tens of thousands of patients in regions no other doctor would reach.',
    avatarSeed: 'Leo Halliwell',
    photoUrl: '',
  },
  {
    id: 'missionary-10',
    name: 'Georgia Burrus',
    years: '1869–1944',
    region: 'India',
    bio: 'First Seventh-day Adventist woman sent as a missionary to India, arriving in Calcutta in 1895. She endured severe illness, cultural isolation, and limited resources while pioneering Adventist work on the subcontinent, establishing schools and training local workers who would carry the mission forward across India.',
    avatarSeed: 'Georgia Burrus',
    photoUrl: '',
  },
  {
    id: 'missionary-11',
    name: 'Harry Miller',
    years: '1879–1977',
    region: 'China',
    bio: 'Known as the "China Doctor," this Adventist medical missionary served in China for over 40 years, founding hospitals and sanitariums across the country. He developed soy milk as an affordable protein source for malnourished populations, and his innovation grew into a commercial enterprise that funded further mission work throughout Asia.',
    avatarSeed: 'Harry Miller',
    photoUrl: '',
  },
  {
    id: 'missionary-12',
    name: 'Desmond Doss',
    years: '1919–2006',
    region: 'WWII Pacific',
    bio: 'Seventh-day Adventist combat medic who refused to carry a weapon yet saved 75 men at the Battle of Okinawa, lowering them one by one down a 400-foot escarpment under withering enemy fire. He became the first conscientious objector to receive the Medal of Honor, and his story, told in the film Hacksaw Ridge, inspired the world with the power of conviction.',
    avatarSeed: 'Desmond Doss',
    photoUrl: '',
  },
  {
    id: 'missionary-13',
    name: 'W.H. Anderson',
    years: '1870–1950',
    region: 'Africa',
    bio: 'Pioneer Adventist missionary to Africa who spent over 30 years establishing mission stations across Nyasaland (Malawi), Rhodesia (Zimbabwe), and other parts of southern and central Africa. He endured malaria, isolation, and enormous hardship to build schools and churches that became the foundation of the Adventist Church in Africa.',
    avatarSeed: 'W.H. Anderson',
    photoUrl: '',
  },
  {
    id: 'missionary-14',
    name: 'Kata Ragoso',
    years: '1895–1964',
    region: 'Solomon Islands',
    bio: 'Indigenous Solomon Islander who converted to Adventism and became one of the most effective missionaries in the South Pacific. He fearlessly carried the gospel to hostile villages across the Solomon Islands, often at great personal risk, and is credited with bringing thousands of islanders to faith through his courageous witness.',
    avatarSeed: 'Kata Ragoso',
    photoUrl: '',
  },
  {
    id: 'missionary-15',
    name: 'Pedro Kalbermatter',
    years: '1876–1940',
    region: 'South America',
    bio: 'Swiss-Argentine Adventist missionary who pioneered the Adventist message across Argentina and neighboring South American countries. He established churches, schools, and medical facilities throughout the region, and his dedication to the indigenous and rural populations helped make South America one of the strongest Adventist territories in the world.',
    avatarSeed: 'Pedro Kalbermatter',
    photoUrl: '',
  },
  {
    id: 'missionary-16',
    name: 'Michael Belina Czechowski',
    years: '1818–1876',
    region: 'Europe',
    bio: 'The first unofficial Seventh-day Adventist missionary to Europe, a Polish-born former Catholic priest who brought Adventist teachings to Switzerland and Italy in the 1860s without official denominational support. His independent work in Tramelan, Switzerland, raised up the first European Sabbath-keeping Adventist congregation years before the church formally sent J.N. Andrews.',
    avatarSeed: 'Michael B. Czechowski',
    photoUrl: '',
  },
  {
    id: 'missionary-17',
    name: 'John Loughborough',
    years: '1832–1924',
    region: 'Britain',
    bio: 'One of the earliest Adventist ministers who carried the Adventist message to Great Britain in 1878, establishing the first Adventist congregations in England and Scotland. He was also a historian of the movement, authoring The Great Second Advent Movement, and served the church for over 60 years as evangelist, administrator, and chronicler.',
    avatarSeed: 'John Loughborough',
    photoUrl: '',
  },
  {
    id: 'missionary-18',
    name: 'L.R. Conradi',
    years: '1856–1939',
    region: 'Germany & Europe',
    bio: 'German-American Adventist leader who became the driving force behind the expansion of the Adventist Church across continental Europe and into the Middle East and Russia. Under his leadership, the European Division grew from a handful of believers to tens of thousands, and he established the Hamburg Publishing House as a major center of Adventist literature.',
    avatarSeed: 'L.R. Conradi',
    photoUrl: '',
  },
  {
    id: 'missionary-19',
    name: 'A.G. Daniells',
    years: '1858–1935',
    region: 'Global',
    bio: 'Longest-serving General Conference president (1901–1922) who transformed the Adventist Church from a primarily North American denomination into a truly global movement. He reorganized the church structure, championed aggressive mission expansion, and under his leadership the number of overseas mission fields multiplied dramatically.',
    avatarSeed: 'A.G. Daniells',
    photoUrl: '',
  },
  {
    id: 'missionary-20',
    name: 'William Spicer',
    years: '1865–1952',
    region: 'Global',
    bio: 'Secretary and later president of the General Conference who served as the chief architect of Adventist foreign mission strategy for decades. He traveled the world inspecting mission fields, wrote extensively about the progress of the Adventist global mission, and his administrative vision helped coordinate one of the most far-reaching Protestant mission enterprises of the 20th century.',
    avatarSeed: 'William Spicer',
    photoUrl: '',
  },
  {
    id: 'missionary-21',
    name: 'O.A. Olsen',
    years: '1845–1915',
    region: 'Scandinavia & Global',
    bio: 'Norwegian-American Adventist leader who served as General Conference president and was instrumental in establishing the Adventist work in Scandinavia. He organized churches across Norway, Denmark, and Sweden, and his international perspective helped the denomination embrace its global mission calling during a critical period of growth.',
    avatarSeed: 'O.A. Olsen',
    photoUrl: '',
  },
  {
    id: 'missionary-22',
    name: 'Stephen Haskell',
    years: '1833–1922',
    region: 'Global',
    bio: 'Tireless Adventist evangelist and missionary organizer who helped establish Adventist work in Australia, India, Africa, and across the United States. He pioneered the Bible worker training model, founded numerous churches, and traveled the globe well into his eighties, earning the title "the old war horse" for his indefatigable spirit.',
    avatarSeed: 'Stephen Haskell',
    photoUrl: '',
  },
  {
    id: 'missionary-23',
    name: 'Anna Knight',
    years: '1874–1972',
    region: 'India & Southern USA',
    bio: 'First African American Seventh-day Adventist missionary, serving in India from 1901 to 1907 before returning to dedicate decades to educational work in the American South. She established schools for Black communities in Mississippi, fought for educational equity, and her autobiography Mississippi Girl became an inspiring testament to perseverance and faith.',
    avatarSeed: 'Anna Knight',
    photoUrl: '',
  },
  {
    id: 'missionary-24',
    name: 'Philip Giddings',
    years: '1871–1935',
    region: 'Caribbean & West Africa',
    bio: 'Guyanese Adventist missionary who served across the Caribbean and later in West Africa, pioneering Adventist work in Sierra Leone. He endured tropical diseases and enormous logistical challenges to establish churches and schools, and his dedication helped build the foundation of the Adventist Church in English-speaking West Africa.',
    avatarSeed: 'Philip Giddings',
    photoUrl: '',
  },
  {
    id: 'missionary-25',
    name: 'John Fulton',
    years: '1869–1945',
    region: 'Fiji & Pacific Islands',
    bio: 'Adventist missionary to Fiji who spent years living among indigenous Fijians, learning their language and customs while establishing schools and churches throughout the islands. His dramatic story of a Fijian chief who tested the Sabbath by chopping wood to see if God would strike him dead became one of the most retold mission stories in Adventist history.',
    avatarSeed: 'John Fulton',
    photoUrl: '',
  },
  {
    id: 'missionary-26',
    name: 'Jessie Rogers',
    years: '1861–1936',
    region: 'Southern Africa',
    bio: 'British-born Adventist missionary who pioneered educational and evangelistic work in South Africa, establishing some of the earliest Adventist institutions on the continent. She served with extraordinary determination through periods of war and political upheaval, helping to build a lasting Adventist presence in southern Africa.',
    avatarSeed: 'Jessie Rogers',
    photoUrl: '',
  },
  {
    id: 'missionary-27',
    name: 'Lottie Blake',
    years: '1853–1937',
    region: 'Medical Missions',
    bio: 'Early Adventist medical missionary and health reformer who dedicated her career to promoting the health message as an entering wedge for evangelism. She worked closely with Adventist sanitariums and training programs, helping establish the medical missionary model that became a hallmark of Seventh-day Adventist mission work worldwide.',
    avatarSeed: 'Lottie Blake',
    photoUrl: '',
  },
  {
    id: 'missionary-28',
    name: 'J.E. Fultoni',
    years: '1863–1931',
    region: 'Japan & Asia',
    bio: 'Early Adventist missionary to Japan who arrived in the 1890s and worked to establish the Adventist message in one of the most challenging mission fields in Asia. He translated key Adventist literature into Japanese and laid the groundwork for the organized Adventist Church in Japan through patient, persistent ministry.',
    avatarSeed: 'J.E. Fulton',
    photoUrl: '',
  },
  {
    id: 'missionary-29',
    name: 'David Paulson',
    years: '1868–1916',
    region: 'North America',
    bio: 'Adventist physician and medical missionary who founded the Hinsdale Sanitarium near Chicago, bringing Adventist health principles to thousands of patients. He worked alongside John Harvey Kellogg in the early days and remained committed to medical evangelism, training scores of young people for lives of service in health ministry.',
    avatarSeed: 'David Paulson',
    photoUrl: '',
  },
  {
    id: 'missionary-30',
    name: 'Alma Wiles',
    years: '1882–1960',
    region: 'India',
    bio: 'Adventist missionary nurse who served for decades in India, providing medical care and health education in rural communities where modern medicine had never reached. Her sacrificial service and deep love for the Indian people opened doors for the gospel and helped establish the Adventist medical mission presence across the subcontinent.',
    avatarSeed: 'Alma Wiles',
    photoUrl: '',
  },
  {
    id: 'missionary-31',
    name: 'G.F. Jones',
    years: '1869–1960',
    region: 'Pacific Islands',
    bio: 'Adventist missionary who spent decades establishing the church across the Pacific Islands, including the Solomon Islands, Papua New Guinea, and other remote island groups. He navigated dangerous waters in small boats, braved tropical diseases, and worked among peoples who had never heard the gospel, planting congregations that still thrive today.',
    avatarSeed: 'G.F. Jones',
    photoUrl: '',
  },
  {
    id: 'missionary-32',
    name: 'E.H. Gates',
    years: '1855–1940',
    region: 'Pacific Islands',
    bio: 'Pioneer Adventist missionary to the South Pacific who helped establish the Avondale School in Australia and led the expansion of Adventist mission work across Polynesia and Melanesia. He organized the first Adventist institutions in the Pacific and trained local workers who would carry the message to islands he could never personally visit.',
    avatarSeed: 'E.H. Gates',
    photoUrl: '',
  },
  {
    id: 'missionary-33',
    name: 'F.A. Detamore',
    years: '1907–1984',
    region: 'Southeast Asia',
    bio: 'Dynamic Adventist evangelist and missionary who conducted major evangelistic campaigns across Southeast Asia, winning thousands to the faith. His innovative approaches to public evangelism in Malaysia, Singapore, and the Philippines made him one of the most successful Adventist soul-winners in Asia during the mid-20th century.',
    avatarSeed: 'F.A. Detamore',
    photoUrl: '',
  },
  {
    id: 'missionary-34',
    name: 'W.H. Branson',
    years: '1887–1961',
    region: 'Africa & Global',
    bio: 'Adventist leader who spent years as a missionary in Africa before serving as General Conference president. His firsthand experience in African mission fields shaped his global vision, and he championed the training and empowerment of indigenous church leaders, helping the African Adventist Church grow into one of the largest divisions in the world.',
    avatarSeed: 'W.H. Branson',
    photoUrl: '',
  },
  {
    id: 'missionary-35',
    name: 'Jessie Greiner Curtis',
    years: '1873–1958',
    region: 'Central America',
    bio: 'Adventist missionary who pioneered the church\'s work in Central America, establishing schools, churches, and medical clinics in Honduras, Guatemala, and neighboring countries. Her decades of faithful service in challenging tropical conditions helped build a thriving Adventist community that continues to grow across the region today.',
    avatarSeed: 'Jessie Curtis',
    photoUrl: '',
  },

  // -------------------------------------------------------
  // OTHER PROTESTANT MISSIONARIES (36–50)
  // -------------------------------------------------------
  {
    id: 'missionary-36',
    name: 'David Livingstone',
    years: '1813–1873',
    region: 'Africa',
    bio: 'Scottish physician and explorer who opened the interior of Africa to missions, famously declaring "I am prepared to go anywhere, provided it be forward." His journeys mapped uncharted territories and fought the slave trade across the continent, and his death kneeling in prayer became one of the most iconic images in mission history.',
    avatarSeed: 'David Livingstone',
    photoUrl: '',
  },
  {
    id: 'missionary-37',
    name: 'Hudson Taylor',
    years: '1832–1905',
    region: 'China',
    bio: 'Founded the China Inland Mission and pioneered the practice of adopting local dress and customs to reach inland Chinese communities. His faith-based funding model, trusting God alone for provision, influenced modern mission organizations worldwide, and his mission eventually placed over 800 missionaries across China.',
    avatarSeed: 'Hudson Taylor',
    photoUrl: '',
  },
  {
    id: 'missionary-38',
    name: 'Jim Elliot',
    years: '1927–1956',
    region: 'Ecuador',
    bio: 'Martyred at age 28 while attempting to reach the Huaorani people of Ecuador. His journal entry, "He is no fool who gives what he cannot keep to gain what he cannot lose," has inspired generations of missionaries to sacrificial service, and his wife Elisabeth later lived among the very tribe that killed him.',
    avatarSeed: 'Jim Elliot',
    photoUrl: '',
  },
  {
    id: 'missionary-39',
    name: 'William Carey',
    years: '1761–1834',
    region: 'India',
    bio: 'Known as the "Father of Modern Missions," this English cobbler-turned-missionary translated the Bible into Bengali, Sanskrit, and numerous other languages. He transformed Indian education, championed social reform including the abolition of sati, and his famous challenge "Expect great things from God; attempt great things for God" launched the modern missionary movement.',
    avatarSeed: 'William Carey',
    photoUrl: '',
  },
  {
    id: 'missionary-40',
    name: 'Adoniram Judson',
    years: '1788–1850',
    region: 'Burma',
    bio: 'First American foreign missionary who endured 17 months of brutal imprisonment and the loss of his wife to bring the gospel to Burma. He translated the entire Bible into Burmese and compiled the first Burmese-English dictionary, laying the foundation for the church in Myanmar that endures to this day.',
    avatarSeed: 'Adoniram Judson',
    photoUrl: '',
  },
  {
    id: 'missionary-41',
    name: 'Amy Carmichael',
    years: '1867–1951',
    region: 'India',
    bio: 'Rescued hundreds of children from temple slavery in southern India and founded the Dohnavur Fellowship. She served for 55 years without a single furlough, writing 35 books that continue to inspire believers around the world with their honest portrayal of faith through suffering.',
    avatarSeed: 'Amy Carmichael',
    photoUrl: '',
  },
  {
    id: 'missionary-42',
    name: 'Mary Slessor',
    years: '1848–1915',
    region: 'Nigeria',
    bio: 'Scottish mill worker who became a fearless missionary in Calabar, Nigeria, ending the practice of killing twins and advocating for women and children. She served as a magistrate and earned the title "Mother of All the Peoples" for her decades of transformative service among the Okoyong and Efik peoples.',
    avatarSeed: 'Mary Slessor',
    photoUrl: '',
  },
  {
    id: 'missionary-43',
    name: 'Lottie Moon',
    years: '1840–1912',
    region: 'China',
    bio: 'Southern Baptist missionary who served in China for nearly 40 years, ultimately giving her food to starving Chinese villagers until she herself perished of malnutrition. The annual Lottie Moon Christmas Offering established in her memory has raised billions of dollars for international missions.',
    avatarSeed: 'Lottie Moon',
    photoUrl: '',
  },
  {
    id: 'missionary-44',
    name: 'C.T. Studd',
    years: '1860–1931',
    region: 'China, India & Africa',
    bio: 'Renowned English cricketer who gave away his fortune and spent his life serving in three mission fields across three continents. He founded the Worldwide Evangelization Crusade, declaring, "If Jesus Christ be God and died for me, no sacrifice can be too great for me to make for Him."',
    avatarSeed: 'C.T. Studd',
    photoUrl: '',
  },
  {
    id: 'missionary-45',
    name: 'Gladys Aylward',
    years: '1902–1970',
    region: 'China',
    bio: 'English parlor maid who traveled overland to China and ran an inn for mule drivers where she shared the gospel. During the Japanese invasion, she led over 100 orphaned children on a harrowing trek across the mountains to safety, an epic journey later immortalized in the film The Inn of the Sixth Happiness.',
    avatarSeed: 'Gladys Aylward',
    photoUrl: '',
  },
  {
    id: 'missionary-46',
    name: 'Corrie ten Boom',
    years: '1892–1983',
    region: 'Netherlands & Global',
    bio: 'Dutch watchmaker who hid Jews during the Holocaust and survived the Ravensbruck concentration camp. She spent the rest of her life traveling to over 60 countries, sharing a powerful message of forgiveness and God\'s love even for one\'s enemies, proving that no pit is so deep that God\'s love is not deeper still.',
    avatarSeed: 'Corrie ten Boom',
    photoUrl: '',
  },
  {
    id: 'missionary-47',
    name: 'George Muller',
    years: '1805–1898',
    region: 'England & Global',
    bio: 'Cared for over 10,000 orphans in Bristol through prayer alone, never directly asking anyone for donations. In his later years he traveled 200,000 miles preaching in 42 countries, demonstrating a life of radical dependence on God that has inspired faith missions for generations.',
    avatarSeed: 'George Muller',
    photoUrl: '',
  },
  {
    id: 'missionary-48',
    name: 'John Paton',
    years: '1824–1907',
    region: 'New Hebrides',
    bio: 'Scottish missionary to the cannibalistic tribes of the New Hebrides who endured the death of his wife and child, attacks on his life, and years of isolation. His extraordinary perseverance saw entire islands turn from violence to faith in Christ, and his autobiography remains one of the greatest missionary biographies ever written.',
    avatarSeed: 'John Paton',
    photoUrl: '',
  },
  {
    id: 'missionary-49',
    name: 'Ida Scudder',
    years: '1870–1960',
    region: 'India',
    bio: 'Founded the Christian Medical College in Vellore, India, after witnessing three women die in one night because cultural norms prevented male doctors from treating them. Her hospital became one of Asia\'s finest medical institutions and continues to train doctors and serve the poor today.',
    avatarSeed: 'Ida Scudder',
    photoUrl: '',
  },
  {
    id: 'missionary-50',
    name: 'Cameron Townsend',
    years: '1896–1982',
    region: 'Guatemala & Global',
    bio: 'Founded Wycliffe Bible Translators and the Summer Institute of Linguistics after realizing indigenous Guatemalans could not read Spanish Bibles. His vision to translate Scripture into every language on earth has resulted in translations for thousands of language groups and transformed the field of Bible translation forever.',
    avatarSeed: 'Cameron Townsend',
    photoUrl: '',
  },

  // -------------------------------------------------------
  // BIBLICAL MISSIONARIES / APOSTLES (51–60)
  // -------------------------------------------------------
  {
    id: 'missionary-51',
    name: 'Paul the Apostle',
    years: '~5–67 AD',
    region: 'Roman Empire',
    bio: 'Former persecutor of Christians transformed by an encounter with the risen Christ on the road to Damascus. He planted churches across the Roman Empire on three missionary journeys and authored thirteen epistles that form the theological backbone of the New Testament, becoming the greatest missionary the world has ever known.',
    avatarSeed: 'Paul the Apostle',
    photoUrl: '',
  },
  {
    id: 'missionary-52',
    name: 'Barnabas',
    years: '~1st century AD',
    region: 'Cyprus & Asia Minor',
    bio: 'Known as the "Son of Encouragement," he sold his field to support the early church and championed Paul when others doubted his conversion. His missionary journeys with Paul established churches across Cyprus and Asia Minor, and he later mentored John Mark, demonstrating that restoring a fallen believer can yield eternal fruit.',
    avatarSeed: 'Barnabas',
    photoUrl: '',
  },
  {
    id: 'missionary-53',
    name: 'Timothy',
    years: '~17–97 AD',
    region: 'Asia Minor & Ephesus',
    bio: 'Young disciple from Lystra whom Paul called "my true son in the faith," becoming Paul\'s most trusted companion and co-laborer. He traveled with Paul on his second and third missionary journeys and later pastored the strategic church at Ephesus, receiving two of Paul\'s most personal and instructive letters.',
    avatarSeed: 'Timothy',
    photoUrl: '',
  },
  {
    id: 'missionary-54',
    name: 'Silas',
    years: '~1st century AD',
    region: 'Asia Minor & Greece',
    bio: 'Prophet and leader in the Jerusalem church who accompanied Paul on his second missionary journey through Asia Minor and into Europe. He endured imprisonment and beating alongside Paul in Philippi, singing hymns at midnight, and helped establish the churches in Thessalonica, Berea, and Corinth.',
    avatarSeed: 'Silas',
    photoUrl: '',
  },
  {
    id: 'missionary-55',
    name: 'Peter the Apostle',
    years: '~1–68 AD',
    region: 'Judea, Antioch & Rome',
    bio: 'Fisherman from Galilee who became the leader of the twelve apostles and the rock upon whom Christ said He would build His church. His sermon at Pentecost brought 3,000 souls to faith in a single day, and his ministry to both Jews and Gentiles opened the door for the gospel to reach all nations.',
    avatarSeed: 'Peter the Apostle',
    photoUrl: '',
  },
  {
    id: 'missionary-56',
    name: 'Philip the Evangelist',
    years: '~1st century AD',
    region: 'Samaria & Gaza Road',
    bio: 'One of the seven deacons chosen to serve the early church who became a powerful evangelist, bringing revival to Samaria. Led by the Spirit to the desert road to Gaza, he baptized the Ethiopian eunuch, opening the door for the gospel to reach the African continent, and later settled in Caesarea where he raised four prophesying daughters.',
    avatarSeed: 'Philip the Evangelist',
    photoUrl: '',
  },
  {
    id: 'missionary-57',
    name: 'John Mark',
    years: '~1st century AD',
    region: 'Asia Minor & Alexandria',
    bio: 'Young man who accompanied Paul and Barnabas on their first missionary journey but turned back, causing a sharp disagreement between the two apostles. Later restored and mentored by Barnabas, he proved himself faithful and became the author of the Gospel of Mark, which tradition says recorded Peter\'s eyewitness testimony of Christ.',
    avatarSeed: 'John Mark',
    photoUrl: '',
  },
  {
    id: 'missionary-58',
    name: 'Priscilla & Aquila',
    years: '~1st century AD',
    region: 'Rome, Corinth & Ephesus',
    bio: 'Husband-and-wife team of tentmakers who partnered with Paul in ministry across the Roman Empire, hosting house churches in every city where they lived. They discipled the eloquent Apollos in sound theology, risked their lives for Paul, and became one of the earliest examples of a missionary couple working side by side for the gospel.',
    avatarSeed: 'Priscilla and Aquila',
    photoUrl: '',
  },
  {
    id: 'missionary-59',
    name: 'Luke',
    years: '~1st century AD',
    region: 'Greece & Roman Empire',
    bio: 'Physician and historian who accompanied Paul on multiple missionary journeys and authored both the Gospel of Luke and the Book of Acts, together comprising over a quarter of the New Testament. His careful, detailed writing preserved the history of the early church and the spread of the gospel from Jerusalem to Rome for all generations.',
    avatarSeed: 'Luke the Physician',
    photoUrl: '',
  },
  {
    id: 'missionary-60',
    name: 'Apollos',
    years: '~1st century AD',
    region: 'Alexandria, Ephesus & Corinth',
    bio: 'Eloquent Jewish scholar from Alexandria who was mighty in the Scriptures and powerfully refuted opponents in public debate, proving from the Old Testament that Jesus was the Messiah. After being more accurately instructed by Priscilla and Aquila, he became a dynamic evangelist in Corinth, watering what Paul had planted.',
    avatarSeed: 'Apollos',
    photoUrl: '',
  },
];

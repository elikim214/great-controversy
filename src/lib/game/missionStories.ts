// ============================================================
// The Great Controversy: A Last Day ADVENTure Game
// Mission story generation — narrative reports after each mission
// ============================================================

export interface MissionStory {
  headline: string;
  narrative: string;
  stats: string;
  verse: string;
  verseRef: string;
}

// ============================================================
// Bible verses
// ============================================================

interface BibleVerse {
  text: string;
  ref: string;
}

const SUCCESS_VERSES: BibleVerse[] = [
  {
    text: 'Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.',
    ref: 'Matthew 28:19',
  },
  {
    text: 'And this gospel of the kingdom will be preached in the whole world as a testimony to all nations, and then the end will come.',
    ref: 'Matthew 24:14',
  },
  {
    text: 'Then I heard the voice of the Lord saying, "Whom shall I send? And who will go for us?" And I said, "Here am I. Send me!"',
    ref: 'Isaiah 6:8',
  },
  {
    text: 'How beautiful on the mountains are the feet of those who bring good news, who proclaim peace, who bring good tidings, who proclaim salvation.',
    ref: 'Romans 10:15',
  },
  {
    text: 'Then I saw another angel flying in midair, and he had the eternal gospel to proclaim to every nation, tribe, language and people.',
    ref: 'Revelation 14:6',
  },
  {
    text: 'Do you not say, "Four months more and then the harvest"? I tell you, open your eyes and look at the fields! They are ripe for harvest.',
    ref: 'John 4:35',
  },
  {
    text: 'The harvest is plentiful but the workers are few. Ask the Lord of the harvest, therefore, to send out workers into his harvest field.',
    ref: 'Matthew 9:37-38',
  },
  {
    text: 'Those who are wise will shine like the brightness of the heavens, and those who lead many to righteousness, like the stars for ever and ever.',
    ref: 'Daniel 12:3',
  },
  {
    text: 'Go into all the world and preach the gospel to all creation.',
    ref: 'Mark 16:15',
  },
  {
    text: 'He said to them, "The harvest is plentiful, but the laborers are few. Therefore pray earnestly to the Lord of the harvest to send out laborers into his harvest."',
    ref: 'Luke 10:2',
  },
  {
    text: 'For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes.',
    ref: 'Romans 1:16',
  },
  {
    text: 'The people walking in darkness have seen a great light; on those living in the land of deep darkness a light has dawned.',
    ref: 'Isaiah 9:2',
  },
];

const FAILURE_VERSES: BibleVerse[] = [
  {
    text: 'Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour.',
    ref: '1 Peter 5:8',
  },
  {
    text: 'For we do not wrestle against flesh and blood, but against the rulers, against the authorities, against the cosmic powers over this present darkness.',
    ref: 'Ephesians 6:12',
  },
  {
    text: 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.',
    ref: 'James 1:2-3',
  },
  {
    text: 'No weapon forged against you will prevail, and you will refute every tongue that accuses you.',
    ref: 'Isaiah 54:17',
  },
  {
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    ref: 'Romans 8:28',
  },
  {
    text: 'I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.',
    ref: 'John 16:33',
  },
  {
    text: 'The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full.',
    ref: 'John 10:10',
  },
  {
    text: 'Beloved, do not be surprised at the fiery trial when it comes upon you to test you, as though something strange were happening to you.',
    ref: '1 Peter 4:12',
  },
  {
    text: 'But the Lord is faithful. He will establish you and guard you against the evil one.',
    ref: '2 Thessalonians 3:3',
  },
  {
    text: 'Watch and pray so that you will not fall into temptation. The spirit is willing, but the flesh is weak.',
    ref: 'Matthew 26:41',
  },
  {
    text: 'Put on the full armor of God, so that you can take your stand against the devil\'s schemes.',
    ref: 'Ephesians 6:11',
  },
  {
    text: 'For false christs and false prophets will arise and perform great signs and wonders, so as to lead astray, if possible, even the elect.',
    ref: 'Matthew 24:24',
  },
];

// ============================================================
// Story templates
// ============================================================

interface StoryTemplate {
  headline: (loc: string) => string;
  narrative: (loc: string, region: string) => string;
  stats: (baptisms: number, churches: number) => string;
}

const SUCCESS_TEMPLATES: StoryTemplate[] = [
  {
    headline: (loc) => `Revival Sweeps ${loc}!`,
    narrative: (loc, region) =>
      `The team arrived in ${loc} expecting resistance, but God moved powerfully across ${region}. House churches sprang up in villages that had never heard the three angels' messages, and the sound of hymns now echoes where silence once reigned.`,
    stats: (b, c) => `${b} baptisms · ${c} house church${c !== 1 ? 'es' : ''} planted · Dozens of Bible studies ongoing`,
  },
  {
    headline: (loc) => `Breakthrough in ${loc}`,
    narrative: (loc, region) =>
      `What began as a small health clinic in ${loc} opened doors no one expected. Families across ${region} lined up not just for medical care, but to hear about the Great Physician. By the end of the week, the team could barely keep up with requests for Bible studies.`,
    stats: (b, c) => `${b} baptisms · ${c} Bible study group${c !== 1 ? 's' : ''} launched · Free medical clinic served hundreds`,
  },
  {
    headline: (loc) => `The Gospel Reaches ${loc}`,
    narrative: (loc, region) =>
      `For generations, the people of ${loc} had no access to Scripture in their own language. The translation team worked alongside local believers in ${region} to complete a full New Testament, and the first public reading drew tears from elders who never thought they would hear God's Word in their mother tongue.`,
    stats: (b, c) => `${b} baptisms · 1 New Testament translation completed · ${c} reading group${c !== 1 ? 's' : ''} formed`,
  },
  {
    headline: (loc) => `Underground Church Grows in ${loc}`,
    narrative: (loc, region) =>
      `In a region where open worship invites persecution, the team in ${loc} trained local leaders to shepherd small groups in secret. A network of underground churches now spans ${region}, each one a quiet flame refusing to be extinguished.`,
    stats: (b, c) => `${b} baptisms · ${c} underground cell${c !== 1 ? 's' : ''} established · Local leaders trained and ordained`,
  },
  {
    headline: (loc) => `Schools of Hope Open in ${loc}`,
    narrative: (loc, region) =>
      `The children of ${loc} had never seen a classroom. The team built two schools from the ground up, staffed by newly trained teachers from ${region}. Morning worship before lessons has become the highlight of every student's day.`,
    stats: (b, c) => `${b} baptisms · 2 schools established · ${c} teacher${c !== 1 ? 's' : ''} trained in Adventist education`,
  },
  {
    headline: (loc) => `Living Water Flows in ${loc}`,
    narrative: (loc, region) =>
      `The team drilled three wells in ${loc}, ending a generations-long walk to contaminated water sources. As clean water flowed for the first time, the village elder said, "You brought water for our bodies — now tell us about the water for our souls." ${region} will never be the same.`,
    stats: (b, c) => `${b} baptisms · 3 wells drilled · ${c} ${c !== 1 ? 'communities' : 'community'} reached with health ministry`,
  },
  {
    headline: (loc) => `Harvest Season in ${loc}`,
    narrative: (loc, region) =>
      `The evangelistic series in ${loc} was supposed to last five nights. It ran for three weeks. Every evening, more people arrived — some walking hours across ${region} to attend. The final night's altar call was unlike anything the team had witnessed.`,
    stats: (b, c) => `${b} baptisms · ${c} new congregation${c !== 1 ? 's' : ''} formed · Series extended to 3 weeks by popular demand`,
  },
  {
    headline: (loc) => `${loc} Answers the Call`,
    narrative: (loc, region) =>
      `A local family in ${loc} who received the message last year has now become the most effective missionary force in ${region}. They opened their home as a church, their farm as a training center, and their lives as a testimony. The multiplication has begun.`,
    stats: (b, c) => `${b} baptisms · ${c} local missionary famil${c !== 1 ? 'ies' : 'y'} commissioned · Training center operational`,
  },
  {
    headline: (loc) => `Medical Mission Transforms ${loc}`,
    narrative: (loc, region) =>
      `The mobile clinic rolled into ${loc} at dawn, and by noon, the line stretched out of sight. Surgeons, dentists, and nurses served alongside chaplains. In ${region}, where healthcare is a luxury, the team demonstrated that Adventist mission means healing the whole person.`,
    stats: (b, c) => `${b} baptisms · 400+ patients treated · ${c} health seminar${c !== 1 ? 's' : ''} conducted`,
  },
  {
    headline: (loc) => `A Movement Is Born in ${loc}`,
    narrative: (loc, region) =>
      `What started as a single contact in ${loc} has become an unstoppable movement across ${region}. New believers are planting churches faster than the team can track. Leaders are emerging organically, trained by the Spirit and guided by Scripture. This is what the early church must have looked like.`,
    stats: (b, c) => `${b} baptisms · ${c} self-sustaining church${c !== 1 ? 'es' : ''} · Movement spreading to neighboring regions`,
  },
  {
    headline: (loc) => `Youth Rally Ignites ${loc}`,
    narrative: (loc, region) =>
      `The youth rally in ${loc} drew young people from across ${region} who had never set foot in a church. Music, testimonies, and the unfiltered Word of God cut through years of apathy. By the end, dozens of young leaders committed to carrying the message back to their communities.`,
    stats: (b, c) => `${b} baptisms · ${c} youth group${c !== 1 ? 's' : ''} launched · Young leaders trained in evangelism`,
  },
  {
    headline: (loc) => `Food for Body and Soul in ${loc}`,
    narrative: (loc, region) =>
      `The team distributed thousands of meals in ${loc} during the worst food crisis ${region} had seen in years. But they came with more than food. Every distribution point became a site for prayer, for listening, and for sharing hope. Hungry stomachs were filled; hungry hearts found rest.`,
    stats: (b, c) => `${b} baptisms · 3,000+ meals distributed · ${c} community relief center${c !== 1 ? 's' : ''} established`,
  },
  {
    headline: (loc) => `Prophecy Seminars Pack ${loc}`,
    narrative: (loc, region) =>
      `The Daniel and Revelation seminar in ${loc} attracted an audience no one anticipated. Night after night, the hall overflowed, with people from every background across ${region} drawn to the urgency of Bible prophecy. Questions ran late into the evening. Truth, presented clearly, is still the most powerful force on earth.`,
    stats: (b, c) => `${b} baptisms · ${c} ongoing prophecy study group${c !== 1 ? 's' : ''} · Standing-room-only attendance every night`,
  },
  {
    headline: (loc) => `${loc} Sends Its Own Missionaries`,
    narrative: (loc, region) =>
      `The church in ${loc}, planted just two missions ago, has already sent its first missionaries to unreached villages deeper in ${region}. The team watched with awe as new believers, barely a year in the faith, preached with a power and authenticity that years of seminary could not manufacture.`,
    stats: (b, c) => `${b} baptisms · ${c} missionary team${c !== 1 ? 's' : ''} sent out · Indigenous leadership fully established`,
  },
  {
    headline: (loc) => `Radio Waves Carry the Gospel Across ${loc}`,
    narrative: (loc, region) =>
      `The team set up a low-power FM transmitter in ${loc}, and within days, messages were pouring in from listeners across ${region}. Farmers, taxi drivers, and students — people who would never enter a church — were tuning in to hear the Advent message. The airwaves belong to God now.`,
    stats: (b, c) => `${b} baptisms · 1 radio station launched · ${c} listening group${c !== 1 ? 's' : ''} formed across the region`,
  },
  {
    headline: (loc) => `Miracles Reported in ${loc}`,
    narrative: (loc, region) =>
      `The prayer ministry in ${loc} has become the talk of ${region}. Two confirmed healings, a family reunited after years of separation, and a village chief who publicly burned his idols and declared his allegiance to the God of heaven. The team says it plainly: this was not their doing.`,
    stats: (b, c) => `${b} baptisms · ${c} prayer group${c !== 1 ? 's' : ''} active · Miraculous testimonies spreading by word of mouth`,
  },
];

const FAILURE_TEMPLATES: StoryTemplate[] = [
  {
    headline: (loc) => `Mission Compromised in ${loc}`,
    narrative: (loc, region) =>
      `The team's carefully planned outreach in ${loc} fell apart when medical supplies vanished overnight and their local contact in ${region} stopped responding. Someone on the inside had been working against them from the beginning.`,
    stats: () => `0 baptisms · Equipment lost · Contact network compromised`,
  },
  {
    headline: (loc) => `Setback in ${loc}`,
    narrative: (loc, region) =>
      `False rumors about the team spread through ${loc} days before their arrival. By the time they reached ${region}, community leaders had already turned hostile. Doors that were open last week were firmly shut. The damage was deliberate and precise.`,
    stats: () => `0 baptisms · Community trust broken · Months of groundwork undone`,
  },
  {
    headline: (loc) => `${loc} Operation Derailed`,
    narrative: (loc, region) =>
      `Key travel documents for the team were lost — or stolen — in transit to ${loc}. While they waited for replacements, their window in ${region} closed. Someone had known their exact itinerary. The question of who hung heavy over the group.`,
    stats: () => `0 baptisms · Travel documents lost · Mission timeline collapsed`,
  },
  {
    headline: (loc) => `Dark Night in ${loc}`,
    narrative: (loc, region) =>
      `The secret police arrived at the planned meeting site in ${loc} before the team did. Someone had tipped them off. The local believers in ${region} scattered, and weeks of careful planning evaporated in an hour. No one was arrested, but trust — the most precious resource — was shattered.`,
    stats: () => `0 baptisms · Meeting location exposed · Local believers forced underground`,
  },
  {
    headline: (loc) => `Supplies Stolen in ${loc}`,
    narrative: (loc, region) =>
      `The entire shipment of Bibles and medical supplies meant for ${loc} was redirected to a warehouse in ${region} that doesn't exist. The tracking numbers were forged. The team arrived with nothing but the clothes on their backs and a sinking feeling that the betrayal came from within.`,
    stats: () => `0 baptisms · Bible shipment stolen · Medical supplies lost`,
  },
  {
    headline: (loc) => `Division Tears Apart ${loc} Team`,
    narrative: (loc, region) =>
      `Arguments erupted within the team in ${loc} over strategy and leadership — disagreements that seemed to come from nowhere. By the time cooler heads prevailed, the mission window in ${region} had passed. Looking back, it was clear the conflict had been seeded deliberately.`,
    stats: () => `0 baptisms · Team fractured · Mission window expired`,
  },
  {
    headline: (loc) => `Funding Diverted from ${loc}`,
    narrative: (loc, region) =>
      `The mission account for ${loc} was drained three days before deployment. Wire transfers were rerouted through accounts the treasurer had never authorized. Without funds, the team couldn't secure transport into ${region}. The sabotage was surgical and untraceable.`,
    stats: () => `0 baptisms · Mission funds diverted · Deployment cancelled`,
  },
  {
    headline: (loc) => `${loc} Contact Goes Silent`,
    narrative: (loc, region) =>
      `The local coordinator in ${loc} — the team's only connection to believers in ${region} — vanished without a trace. Their phone was disconnected. Their home was empty. Without this link, the team had no way to reach the communities they'd come to serve. The silence was deafening.`,
    stats: () => `0 baptisms · Primary contact missing · Ground network severed`,
  },
  {
    headline: (loc) => `Contaminated Supplies in ${loc}`,
    narrative: (loc, region) =>
      `The medical team in ${loc} discovered that their pharmaceutical supplies had been tampered with — medications switched, labels altered. If they hadn't caught it, people across ${region} could have been harmed. The mission was aborted immediately. The saboteur had nearly turned healers into a threat.`,
    stats: () => `0 baptisms · Medical supplies contaminated · Mission aborted for safety`,
  },
  {
    headline: (loc) => `Translation Corrupted in ${loc}`,
    narrative: (loc, region) =>
      `Months of painstaking Bible translation work for the people of ${loc} was found to be corrupted — key passages altered to distort their meaning. The corrupted files had been backed up and distributed across ${region} before anyone noticed. The team now faces the agonizing task of starting over.`,
    stats: () => `0 baptisms · Translation work destroyed · Months of progress lost`,
  },
  {
    headline: (loc) => `Ambush in ${loc}`,
    narrative: (loc, region) =>
      `The team was warned at the last moment to avoid the route into ${loc}. An anonymous message, later confirmed by locals in ${region}, revealed that an ambush had been arranged. The team retreated safely, but the mission was over before it began. Someone had wanted them to walk into a trap.`,
    stats: () => `0 baptisms · Team forced to retreat · Security compromised`,
  },
  {
    headline: (loc) => `${loc} Locked Down`,
    narrative: (loc, region) =>
      `New government restrictions in ${loc} appeared the same week the team arrived — restrictions that seemed tailored to block exactly their kind of work. Access to communities in ${region} was cut off by bureaucratic walls that hadn't existed a month ago. Coincidence was no longer a believable explanation.`,
    stats: () => `0 baptisms · Government restrictions imposed · Access denied`,
  },
  {
    headline: (loc) => `Betrayed in ${loc}`,
    narrative: (loc, region) =>
      `The team in ${loc} shared their plans with someone they trusted. Within 48 hours, opposition groups in ${region} knew every detail — safe houses, meeting times, the names of local believers. The betrayal was total, and the cost will be measured in months of rebuilding.`,
    stats: () => `0 baptisms · Operational security breached · Safe houses compromised`,
  },
  {
    headline: (loc) => `Storm Over ${loc}`,
    narrative: (loc, region) =>
      `Everything that could go wrong in ${loc} did. Equipment failures, miscommunications, a team member falling ill under suspicious circumstances, and key allies in ${region} suddenly recanting their support. The pattern was too consistent to be bad luck. Someone was orchestrating the collapse.`,
    stats: () => `0 baptisms · Multiple systems failed · Team morale severely tested`,
  },
  {
    headline: (loc) => `${loc} Network Exposed`,
    narrative: (loc, region) =>
      `The underground network of believers in ${loc} was exposed when encrypted communications were intercepted and decoded. Families across ${region} who had been meeting in secret were identified and now face scrutiny. The leak came from inside the mission. The damage may take years to undo.`,
    stats: () => `0 baptisms · Underground network exposed · Believer safety at risk`,
  },
  {
    headline: (loc) => `False Allies in ${loc}`,
    narrative: (loc, region) =>
      `A supposed partner organization in ${loc} turned out to be working against the team. Resources were funneled into dead-end projects, and genuine contacts in ${region} were fed misinformation. By the time the deception was uncovered, the mission had been gutted from within.`,
    stats: () => `0 baptisms · Partner organization compromised · Resources wasted on false leads`,
  },
];

// ============================================================
// Scaling helpers
// ============================================================

function scaleBaptisms(missionNumber: number): number {
  // Mission 1-2: village scale, 3: regional, 4-5: movement
  const ranges: [number, number][] = [
    [3, 12],   // mission 1
    [5, 18],   // mission 2
    [12, 30],  // mission 3
    [20, 40],  // mission 4
    [30, 50],  // mission 5
  ];
  const [min, max] = ranges[Math.min(missionNumber - 1, 4)];
  return min + Math.floor(Math.random() * (max - min + 1));
}

function scaleChurches(missionNumber: number): number {
  const ranges: [number, number][] = [
    [1, 1],  // mission 1
    [1, 2],  // mission 2
    [1, 3],  // mission 3
    [2, 4],  // mission 4
    [3, 5],  // mission 5
  ];
  const [min, max] = ranges[Math.min(missionNumber - 1, 4)];
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// Main export
// ============================================================

export function generateMissionStory(
  locationName: string,
  locationRegion: string,
  missionNumber: number,
  success: boolean,
  sabotageCount: number,
  teamSize: number,
): MissionStory {
  if (success) {
    const template = pickRandom(SUCCESS_TEMPLATES);
    const baptisms = scaleBaptisms(missionNumber);
    const churches = scaleChurches(missionNumber);
    const verse = pickRandom(SUCCESS_VERSES);

    return {
      headline: template.headline(locationName),
      narrative: template.narrative(locationName, locationRegion),
      stats: template.stats(baptisms, churches),
      verse: verse.text,
      verseRef: verse.ref,
    };
  } else {
    const template = pickRandom(FAILURE_TEMPLATES);
    const verse = pickRandom(FAILURE_VERSES);

    return {
      headline: template.headline(locationName),
      narrative: template.narrative(locationName, locationRegion),
      stats: template.stats(0, 0),
      verse: verse.text,
      verseRef: verse.ref,
    };
  }
}

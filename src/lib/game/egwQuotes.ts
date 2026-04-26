// ============================================================
// Ellen G. White quotes about mission work
// All quotes are real, sourced from her published writings
// ============================================================

export interface EGWQuote {
  text: string;
  reference: string;
}

const QUOTES: EGWQuote[] = [
  {
    text: 'The mission of the church of Christ is to save perishing sinners. It is to make known the love of God to men and to win them to Christ by the efficacy of that love.',
    reference: 'Testimonies for the Church, Vol. 3, p. 381',
  },
  {
    text: 'The church of Christ has been organized on earth for missionary purposes, and it is of the highest importance that every individual member of the church should be a sincere laborer together with God.',
    reference: 'Testimonies for the Church, Vol. 6, p. 295',
  },
  {
    text: 'Every true disciple is born into the kingdom of God as a missionary.',
    reference: 'The Desire of Ages, p. 195',
  },
  {
    text: 'There is no limit to the usefulness of one who, by putting self aside, makes room for the working of the Holy Spirit upon his heart, and lives a life wholly consecrated to God.',
    reference: 'The Desire of Ages, p. 250',
  },
  {
    text: 'The work above all work — the business above all others which should draw and engage the energies of the soul — is the work of saving souls for whom Christ has died.',
    reference: 'Testimonies for the Church, Vol. 5, p. 386',
  },
  {
    text: 'God could have reached His object in saving sinners without our aid; but in order for us to develop a character like Christ\'s, we must share in His work.',
    reference: 'The Desire of Ages, p. 142',
  },
  {
    text: 'The Saviour\'s commission to the disciples included all the believers. It includes all believers in Christ to the end of time.',
    reference: 'The Desire of Ages, p. 822',
  },
  {
    text: 'Christ\'s followers have been redeemed for service. Our Lord teaches that the true object of life is ministry.',
    reference: 'Christ\'s Object Lessons, p. 326',
  },
  {
    text: 'Wherever a church is established, all the members should engage actively in missionary work. They should visit every family in the neighborhood and know their spiritual condition.',
    reference: 'Testimonies for the Church, Vol. 6, p. 296',
  },
  {
    text: 'We are not to wait for souls to come to us; we must seek them out where they are.',
    reference: 'Christ\'s Object Lessons, p. 229',
  },
  {
    text: 'Higher than the highest human thought can reach is God\'s ideal for His children. Godliness — godlikeness — is the goal to be reached.',
    reference: 'Education, p. 18',
  },
  {
    text: 'The last rays of merciful light, the last message of mercy to be given to the world, is a revelation of His character of love.',
    reference: 'Christ\'s Object Lessons, p. 415',
  },
  {
    text: 'Strength to resist evil is best gained by aggressive service.',
    reference: 'The Acts of the Apostles, p. 105',
  },
  {
    text: 'Those who would be overcomers must be drawn out of themselves; and the only thing which will accomplish this great work is to become intensely interested in the salvation of others.',
    reference: 'Fundamentals of Christian Education, p. 207',
  },
  {
    text: 'If Christians were only in earnest, they could turn the world upside down.',
    reference: 'Testimonies for the Church, Vol. 9, p. 46',
  },
  {
    text: 'The gospel invitation is not to be narrowed down and presented only to a select few. The message is to be given to all.',
    reference: 'Testimonies for the Church, Vol. 9, p. 34',
  },
  {
    text: 'Let every worker in the Master\'s vineyard study, plan, devise methods, to reach the people where they are. We must do something out of the common course of things.',
    reference: 'Gospel Workers, p. 465',
  },
  {
    text: 'There is a great work to be done, and every effort possible must be made to reveal Christ as the sin-pardoning Saviour, Christ as the Sin Bearer, Christ as the bright and morning Star.',
    reference: 'Gospel Workers, p. 156',
  },
  {
    text: 'Our work has been marked out for us by our heavenly Father. We are to take our Bibles and go forth to warn the world.',
    reference: 'Testimonies for the Church, Vol. 9, p. 150',
  },
  {
    text: 'The world is perishing for want of the gospel. There is a famine for the word of God. There are few who preach the word unmixed with human tradition.',
    reference: 'The Desire of Ages, p. 587',
  },
];

/**
 * Returns a random EGW quote about mission work.
 */
export function getRandomQuote(): EGWQuote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

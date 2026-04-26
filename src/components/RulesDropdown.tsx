'use client';

import { useState } from 'react';

const RULES_SECTIONS = [
  {
    title: 'Overview',
    content: `The Great Controversy is a hidden-role social deduction game for 5\u201315 players. Players are secretly divided into two teams: the Mission Team (good) and Babylon (evil). The app moderates everything \u2014 no human game master needed.

The good team wins by completing 3 of 5 missions successfully. Babylon wins by sabotaging 3 missions, by the Assassin correctly identifying the Angel, or if 5 team proposals are rejected in a row.`,
  },
  {
    title: 'Good Team Roles',
    content: `Missionary \u2014 A faithful servant with no special ability. Support your team and trust your instincts.

Evangelist (7+ players only) \u2014 After mission 4, use your ability on one player. At 7\u20139 players you investigate their alignment (learn if they serve Babylon or the Mission Team). At 10+ players your testimony can convert a Babylon agent to the Mission Team.

Angel \u2014 You know the identity of all Babylon players from the start. You are powerful but also the Assassin\u2019s target \u2014 stay hidden.

Prophet \u2014 You are shown possible Angel candidates. If a Dark Angel is in play (7+ players), you see two players and must discern which is the true Angel. Use this knowledge wisely to protect the Angel without revealing too much.`,
  },
  {
    title: 'Babylon Team Roles',
    content: `Agent of Babylon \u2014 You know your fellow Babylon players. Sabotage missions and deceive the faithful.

Assassin \u2014 You function as a normal Babylon agent during missions. But if the good team completes 3 missions, you get a chance to guess who the Angel is. Guess correctly and Babylon wins! At 10+ players, you get two guesses.

Dark Angel (7+ players only) \u2014 A Babylon agent who appears as a possible Angel to the Prophet. The Prophet sees both you and the real Angel but cannot tell which is which. Use this to sow confusion and misdirect the faithful.`,
  },
  {
    title: 'How Missions Work',
    content: `There are 5 missions total. Each round:

1. The current leader proposes a team of the required size
2. All players vote to Approve or Reject the team
3. If approved, team members privately choose to Support or Sabotage
4. The result is revealed \u2014 1 sabotage card fails the mission
5. Special: Mission 4 always requires 2 sabotage cards to fail

If 5 team proposals are rejected in a row, Babylon wins the game \u2014 mission work has stopped and the second coming is delayed.

After mission 4, the Evangelist uses their ability (if present): investigating (7\u20139 players) or sharing testimony that may convert a Babylon agent (10+ players).`,
  },
  {
    title: 'First Night',
    content: `At the start of the game, secret information is revealed digitally:

1. Babylon players see who their allies are
2. The Angel sees all Babylon players
3. The Prophet sees possible Angel candidates (one if no Dark Angel, two if Dark Angel is in play)
4. The Evangelist starts with no special knowledge

All of this happens privately on each player\u2019s device.`,
  },
  {
    title: 'Winning the Game',
    content: `Good wins: Complete 3 successful missions \u2014 \u201cthe gospel is preached to all the world and Jesus comes.\u201d

Babylon wins: Fail 3 missions \u2014 \u201cthe second coming is delayed.\u201d

Babylon also wins: If 5 team proposals are rejected in a row, mission work ceases and Babylon prevails.

Assassin override: If good completes 3 missions first, the game pauses. The Assassin guesses who the Angel is. At 10+ players the Assassin gets two guesses. If correct, Babylon wins instead!`,
  },
  {
    title: 'Scaling by Player Count',
    content: `Mission 4 always requires 2 sabotage cards to fail (all player counts). Team sizes follow Avalon\u2019s balanced design.

5\u20136 players: No Evangelist, no Dark Angel. Assassin gets 1 guess. Teams: 2/3/2/3/3 (5p) or 2/3/4/3/4 (6p).

7\u20139 players: Evangelist investigates (learns alignment, no conversion). Dark Angel confuses the Prophet. Assassin gets 1 guess.

10+ players: Evangelist can convert Babylon agents. Dark Angel confuses the Prophet. Assassin gets 2 guesses.`,
  },
  {
    title: 'Chat, Notes & Accusations',
    content: `During gameplay, you have access to tools to help you deduce who is who:

Chat \u2014 A shared chat room where all players can communicate. Use it to discuss suspicions, coordinate strategy, or defend yourself.

Accusations \u2014 You can formally accuse a player of being Babylon with a reason. Accusations appear highlighted in chat for all to see.

Private Notes \u2014 Tap the "Notes" button to keep private notes on each player. These are stored only on your device and never shared with anyone \u2014 use them to track behaviors, suspicions, and clues across rounds.`,
  },
  {
    title: 'Disconnections',
    content: `If a player loses connection, they are marked as "Disconnected" and have 30 seconds to rejoin automatically by refreshing their browser.

If they cannot reconnect, the host can kick them from the game. When a player with a special role is removed, their role is reassigned to another eligible player \u2014 the game continues seamlessly.

If the player count drops below 5, the game is cancelled.`,
  },
  {
    title: 'Tips & Interface',
    content: `Your role badge in the header is hidden by default \u2014 tap it to reveal or hide your role. This prevents others from seeing your role over your shoulder.

A discussion timer appears during team proposals so everyone knows how long the debate has been going.

After each mission, you\u2019ll see a narrative report describing what happened \u2014 baptisms, churches planted, or how sabotage disrupted the work. These are paired with a Bible verse and a quote from Ellen G. White on mission work.

At the end of the game, all players\u2019 roles are revealed so you can discuss who was who.`,
  },
  {
    title: 'Player Counts',
    content: `5 players: 3 good / 2 Babylon
6 players: 4 good / 2 Babylon
7 players: 4 good / 3 Babylon
8 players: 5 good / 3 Babylon
9 players: 6 good / 3 Babylon
10 players: 6 good / 4 Babylon
11\u201312 players: 7\u20138 good / 4 Babylon
13\u201315 players: 8\u201310 good / 5 Babylon`,
  },
];

export default function RulesDropdown() {
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

  return (
    <div className="game-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="font-bold">How to Play</h3>
        <span className="text-muted text-lg">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-1">
          {RULES_SECTIONS.map((section, i) => (
            <div key={i} className="border border-card-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(i)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-blue/10 transition-colors"
              >
                <span>{section.title}</span>
                <span className="text-muted text-xs">{expandedIndex === i ? '\u25B2' : '\u25BC'}</span>
              </button>
              {expandedIndex === i && (
                <div className="px-3 pb-3 text-sm text-muted whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

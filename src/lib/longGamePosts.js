// The Long Game — observational essays on psychology, self-worth,
// relationships and ambition. Same post engine as the technical blog;
// these carry section: 'longgame' so they surface on their own index
// and stay out of the engineering one.
//
// House rules for this section, because the genre is full of confident
// nonsense and the whole point is to not add to it:
//
//   1. Name the mechanism, not just the vibe.
//   2. Where a finding is contested or failed to replicate, say so in
//      the piece. Hedging honestly is more useful than sounding sure.
//   3. No invented studies, no invented statistics, no "scientists say".
//   4. Advice arrives last, and only if it follows from the mechanism.

export const LG_CATEGORIES = [
  { id: 'worth',   label: 'Self-worth' },
  { id: 'feeling', label: 'Emotions & attachment' },
  { id: 'people',  label: 'How we treat people' },
  { id: 'winning', label: 'Playing to win' },
]

export const lgCategoryLabel = (id) =>
  LG_CATEGORIES.find((c) => c.id === id)?.label || id

export const LONG_GAME_POSTS = [
  /* ---------------------------------------------------------------- */
  {
    slug: 'self-respect-is-a-behaviour',
    section: 'longgame',
    title: 'Self-Respect Is a Behaviour, Not a Feeling',
    subtitle: 'Why trying to feel worthy is the wrong end of the problem',
    category: 'worth',
    date: '2026-09-28',
    readingMins: 8,
    render: 'prose',
    featured: true,
    excerpt:
      'Thirty years of self-esteem programmes were built on a backwards assumption. The research that checked found the arrow pointing the other way — and it changes what you should actually do about it.',
    body: [
      { type: 'p', text: 'There is a particular kind of advice that sounds kind and does nothing: believe in yourself, know your worth, you are enough. It is pleasant to hear and impossible to act on. Nobody has ever talked themselves into a feeling by being told they should have it.' },
      { type: 'p', text: 'The interesting thing is that this was tested, at scale, for a very long time — and the result was not what anyone expected.' },

      { type: 'h', text: 'The self-esteem experiment' },
      { type: 'p', text: 'From the late 1960s onwards, and especially through the 1980s and 90s, a lot of schools and public programmes ran on a simple theory: low self-esteem causes poor outcomes. Raise how children feel about themselves and achievement, behaviour and wellbeing should follow.' },
      { type: 'p', text: 'In 2003 a team led by Roy Baumeister published a large review in Psychological Science in the Public Interest that went back through the evidence to see whether it had worked. The short version: high self-esteem correlates with better grades, but the causal arrow mostly runs the other way. Doing well raises self-esteem. Raising self-esteem does not reliably produce doing well.' },
      { type: 'p', text: 'They found self-esteem was not a dependable route to better performance, healthier behaviour, or less aggression. It did track two things fairly well — happiness, and willingness to speak up in a group. Those are real, and not nothing. They are also not what the programmes were sold on.' },
      { type: 'quote', text: 'The feeling turned out to be a readout of the life, not a lever on it.' },

      { type: 'h', text: 'Which leaves an obvious question' },
      { type: 'p', text: 'If you cannot install the feeling directly, and the feeling follows the life rather than leading it, then the useful question is not "how do I feel worthy?" It is "what produces that readout?"' },
      { type: 'p', text: 'And that question has a much more tractable answer, because it is about behaviour, and behaviour is observable.' },

      { type: 'h', text: 'Act first, feel later' },
      { type: 'p', text: 'Clinical psychology worked this out from a different direction. Behavioural activation is a treatment for depression built on a deliberately unromantic premise: do not wait to feel motivated before acting. Schedule the activity, do it while still feeling flat, and let mood follow behaviour rather than gate it.' },
      { type: 'p', text: 'It is one of the better-supported treatments there is, and it is notable precisely because it inverts the intuition. Most people assume feeling comes first and action follows. For a lot of psychological change, the order is the reverse.' },
      { type: 'p', text: 'Self-respect appears to work the same way round. It is not a mood you generate and then act from. It is the residue of a track record.' },

      { type: 'h', text: 'What the track record is made of' },
      { type: 'p', text: 'If self-respect is accumulated evidence, the question becomes: evidence of what? In practice it seems to be evidence that you are someone whose own stated positions survive contact with pressure.' },
      { type: 'list', items: [
        'You said you would do something, and you did it — when nobody was checking',
        'You said a thing was not acceptable, and then behaved as though it was not acceptable',
        'You wanted approval, and did not buy it by agreeing with something you did not believe',
        'You were disappointed by someone and said so, plainly, once, instead of going quiet and hoping they noticed',
        'You left a situation you had already decided was wrong, on roughly the timeline you had decided',
      ] },
      { type: 'p', text: 'None of those are feelings. All of them are things a camera could record. That is the point — they accumulate into evidence whether or not you feel confident while doing them.' },

      { type: 'h', text: 'Why "boundaries" is a behaviour word' },
      { type: 'p', text: 'Boundaries get talked about as though they were announcements. They are not. A boundary that is stated and not enforced is not a boundary; it is a request that has been declined. The other person has learned, accurately, that the stated limit and the real limit are different numbers.' },
      { type: 'p', text: 'This is also why repeatedly announcing a limit you do not hold is corrosive. You are not only teaching the other person what your limits really are — you are filing evidence, for yourself, that your stated positions do not predict your behaviour. It is difficult to respect someone whose word does not forecast their actions, and that difficulty does not make an exception for you.' },

      { type: 'h', text: 'The distinction worth keeping' },
      { type: 'p', text: 'There is a related strand of research worth knowing about here. Kristin Neff has spent two decades arguing that self-compassion is a better target than self-esteem, and the distinction is sharper than it sounds.' },
      { type: 'p', text: 'Self-esteem is comparative. It asks how you rate, which means it needs other people to rate against, which means it is structurally unstable — it rises and falls with your standing. Self-compassion is not comparative. It asks how you treat yourself when you fail, which does not require anyone else to be doing worse.' },
      { type: 'p', text: 'The practical difference: self-esteem is threatened by failure, so it quietly discourages attempting things you might be bad at. Self-compassion is not, so it does not.' },
      { type: 'note', text: 'Worth being precise: much of this literature is questionnaire-based and correlational, and the self-compassion measures overlap with existing measures of low neuroticism. The direction of effect is reasonably well-supported; the size of it is still argued about.' },

      { type: 'h', text: 'What this actually changes' },
      { type: 'p', text: 'If you take the finding seriously, a few things follow, and none of them are affirmations.' },
      { type: 'steps', items: [
        { title: 'Stop auditing the feeling', text: 'Asking "do I feel worthy yet?" measures a readout you cannot directly move, and the checking itself tends to make it worse.' },
        { title: 'Shrink the promises until you keep them', text: 'A track record of five kept small commitments is worth more than one abandoned large one, because the evidence is in the keeping, not the size.' },
        { title: 'Enforce one stated limit, once', text: 'Not as a confrontation — as a data point. The goal is a single instance of your word predicting your behaviour.' },
        { title: 'Expect the feeling to lag', text: 'It arrives after the evidence accumulates, which means the early period feels like nothing is working. That is the normal shape of it, not a sign of failure.' },
      ] },

      { type: 'h', text: 'The uncomfortable part' },
      { type: 'p', text: 'This framing is less kind than the affirmation version, and it should be said plainly. If self-respect is built from evidence, then it cannot be given to you. Nobody can reassure you into it, which means a partner who thinks highly of you cannot solve it, and neither can an audience.' },
      { type: 'p', text: 'That is the bad news and the good news in the same sentence. It cannot be handed over — but it also cannot be taken away by someone withdrawing their approval, because it was never being stored with them in the first place.' },
      { type: 'quote', text: 'Anything another person can give you, another person can remove.' },

      { type: 'h', text: 'Sources worth reading directly' },
      { type: 'list', items: [
        'Baumeister, Campbell, Krueger & Vohs (2003) — "Does High Self-Esteem Cause Better Performance, Interpersonal Success, Happiness, or Healthier Lifestyles?" — The review that checked. Readable, and more nuanced than its reputation.',
        'Neff, K. — research on self-compassion vs self-esteem — The comparative-versus-noncomparative distinction is the useful part.',
        'Behavioural activation — clinical literature on acting before mood — The evidence that order of operations runs action first.',
      ] },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'unpredictable-people-feel-compelling',
    section: 'longgame',
    title: 'Why Unpredictable People Feel More Compelling',
    subtitle: 'Intensity is a measurement of your alarm system, not of compatibility',
    category: 'feeling',
    date: '2026-09-28',
    readingMins: 9,
    render: 'prose',
    excerpt:
      'The person who replies instantly every time becomes ordinary. The one who replies sometimes becomes the whole weather system. There is a specific, boring mechanism behind that — and it is the same one that makes slot machines profitable.',
    body: [
      { type: 'p', text: 'Almost everyone has noticed some version of this: the consistent, available, straightforwardly interested person registers as pleasant and slightly flat, while the inconsistent one occupies an amount of mental space wildly out of proportion to how much time you have actually spent together.' },
      { type: 'p', text: 'It is tempting to read that as information — as though the intensity were telling you something true about compatibility. It is worth understanding what is actually generating the signal before trusting it.' },

      { type: 'h', text: 'The mechanism is not romantic' },
      { type: 'p', text: 'In the 1950s Ferster and Skinner mapped out what happens to behaviour under different schedules of reward. The finding that matters here is unglamorous and extremely robust: behaviour rewarded every single time extinguishes quickly once the reward stops. Behaviour rewarded unpredictably — sometimes yes, sometimes no, no discernible pattern — becomes far more persistent and far harder to extinguish.' },
      { type: 'p', text: 'This is not a contested corner of psychology. It is the foundation of operant conditioning, it replicates across species, and it is the reason slot machines pay out on a variable schedule rather than a fixed one. A machine that paid every tenth pull would be much less compelling than one that pays unpredictably, even at identical total payout.' },
      { type: 'quote', text: 'Unpredictable reward does not produce more satisfaction. It produces more checking.' },
      { type: 'p', text: 'Someone whose attention arrives unpredictably is, structurally, a variable-ratio schedule. Not because they are manipulative — most are not, they are just inconsistent — but because the pattern of the reinforcement is the same regardless of intent.' },

      { type: 'h', text: 'What that feels like from the inside' },
      { type: 'p', text: 'The experience does not present itself as conditioning. It presents itself as chemistry. The thoughts that show up are about them: how interesting they are, how good it feels when they do turn up, how nobody else has quite this effect.' },
      { type: 'p', text: 'But look at what is actually elevated. It is rarely contentment. It is vigilance — checking, re-reading, monitoring, constructing explanations. That is a threat-detection system running, not an affection system.' },
      { type: 'p', text: 'And the relief when they finally respond is genuinely intense, which makes the whole loop self-confirming. The bigger the uncertainty, the bigger the relief, and relief is easy to mistake for joy.' },

      { type: 'h', text: 'Attachment, and a caveat' },
      { type: 'p', text: 'The obvious next concept is attachment. Bowlby\u2019s work, and Ainsworth\u2019s Strange Situation studies with infants, established that inconsistent availability from a caregiver produces a recognisable pattern: heightened monitoring, protest behaviour when the caregiver leaves, and difficulty settling even when they return. Consistent availability produces a child who explores more and settles faster.' },
      { type: 'p', text: 'The infant work is solid. The extension to adult romantic attachment styles is more contested than popular writing suggests — the categories are less stable over time than the four-box diagrams imply, and self-report measures do a lot of heavy lifting.' },
      { type: 'note', text: 'Take the adult attachment categories as a useful description of patterns, not as a diagnosis or a fixed type. The underlying observation — that inconsistent availability increases monitoring — holds up much better than any particular taxonomy of people.' },
      { type: 'p', text: 'One more caution, because it gets cited constantly in this context: the 1974 Dutton and Aron suspension bridge study, usually summarised as "fear gets mistaken for attraction", has a mixed replication record and several plausible alternative explanations. It is a nice story. It is not load-bearing evidence, and it should not be treated as such.' },

      { type: 'h', text: 'Why calm reads as boring' },
      { type: 'p', text: 'Here is the part that causes real damage. If your nervous system has learned that intensity is what interest feels like, then a person who is straightforwardly, consistently available will not generate that signal — and the absence of the signal gets interpreted as absence of attraction.' },
      { type: 'p', text: 'It is a measurement error. The calm person is not producing less feeling; they are producing less alarm. But if alarm is your only instrument, you will read the quiet as nothing there.' },
      { type: 'p', text: 'This is how people end up describing a kind, consistent, interested person as lacking a spark, while describing someone who leaves them anxious for days as intense and magnetic. Both descriptions are accurate reports of the internal reading. The instrument is just miscalibrated.' },

      { type: 'h', text: 'What the signal is actually good for' },
      { type: 'p', text: 'None of this means intensity is meaningless or that every strong feeling is a trauma response. That overcorrection is its own problem, and it gets used to dismiss perfectly real attraction.' },
      { type: 'p', text: 'The useful move is narrower: treat intensity as unlabelled data rather than as a verdict. Then ask a diagnostic question that separates the two sources.' },
      { type: 'facts', items: [
        { k: 'Attraction', v: 'Elevated when you are with them. Thinking about them is pleasant.' },
        { k: 'Activation', v: 'Elevated when you are not with them, and especially when you do not know where you stand. Thinking about them is effortful.' },
      ] },
      { type: 'p', text: 'One feels like wanting. The other feels like needing to find out. They are easy to confuse in the moment and fairly easy to tell apart in retrospect, because they leave different residue: one leaves you rested, the other leaves you tired.' },

      { type: 'h', text: 'If you recognise the loop' },
      { type: 'steps', items: [
        { title: 'Notice what is elevated', text: 'Vigilance and contentment feel similar in intensity and nothing alike in texture. Vigilance is the one that involves checking.' },
        { title: 'Watch the pattern over weeks, not moments', text: 'Variable reinforcement is invisible in any single interaction and obvious across twenty. One slow reply means nothing. A month of unpredictability is the pattern itself.' },
        { title: 'Do not try to become unpredictable back', text: 'It works, in the narrow sense that it produces the same effect in them — and it builds the relationship on the mechanism instead of on anything durable.' },
        { title: 'Recalibrate slowly', text: 'If consistent people currently register as flat, that reading is not going to change in a week. It changes by spending enough time around consistency for it to stop feeling like absence.' },
      ] },

      { type: 'h', text: 'The thing worth holding onto' },
      { type: 'p', text: 'The strongest feeling in the room is not automatically the truest one. Sometimes intensity is attraction. Sometimes it is a smoke alarm. They are both loud, and loudness is not the variable that tells you which is which.' },
      { type: 'quote', text: 'Safety is not the absence of feeling. It is the absence of alarm — which is a different thing, and much easier to mistake for nothing.' },

      { type: 'h', text: 'Sources worth reading directly' },
      { type: 'list', items: [
        'Ferster & Skinner (1957) — "Schedules of Reinforcement" — The origin of the variable-ratio finding. Dry, and the bedrock of everything above.',
        'Ainsworth — the Strange Situation studies — The infant work, which is far more solid than the adult pop-psychology derived from it.',
        'Replication literature on Dutton & Aron (1974) — Worth reading specifically to see how a memorable study becomes an unexamined fact.',
      ] },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'winning-big-is-mostly-not-losing',
    section: 'longgame',
    title: 'Winning Big Is Mostly Not Losing',
    subtitle: 'The arithmetic of staying in the game long enough for it to pay',
    category: 'winning',
    date: '2026-09-28',
    readingMins: 8,
    render: 'prose',
    excerpt:
      'Most advice about winning is about maximising upside. The mathematics says something less exciting and more useful: the dominant variable is usually avoiding the outcome you cannot come back from.',
    body: [
      { type: 'p', text: 'Advice about ambition tends to be about acceleration — go harder, take the shot, bet on yourself. It is energising and it is only half the equation, because it quietly assumes you will still be in the game tomorrow to compound whatever you gained today.' },
      { type: 'p', text: 'That assumption is doing more work than most of the advice around it.' },

      { type: 'h', text: 'The planes that came back' },
      { type: 'p', text: 'During the Second World War, the US military studied returning bombers to decide where to add armour. The damage was concentrated on the wings and fuselage, so the obvious conclusion was to reinforce there.' },
      { type: 'p', text: 'Abraham Wald, a statistician with the Statistical Research Group, pointed out the flaw. They were only measuring aircraft that made it home. Damage to the engines was underrepresented in the sample not because engines were rarely hit, but because planes hit there did not return to be counted. The armour belonged where the surviving planes showed no damage at all.' },
      { type: 'quote', text: 'The sample you can see is the sample that survived. What killed the rest is invisible by construction.' },
      { type: 'p', text: 'This is the shape of almost all advice about winning. You hear from people who made it. The identical strategy that ended other careers does not generate interviews, books, or conference talks — so the strategy looks better than it was, and the risk that accompanied it is missing from the record entirely.' },

      { type: 'h', text: 'Why the order of operations matters' },
      { type: 'p', text: 'There is a piece of arithmetic that is trivial and constantly ignored. Gains and losses of the same percentage are not symmetric.' },
      { type: 'facts', items: [
        { k: 'Lose 10%', v: 'Need +11.1% to recover' },
        { k: 'Lose 25%', v: 'Need +33.3% to recover' },
        { k: 'Lose 50%', v: 'Need +100% to recover' },
        { k: 'Lose 90%', v: 'Need +900% to recover' },
        { k: 'Lose 100%', v: 'No recovery exists' },
      ] },
      { type: 'p', text: 'That last row is the one that matters, and it is qualitatively different from the rows above it. Every other loss is a setback with a multiplier attached. Total loss is not a large setback — it is the end of the sequence, because anything multiplied by zero stays zero no matter how good the subsequent returns are.' },
      { type: 'p', text: 'This is why anything compounding — money, reputation, health, a career, a relationship — is governed less by the size of your best year than by whether you ever hit zero. A merely decent return sustained over decades beats a spectacular one interrupted by ruin, and it is not close.' },

      { type: 'h', text: 'A useful distinction' },
      { type: 'p', text: 'There is an idea from probability that sharpens this, usually discussed under the heading of ergodicity, and most associated in recent years with Ole Peters. The formulation is contested among economists; the underlying distinction is not, and it is worth having.' },
      { type: 'p', text: 'It is this: the average outcome across many people playing a game once is not necessarily the same as the outcome for one person playing that game many times.' },
      { type: 'p', text: 'Take a bet where you gain 50% on a win and lose 40% on a loss, at even odds. Across a large group playing once, the average result is positive. For one person playing repeatedly, the losses multiply against the gains and the typical path trends toward zero. Same bet. Opposite conclusions, depending on whether the outcomes are spread across people or stacked across time.' },
      { type: 'note', text: 'Ergodicity economics is an active argument, not settled consensus, and some of the stronger claims made for it are disputed. The narrow point used here — that repeated multiplicative bets behave differently from one-off additive ones — is standard probability and not in dispute.' },
      { type: 'p', text: 'Your life is the second case. You are one person, playing repeatedly, and your outcomes multiply rather than average.' },

      { type: 'h', text: 'What this does not mean' },
      { type: 'p', text: 'It would be easy to read all this as an argument for caution, and that reading is wrong. Refusing all risk is itself a strategy with a terrible expected value — it guarantees the small outcome.' },
      { type: 'p', text: 'The distinction is not between risk and safety. It is between risks you can repeat and risks you can only take once.' },
      { type: 'list', items: [
        'A venture that fails and costs you two years is survivable, and the lesson compounds into the next attempt',
        'A venture that fails and costs you everything you have is not, and nothing compounds from zero',
        'A conversation that goes badly costs you an afternoon',
        'A reputation for dishonesty costs you the ability to have the conversation at all',
      ] },
      { type: 'p', text: 'The first item in each pair is the kind of risk worth taking repeatedly and aggressively. The second is the kind worth being genuinely conservative about, and the difference is not how frightening they feel. It is whether there is a path back.' },

      { type: 'h', text: 'Why we get this backwards' },
      { type: 'p', text: 'Kahneman and Tversky\u2019s prospect theory established that people are loss-averse: losses are felt more strongly than equivalent gains. You would expect that to make us appropriately careful about ruin. It mostly does not, for two reasons.' },
      { type: 'p', text: 'The first is that loss aversion operates on what is felt, and ruin risk is usually not felt until it arrives. A small daily probability of catastrophe produces no sensation at all on any given day, which is precisely what makes it dangerous.' },
      { type: 'p', text: 'The second is that loss aversion makes people overly cautious about small, recoverable, high-value risks — the conversation, the application, the attempt — because those losses are vivid and immediate. So the instinct fires in exactly the wrong direction: too timid about the recoverable, too relaxed about the irreversible.' },
      { type: 'quote', text: 'Be reckless where you can afford to be, and boring where you cannot.' },

      { type: 'h', text: 'The practical filter' },
      { type: 'steps', items: [
        { title: 'Ask what happens if this fails completely', text: 'Not the likely case — the worst one. If the honest answer includes "I could not attempt anything again", the size of the upside is irrelevant.' },
        { title: 'Separate recoverable from irreversible, and treat them oppositely', text: 'Most people apply one risk setting to both, and it is wrong for one of them by definition.' },
        { title: 'Check whether you are looking at a sample of survivors', text: 'Advice from people who won using a strategy tells you almost nothing without the people who lost using the same one.' },
        { title: 'Optimise for the number of attempts, not the quality of any single one', text: 'Staying in the game is what lets an ordinary hit rate compound into an unusual outcome.' },
      ] },

      { type: 'h', text: 'The unglamorous conclusion' },
      { type: 'p', text: 'Winning big is usually not a story about one brilliant decision. It is a story about a decent process applied for an unreasonably long time by someone who never got knocked out. The brilliance is visible and mostly incidental. The not-getting-knocked-out is invisible and mostly decisive.' },
      { type: 'p', text: 'Which is why the most valuable skill is not spotting the big opportunity. It is being reliably present when one shows up.' },

      { type: 'h', text: 'Sources worth reading directly' },
      { type: 'list', items: [
        'Abraham Wald — Statistical Research Group memoranda on aircraft survivability — The original survivorship-bias reasoning, and clearer than the retellings.',
        'Kahneman & Tversky (1979) — "Prospect Theory: An Analysis of Decision under Risk" — Loss aversion at source. The magnitudes are debated; the asymmetry is not.',
        'Peters, O. — writing on ergodicity economics — Read alongside the criticism of it; the argument is live and the disagreement is instructive.',
      ] },
    ],
  },
]

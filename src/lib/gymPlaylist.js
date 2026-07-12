// ============================================================
// Gym playlist for Transformation HQ — high-energy, hype tracks
// to lift to. Every id is a verified public YouTube video
// (oEmbed 200). "Flashing Lights" is the starter, by request.
// ============================================================

// tag: '⭐' starter · '🔥' certified gym anthem
export const PLAYLIST = [
  { id: 'ila-hAUXR5U', title: 'Flashing Lights',      by: 'Kanye West ft. Dwele', tag: '⭐', note: 'The starter. Press play, chin up, first rep.' },
  { id: 'PsO6ZnUZI0g', title: 'Stronger',             by: 'Kanye West',           tag: '🔥', note: 'N-n-n-now that don’t kill me…' },
  { id: 'L53gjP-TtGE', title: 'POWER',                by: 'Kanye West' },
  { id: 'q604eed4ad0', title: 'Black Skinhead',       by: 'Kanye West' },
  { id: '6ONRf7h3Mdk', title: 'SICKO MODE',           by: 'Travis Scott' },
  { id: 'Dst9gZkq1a8', title: 'goosebumps',           by: 'Travis Scott' },
  { id: '_r-nPqWGG6c', title: 'No Idea',              by: 'Don Toliver' },
  { id: 'tvTRZJ-4EyI', title: 'HUMBLE.',              by: 'Kendrick Lamar',       tag: '🔥' },
  { id: 'NLZRYQMLDW4', title: 'DNA.',                 by: 'Kendrick Lamar' },
  { id: 'ytQ5CYE1VZw', title: "'Till I Collapse",     by: 'Eminem ft. Nate Dogg', tag: '🔥', note: 'The last-rep song. When your legs give out, this carries you.' },
  { id: 'xFYQQPAOz7Y', title: 'Lose Yourself',        by: 'Eminem' },
  { id: '4NRXx6U8ABQ', title: 'Blinding Lights',      by: 'The Weeknd' },
  { id: 'VWoIpDVkOH0', title: 'Mo Bamba',             by: 'Sheck Wes' },
  { id: '7wtfhZwyrcc', title: 'Believer',             by: 'Imagine Dragons' },
  { id: '2zNSgSzhBfM', title: "Can't Hold Us",        by: 'Macklemore & Ryan Lewis' },
  { id: 'JRfuAukYTKg', title: 'Titanium',             by: 'David Guetta ft. Sia' },
  { id: 'btPJPFnesV4', title: 'Eye of the Tiger',     by: 'Survivor',             tag: '🔥', note: 'Undefeated since 1982.' },
  { id: 'fGx6K90TmCI', title: "X Gon' Give It To Ya", by: 'DMX' },
]

export const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`

// A single link that opens all tracks as one YouTube playlist (starts on the
// starter). YouTube's watch_videos endpoint builds a temp playlist from the ids.
export const playAllUrl = () =>
  `https://www.youtube.com/watch_videos?video_ids=${PLAYLIST.map(t => t.id).join(',')}`

export const STARTER = PLAYLIST[0]

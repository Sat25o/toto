export const STANDINGS_START_ROUND = 2;
export const CHAMPIONS_LEAGUE_QUALIFICATION_ROUND = 13;
export const CHAMPIONS_LEAGUE_EDITION = "2026-27";
export const CHAMPIONS_LEAGUE_QUALIFIED_COUNT = 16;

export function isRoundIncludedInStandings(roundNumber: number) {
  return roundNumber >= STANDINGS_START_ROUND;
}

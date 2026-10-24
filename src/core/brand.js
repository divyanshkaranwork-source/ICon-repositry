// The Folio mark: a sheet of paper with a vermilion folded corner, set on ink.

export const BRAND = {
  ink: '#1b1a17',
  paper: '#efebe2',
  vermilion: '#d4553a',
};

export function brandSvg({ tile = true } = {}) {
  const { ink, paper, vermilion } = BRAND;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
    (tile ? `<rect x="4" y="4" width="120" height="120" rx="26" fill="${ink}"/>` : '') +
    `<path d="M40 26h38l16 16v58a3 3 0 0 1-3 3H40a3 3 0 0 1-3-3V29a3 3 0 0 1 3-3z" fill="${tile ? paper : ink}"/>` +
    `<path d="M78 26v13a3 3 0 0 0 3 3h13z" fill="${vermilion}"/>` +
    `</svg>`
  );
}

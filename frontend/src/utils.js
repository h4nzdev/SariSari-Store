// SQLite stores CURRENT_TIMESTAMP in UTC as "YYYY-MM-DD HH:MM:SS".
// JS Date() parses that format as local time on most browsers — wrong.
// Adding 'T' and 'Z' forces correct UTC interpretation.
export const parseTS = (ts) => (ts ? new Date(ts.replace(' ', 'T') + 'Z') : null)

export const peso = (n) => `₱${Number(n).toFixed(2)}`

export const pct = (now, prev) => {
  if (!prev || prev === 0) return null
  return (((now - prev) / prev) * 100).toFixed(1)
}

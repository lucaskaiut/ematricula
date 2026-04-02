export function maskBrazilianCpf(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskBrazilianPhone(raw: string): string {
  const all = raw.replace(/\D/g, '');
  const intl = all.startsWith('55') && all.length >= 12;
  const d = intl ? all.slice(0, 13) : all.slice(0, 11);

  if (intl) {
    const rest = d.slice(2);
    if (rest.length === 0) return '+55';
    if (rest.length <= 2) return `+55 (${rest}`;
    const ddd = rest.slice(0, 2);
    const sub = rest.slice(2);
    if (sub.length === 0) return `+55 (${ddd})`;
    const mobile = sub[0] === '9';
    if (mobile) {
      const s = sub.slice(0, 9);
      if (s.length <= 5) return `+55 (${ddd}) ${s}`;
      return `+55 (${ddd}) ${s.slice(0, 5)}-${s.slice(5)}`;
    }
    const s = sub.slice(0, 8);
    if (s.length <= 4) return `+55 (${ddd}) ${s}`;
    return `+55 (${ddd}) ${s.slice(0, 4)}-${s.slice(4)}`;
  }

  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const sub = d.slice(2);
  if (sub.length === 0) return `(${ddd}) `;
  const mobile = sub[0] === '9';
  if (mobile) {
    const s = sub.slice(0, 9);
    if (s.length <= 5) return `(${ddd}) ${s}`;
    return `(${ddd}) ${s.slice(0, 5)}-${s.slice(5)}`;
  }
  const s = sub.slice(0, 8);
  if (s.length <= 4) return `(${ddd}) ${s}`;
  return `(${ddd}) ${s.slice(0, 4)}-${s.slice(4)}`;
}

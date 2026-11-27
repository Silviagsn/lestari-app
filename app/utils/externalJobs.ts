export const externalJobLimits = { title: 120, company: 120, location: 120 } as const;
export type ExternalJobFields = Record<keyof typeof externalJobLimits, string> & { url: string };

export function jobStreetUrl(value: string) {
  if (value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    const id = /^\/(?:id\/)?job\/([1-9][0-9]{0,19})\/?$/.exec(url.pathname)?.[1];
    if (!id || url.protocol !== 'https:' || url.hostname !== 'id.jobstreet.com' || url.username || url.password || url.port) return null;
    return `https://id.jobstreet.com/id/job/${id}`;
  } catch {
    return null;
  }
}

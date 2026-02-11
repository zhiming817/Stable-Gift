export const shortenAddress = (str: string) => {
  if (str.length < 10) return str;
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
};

export const MIST_PER_SUI = 1_000_000_000;

export const formatBalance = (mist: number | string | bigint) => {
  return (Number(mist) / MIST_PER_SUI).toFixed(4);
};

export const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Assume backend returns Naive UTC string (e.g., "2023-01-01T12:00:00")
    // We append 'Z' to treat it as UTC, then toLocaleString converts to local timezone
    const utcStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    return new Date(utcStr).toLocaleString();
};

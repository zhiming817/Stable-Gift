export const shortenAddress = (str: string) => {
  if (str.length < 10) return str;
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
};

export const MIST_PER_SUI = 1_000_000_000;

export const formatBalance = (mist: number | string | bigint) => {
  return (Number(mist) / MIST_PER_SUI).toFixed(4);
};

const VISIBLE_START_DIGITS = 4;
const VISIBLE_END_DIGITS = 2;

export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  const total = digits.length;

  if (total <= VISIBLE_START_DIGITS + VISIBLE_END_DIGITS) return phone;

  let digitIndex = 0;

  return phone
    .split('')
    .map((char) => {
      if (!/\d/.test(char)) return char;

      const pos = digitIndex++;
      const isVisible =
        pos < VISIBLE_START_DIGITS || pos >= total - VISIBLE_END_DIGITS;

      return isVisible ? char : '*';
    })
    .join('');
};

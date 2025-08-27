const BLACKLIST: Array<string> = [
  '00000000000000',
  '11111111111111',
  '22222222222222',
  '33333333333333',
  '44444444444444',
  '55555555555555',
  '66666666666666',
  '77777777777777',
  '88888888888888',
  '99999999999999',
];

const STRICT_STRIP_REGEX = /[-\\/.]/g;
const LOOSE_STRIP_REGEX = /[^\d]/g;

const verifierDigit = (digits: string): number => {
  let index = 2;
  const reverse: Array<number> = digits.split('').reduce((buffer, number) => {
    return [parseInt(number, 10)].concat(buffer);
  }, []);

  const sum: number = reverse.reduce((buffer, number) => {
    buffer += number * index;
    index = index === 9 ? 2 : index + 1;
    return buffer;
  }, 0);

  const mod: number = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
};

const strip = (number: string, strict?: boolean): string => {
  const regex: RegExp = strict ? STRICT_STRIP_REGEX : LOOSE_STRIP_REGEX;
  return (number || '').replace(regex, '');
};

const format = (number: string): string => {
  return strip(number).replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
};

const isValid = (number: string, strict?: boolean): boolean => {
  const stripped: string = strip(number, strict);

  if (!stripped) {
    return false;
  }

  if (stripped.length !== 14) {
    return false;
  }

  if (BLACKLIST.includes(stripped)) {
    return false;
  }

  let numbers: string = stripped.slice(0, 12);
  numbers += verifierDigit(numbers);
  numbers += verifierDigit(numbers);

  return numbers.slice(-2) === stripped.slice(-2);
};

export default {
  verifierDigit,
  strip,
  format,
  isValid,
};

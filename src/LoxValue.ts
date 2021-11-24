export type LoxValue = number | string | boolean | null; // Add object types later

export const valueToString = (val: LoxValue): string =>
  val === null ? 'nil' : String(val);

export const print = (val: LoxValue) => {
  if (val === null) {
    return 'nil';
  }

  return JSON.stringify(val);
};

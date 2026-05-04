export const isEmail = (val) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

export const isStrongPassword = (val) =>
  val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val);

export const isPositiveNumber = (val) =>
  !isNaN(val) && parseFloat(val) > 0;

export const isRequired = (val) =>
  val !== null && val !== undefined && String(val).trim().length > 0;

export const minimumPasswordLength = 12;
export const maximumPasswordLength = 256;
export const maximumEmailLength = 254;

export function isAccountEmail(email) {
  return typeof email === 'string' && email.length <= maximumEmailLength &&
    /^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(email);
}

export function isAccountPassword(password) {
  return typeof password === 'string' &&
    password.length >= minimumPasswordLength && password.length <= maximumPasswordLength;
}

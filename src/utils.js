export function isObject(v) {
  return Object.prototype.toString.call(v) === "[object Object]";
}

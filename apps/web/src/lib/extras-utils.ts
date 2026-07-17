export function isSauceExtra(extra: { name: string }): boolean {
  return /salsa/i.test(extra.name);
}

export function partitionProductExtras<
  T extends { id: string; name: string; price: number },
>(extras: T[]) {
  const sauces = extras.filter(isSauceExtra);
  const toppings = extras.filter((e) => !isSauceExtra(e));
  return { sauces, toppings };
}

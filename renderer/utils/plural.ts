/** "1 project", "3 projects". */
export const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export function isValidDate(dateString: string): boolean {
  const timestamp = Date.parse(dateString);
  return !isNaN(timestamp);
}

// export function isValidISODate(dateString: unknown): boolean {
//   if (!dateString || typeof dateString !== 'string') return false;

//   // Check format first
//   const regex = /^\d{4}-\d{2}-\d{2}$/;
//   if (!regex.test(dateString)) return false;

//   // Check if it's a valid date
//   const date = new Date(dateString);
//   return (
//     date instanceof Date &&
//     !isNaN(date.getTime()) &&
//     date.toISOString().slice(0, 10) === dateString
//   );
// }

export function isModifyingProtectedProperties(
  updateDto: any,
  protectedProperties: string[],
): boolean {
  for (const property of protectedProperties) {
    if (updateDto[property] !== undefined) {
      return true; // Return true if trying to modify a protected property
    }
  }
  return false; // Return false if no protected properties are being modified
}

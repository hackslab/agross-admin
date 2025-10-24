import { countries_uz } from "../data/countries_uz";

/**
 * Checks if a string starts with a Unicode flag emoji.
 * This regex is a common way to detect flag emojis, which are composed of
 * two "regional indicator" characters.
 * @param name The string to check.
 * @returns `true` if the string starts with a flag, `false` otherwise.
 */
export function hasFlag(name: string): boolean {
  if (!name) return false;
  // Regex to match a pair of regional indicator symbols at the start of the string.
  const flagRegex = /^\p{RI}\p{RI}/u;
  return flagRegex.test(name);
}

/**
 * Finds a country suggestion for a given input string that doesn't have a flag.
 * It searches the `countries_uz` data source for a close match.
 * @param input The flagless input string from the user.
 * @returns The full, correctly formatted country name with a flag, or `null` if no match is found.
 */
export function findCountrySuggestion(input: string): string | null {
  if (!input) return null;

  const trimmedInput = input.trim().toLowerCase();
  const foundCountry = countries_uz.find(
    (country) => country.name_uz.toLowerCase() === trimmedInput
  );

  return foundCountry ? `${foundCountry.flag} ${foundCountry.name_uz}` : null;
}

/**
 * Validates if a given country name exists in the official Uzbek country list.
 * The comparison is case-insensitive and ignores leading/trailing whitespace.
 * @param name The country name to validate.
 * @returns `true` if the name is valid, `false` otherwise.
 */
export function isValidUzbekCountryName(name: string): boolean {
  if (!name) return false;

  const trimmedInput = name.trim().toLowerCase();
  return countries_uz.some(
    (country) => country.name_uz.toLowerCase() === trimmedInput
  );
}

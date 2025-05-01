import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string, resolving Tailwind CSS conflicts.
 * @param inputs - An array of class names (strings, objects, or arrays).
 * @returns A merged string of class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Reads a File or Blob object and returns its content as a Base64 encoded data URI.
 * Includes basic validation for the result type.
 * @param file The File or Blob object to read.
 * @returns A Promise that resolves with the data URI string (e.g., 'data:image/png;base64,...').
 * @rejects An error if the file cannot be read or the result is not a string.
 */
export function readFileAsDataURI(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure a file object is provided
    if (!file) {
      return reject(new Error('No file provided to read.'));
    }

    const reader = new FileReader();

    reader.onload = () => {
      // Check if the result is a string (expected for readAsDataURL)
      if (typeof reader.result === 'string') {
        // Validate if it looks like a data URI (basic check)
        if (reader.result.startsWith('data:')) {
            resolve(reader.result);
        } else {
            reject(new Error('File read result is not a valid data URI format.'));
        }
      } else {
        // This case should ideally not happen with readAsDataURL, but good to handle
        reject(new Error('Failed to read file as a string data URI.'));
      }
    };

    reader.onerror = (error) => {
      // Propagate the FileReader error
      console.error("FileReader error:", error);
      reject(new Error(`Error reading file: ${error.type || 'Unknown error'}`));
    };

    // Start reading the file as Data URL
    try {
        reader.readAsDataURL(file);
    } catch (err) {
        // Catch potential synchronous errors during read initiation
         console.error("Error initiating FileReader:", err);
         reject(new Error(`Could not initiate file reading: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  });
}

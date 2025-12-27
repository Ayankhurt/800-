/**
 * Rork Toolkit SDK Bridge
 * satisfies TypeScript when the SDK is provided by the bunx runtime.
 */

export async function generateText(options: any): Promise<{ text: string }> {
    // This is a placeholder that will be satisfied at runtime if bunx rork is used.
    // If running in an environment without the actual SDK, it will throw.
    throw new Error('Rork Toolkit SDK not found in runtime. Ensure you are running with bunx rork.');
}

export async function generateObject(options: {
    messages: any[];
    schema: any;
}): Promise<{ object: any }> {
    // This is a placeholder that will be satisfied at runtime if bunx rork is used.
    throw new Error('Rork Toolkit SDK not found in runtime. Ensure you are running with bunx rork.');
}

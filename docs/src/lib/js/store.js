import { writable } from "svelte/store";

export let terminalContent = writable([]);

// Method to add content to the terminal
export function addToTerminal(content) {
  terminalContent.update(value => [...value, content]);
}

// Method to clear the terminal
export function clearTerminal() {
  terminalContent.set([]);
}
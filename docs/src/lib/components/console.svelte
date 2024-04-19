<!-- CustomTerminal.svelte -->
<script>
    import { onMount } from 'svelte';

    let terminalContent = [];

    // Method to add content to the terminal
    function addToTerminal(content) {
      terminalContent = [...terminalContent, content];
    }

    // Method to clear the terminal
    function clearTerminal() {
      terminalContent = [];
    }

    // Sample terminal content
    onMount(() => {
      addToTerminal('Welcome to the custom terminal!');
      addToTerminal('Type "help" for a list of commands.');
    });
</script>

<div class="terminal">
    <div class="terminal-bar">
        <div class="terminal-title">Terminal</div>
        <span class="clear-text" on:click={clearTerminal}>Clear</span>
    </div>
    <div class="console">
        {#each terminalContent as line, index}
            <div class="line" class:border="{index !== 0}">
                {line}
            </div>
        {/each}
    </div>
</div>

<style>
    .terminal {
        font-family: 'Fira Code', monospace;
        font-size: 14px;
        background-color: #2A323C;
        color: #abb2bf;
        height: calc(100vh - 32px);
        display: flex;
        flex-direction: column;
    }

    .terminal-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2px 16px;
        background-color: #1e2228;
    }

    .terminal-title {
        font-weight: bold;
        font-size: 14px;
    }

    .clear-text {
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.3s ease;
    }

    .clear-text:hover {
        color: #61afef;
    }

    .console {
        flex-grow: 1;
        overflow-y: auto;
    }

    .line {
        margin-bottom: -1px; /* Remove margin to prevent double borders */
        border: none;
        border-bottom: 1px solid #3e4451; /* Border to distinguish different outputs */
        padding: 8px 16px; /* Add padding to each line */
    }

    .line:first-child {
        border-top: none; /* Remove border from the first line */
    }
</style>

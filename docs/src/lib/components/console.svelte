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
      <span on:click={clearTerminal}>Clear</span>
    </div>
    <div class="console">
      {#each terminalContent as line}
        <div class="line">{line}</div>
      {/each}
    </div>
  </div>
  
  <style>
    .terminal {
      font-family: monospace;
      font-size: 14px;
      background-color: #2a323c;
      color: #ffffff;
      height: calc(100dvh - 32px);
      display: flex;
      flex-direction: column;
    }
  
    .terminal-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 10px;
      background-color: #1e262c;
    }
  
    .terminal-title {
      font-weight: bold;
    }
  
    .clear-button {
      background-color: #e75c58;
      color: #ffffff;
      border: none;
      border-radius: 3px;
      padding: 5px 10px;
      cursor: pointer;
    }
  
    .console {
      flex-grow: 1;
      padding: 10px;
      overflow-y: auto;
    }
  
    .line {
      margin-bottom: 5px;
    }
  </style>
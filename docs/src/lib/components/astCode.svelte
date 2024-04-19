<script>
    import { JsonView } from '@zerodevx/svelte-json-view'
  
    export const json = [];
  </script>
  
  <div class="wrap">
    <JsonView {json} />
  </div>
  
  <style>
    .wrap {
      font-family: monospace;
      font-size: 14px;
      --jsonValStringColor: #0ea5e9;
      background-color: #2A323C;
      @apply h-screen;
    }
  </style>
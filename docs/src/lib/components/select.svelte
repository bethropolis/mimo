<script>
    import { code } from "$lib/js/examples";
    export let source = '';

    function handleSelect(event) {
        const selectedCode = code.find(item => item.name === event.target.value);
        source = selectedCode ? selectedCode.code : '';
    }
</script>

<select class="select select-bordered select-sm w-full max-w-xs" on:change={handleSelect}>
    {#each code as item}
        <option value={item.name}>{item.name}</option>
    {/each}
</select>
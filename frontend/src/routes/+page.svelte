<script lang="ts">
    import { onMount } from 'svelte';

    let message: string = 'Loading...';

    onMount(async () => {
        try {
            const response = await fetch('/api/hello');
            
            if (response.ok) {
                const data = await response.json();
                message = data.message;
            } else {
                message = 'Error: Backend returned ' + response.status;
            }
        } catch (error) {
            console.error(error);
            message = 'Error: Could not connect to backend.';
        }
    });
</script>

<h1>CodeByMe.de</h1>
<p>Backend Status: <strong>{message}</strong></p>
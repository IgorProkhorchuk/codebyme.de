<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="Impressum | CodeByMe" description="Anbieterkennzeichnung und Kontakt für CodeByMe.de." path="/impressum" />

<div class="legal-content" lang="de" data-page-lang>
  <h1>Impressum</h1>

  <h2>Anbieterkennzeichnung</h2>
  <p>Angaben nach § 18 Abs. 1 Medienstaatsvertrag (MStV) sowie, soweit anwendbar, § 5 Digitale-Dienste-Gesetz (DDG).</p>
  <p>Ihor Prokhorchuk<br />Großgörschenstraße 8<br />12163 Berlin<br />Deutschland</p>

  <h2>Kontakt</h2>
  <p>E-Mail: <a href="mailto:igor@codebyme.de">igor@codebyme.de</a></p>

  <h2>Verantwortlich für den redaktionellen Inhalt</h2>
  <p>Verantwortlich im Sinne von § 18 Abs. 2 MStV:<br />Ihor Prokhorchuk<br />Großgörschenstraße 8<br />12163 Berlin<br />Deutschland</p>

  <h2>Datenschutz</h2>
  <p>Informationen zur Verarbeitung personenbezogener Daten und zur Kommentarfunktion finden Sie in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>
</div>

<style>
  .legal-content { max-width: 800px; margin: 0 auto; padding: 2rem 0; }
  .legal-content h1 { margin-bottom: 1.5rem; font-size: 2rem; color: var(--primary); }
  .legal-content h2 { margin-top: 2rem; margin-bottom: 1rem; font-size: 1.25rem; font-weight: 700; color: #333; }
  .legal-content p { line-height: 1.6; color: #444; margin-bottom: 1rem; }
  .legal-content a { color: var(--accent); text-decoration: underline; }
</style>

export function ThemeScript() {
  const codeToRunOnClient = `
    (function() {
      try {
        const theme = localStorage.getItem('theme') || 'system';
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
        
        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: codeToRunOnClient,
      }}
    />
  );
} 
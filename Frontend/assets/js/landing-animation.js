document.addEventListener('DOMContentLoaded', () => {
    // Array of quotes related to journaling, mental health, and growth
    const quotes = [
        {
            text: "Journaling is like whispering to one's self and listening at the same time.",
            author: "Mina Murray"
        },
        {
            text: "I can shake off everything as I write; my sorrows disappear, my courage is reborn.",
            author: "Anne Frank"
        },
        {
            text: "Fill your paper with the breathings of your heart.",
            author: "William Wordsworth"
        },
        {
            text: "Journaling is a voyage to the interior.",
            author: "Christina Baldwin"
        },
        {
            text: "Preserve your memories, keep them well, what you forget you can never retell.",
            author: "Louisa May Alcott"
        },
        {
            text: "Start writing, no matter what. The water does not flow until the faucet is turned on.",
            author: "Louis L'Amour"
        },
        {
            text: "Your journal is like your best friend. You don't have to pretend with it.",
            author: "Unknown"
        },
         {
            text: "Writing is medicine. It is an appropriate antidote to injury. It is a companion in the dark.",
            author: "Julia Cameron"
        }
    ];

    // Select random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Update DOM
    const quoteElement = document.getElementById('preloader-quote-text');
    const authorElement = document.getElementById('preloader-quote-author');
    
    if (quoteElement && authorElement) {
        quoteElement.textContent = `"${randomQuote.text}"`;
        authorElement.textContent = `- ${randomQuote.author}`;
    }

    // Handle fade out
    const preloader = document.getElementById('preloader');
    
    // Ensure the loading screen stays for at least a moment (e.g., 2.5 seconds) so users can read the quote
    // regardless of how fast the page actually loads.
    
    // We'll use window.onload to ensure all assets (images, etc.) are loaded,
    // but also set a minimum timeout.
    
    const minDisplayTime = 4000; // 4 seconds
    const startTime = Date.now();

    window.addEventListener('load', () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('preloader-hidden');
                
                // Optional: Remove it from DOM after transition matches CSS transition time (0.8s)
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 800);
            }
        }, remainingTime);
    });
});

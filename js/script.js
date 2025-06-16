/**
* Swiftlink Logistics Website JavaScript
*/

document.addEventListener('DOMContentLoaded', function() {

    // --- Original Functionalities ---

    // Update Footer Year
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Optional: Add active class to nav link based on current page
    const navLinks = document.querySelectorAll('#navbarNav .nav-link');
    const currentPage = window.location.pathname.split('/').pop();
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        if (currentPage === linkPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    // Optional: Basic Frontend Form Validation Example (adjust selector for Formspree)
    const contactForm = document.querySelector('form[action*="formspree.io"]'); // Updated selector for Formspree
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            let isValid = true;
            const requiredFields = contactForm.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                field.classList.remove('is-invalid', 'is-valid'); // Clear previous states
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('is-invalid');
                    console.error(`Field "${field.name || field.id}" is required.`);
                } else {
                    // Only add 'is-valid' if you want green ticks on valid fields after submit attempt
                    // field.classList.add('is-valid');
                }
            });

            if (!isValid) {
                event.preventDefault();
                alert('Please fill in all required fields.');
            }
        });

        // Remove validation classes on input
        contactForm.querySelectorAll('[required]').forEach(field => {
            field.addEventListener('input', () => {
                field.classList.remove('is-invalid', 'is-valid');
            });
        });
    }

    // Optional: Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.length > 1 && document.querySelector(href)) {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 10;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    // --- End Original Functionalities ---


    /**
    * ======================================================
    * AI Chat Assistant Logic (Gemini Client-Side)
    * WARNING: API KEY IS EXPOSED IN CLIENT-SIDE CODE - INSECURE
    * ======================================================
    */

    // --- Configuration ---
    const API_KEY = "AIzaSyCiBBwZsOAXcP7bw0Cn745S09guqIAfTns"; // <--- 🛑 YOUR KEY HERE (INSECURE) 🛑
    const MODEL_NAME = "gemini-2.0-flash";

    // --- DOM Elements ---
    const chatToggleButton = document.getElementById('chat-toggle-button');
    const chatContainer = document.getElementById('chat-container');
    const chatCloseButton = document.getElementById('chat-close-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');
    const chatLoading = document.getElementById('chat-loading');

    // --- State ---
    let chatSession;
    let isChatOpen = false;
    let GoogleGenerativeAI;

    // --- Initialize SDK ---
    const checkSDKInterval = setInterval(async () => {
        if (window['@google/generative-ai'] && window['@google/generative-ai'].GoogleGenerativeAI) {
            clearInterval(checkSDKInterval);
            GoogleGenerativeAI = window['@google/generative-ai'].GoogleGenerativeAI;
            console.log("Google AI SDK Loaded.");
            initializeChat();
        } else {
            console.log("Waiting for Google AI SDK...");
        }
    }, 100);

    function initializeChat() {
        // --- ⬇️ CORRECTED API KEY CHECK HERE ⬇️ ---
        if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") { // Check against the *placeholder*
            console.error("Gemini API Key not set or is placeholder. Chatbot disabled.");
            if(chatToggleButton) chatToggleButton.style.display = 'none';
            if(chatContainer) chatContainer.style.display = 'none';
            return;
        }
        // --- ⬆️ CORRECTED API KEY CHECK HERE ⬆️ ---


        try {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({
                 model: MODEL_NAME,
                 systemInstruction: `You are a helpful and professional AI assistant for Swiftlink Logistics (Pvt) Ltd., a freight forwarding company based in Sri Lanka... [Rest of system instruction]` // Truncated for brevity
            });

            chatSession = model.startChat({
                history: [
                     { role: "user", parts: [{ text: "Tell me briefly about Swiftlink Logistics." }] },
                     { role: "assistant", parts: [{ text: "Swiftlink Logistics (Pvt) Ltd. is a dynamic freight forwarding company in Sri Lanka offering comprehensive end-to-end logistics solutions..." }] } // Truncated
                ],
                generationConfig: { }
            });
            console.log("Gemini Chat Session Initialized.");

        } catch (error) {
            console.error("Error initializing Gemini:", error);
            displayMessage("Error initializing AI. Please try refreshing.", "system-error");
            if(chatToggleButton) chatToggleButton.style.display = 'none';
        }
    }

    // --- UI Functions ---
    function toggleChat() {
        isChatOpen = !isChatOpen;
        chatContainer.classList.toggle('open', isChatOpen);
        if (isChatOpen) {
            chatInput.focus();
        }
    }

    function displayMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showLoading(show) {
        chatLoading.style.display = show ? 'flex' : 'none';
    }

    // --- Send Message Logic ---
    async function handleSendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        if (!chatSession) {
            console.error("Chat session not initialized.");
            displayMessage("Chat is not ready. Please wait or refresh.", "system-error");
            return;
        }

        displayMessage(messageText, 'user');
        chatInput.value = '';
        showLoading(true);
        chatSendButton.disabled = true;
        chatInput.disabled = true;

        try {
            const result = await chatSession.sendMessage(messageText);
            const response = await result.response;
            const aiText = await response.text();
            displayMessage(aiText, 'assistant');
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            displayMessage("Sorry, I encountered an error. Please try again.", "assistant");
        } finally {
            showLoading(false);
            chatSendButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    // --- Event Listeners ---
    if (chatToggleButton) chatToggleButton.addEventListener('click', toggleChat);
    if (chatCloseButton) chatCloseButton.addEventListener('click', toggleChat);
    if (chatSendButton) chatSendButton.addEventListener('click', handleSendMessage);
    if (chatInput) chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleSendMessage();
    });

    // --- End AI Chat Assistant Logic ---

}); // End Combined DOMContentLoaded
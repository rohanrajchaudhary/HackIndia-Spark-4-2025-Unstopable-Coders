// --- Configuration ---
// !! IMPORTANT: Replace with your actual API Key !!
// !! WARNING: DO NOT hardcode this in production client-side code. Use a backend proxy. !!
const API_KEY = 'AIzaSyCFNBt0bVAw-KU4g12T2IXh8F-yNnBNs5M'; // Replace with your API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${}`; // Replace with your API URL

// --- DOM Elements ---
const promptInput = document.getElementById('prompt-input');
const generateButton = document.getElementById('generate-button');
const outputContent = document.getElementById('output-content');
const statusMessage = document.getElementById('status-message');
const errorMessage = document.getElementById('error-message');

// --- Event Listener ---
generateButton.addEventListener('click', handleGenerateClick);

// --- Functions ---
async function handleGenerateClick() {
    const promptText = promptInput.value.trim();

    if (!promptText) {
        showError("Please enter a prompt.");
        return;
    }

    // Disable button and show loading state
    toggleLoading(true);
    clearMessages();
    statusMessage.textContent = 'Generating content... Please wait.';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
                // You can add generationConfig here if needed, e.g.,
                // generationConfig: {
                //   temperature: 0.7,
                //   maxOutputTokens: 2048,
                // }
            })
        });

        if (!response.ok) {
            // Try to get error details from the response body
            let errorDetails = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetails += ` - ${errorData.error?.message || JSON.stringify(errorData)}`;
            } catch (jsonError) {
                // Ignore if response body is not JSON or empty
            }
            throw new Error(errorDetails);
        }

        const data = await response.json();

        // Process the response (structure might vary slightly based on Gemini version/settings)
        // Check the actual API response structure in your browser's developer console if needed
        if (data.candidates && data.candidates.length > 0 &&
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0) {
            const generatedText = data.candidates[0].content.parts[0].text;
            outputContent.textContent = generatedText;
            statusMessage.textContent = 'Content generated successfully!';
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            // Handle cases where the prompt was blocked
            showError(`Generation failed: Prompt blocked due to ${data.promptFeedback.blockReason}. Reason details: ${data.promptFeedback.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ')}`);
            outputContent.textContent = 'Generation failed due to safety or policy reasons.';
        } else {
            // Handle unexpected response structure
            console.error("Unexpected API response structure:", data);
            showError("Received an unexpected response format from the API.");
            outputContent.textContent = 'Could not parse the generated content.';
        }

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        showError(`An error occurred: ${error.message}`);
        outputContent.textContent = 'Failed to generate content.';
    } finally {
        // Re-enable button and clear loading message (unless an error message replaced it)
        toggleLoading(false);
        if (!errorMessage.style.display || errorMessage.style.display === 'none') {
           // Only clear status if no error is shown
           setTimeout(() => { if(statusMessage.textContent.includes('success')) statusMessage.textContent = ''; }, 3000); // Clear success message after 3s
        } else {
             statusMessage.textContent = ''; // Clear loading message if error is shown
        }
    }
}

function toggleLoading(isLoading) {
    generateButton.disabled = isLoading;
    if (isLoading) {
        generateButton.textContent = 'Generating...';
    } else {
        generateButton.textContent = 'Generate Content';
    }
}

function clearMessages() {
    statusMessage.textContent = '';
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    statusMessage.textContent = ''; // Clear status message when error occurs
}
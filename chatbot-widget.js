// Floating chatbot widget for FarmSathi.
// Relies on window.FarmSathiAPI.postChatbot provided by app.js.

const CHATBOT_OPEN_KEY = "farmsathi_chatbot_open";

function createChatbotElements() {
  const button = document.createElement("button");
  button.id = "chatbotToggle";
  button.className = "chatbot-toggle";
  button.type = "button";
  button.title = "Chat with FarmSathi assistant";
  button.textContent = "💬";

  const wrapper = document.createElement("div");
  wrapper.id = "chatbotWrapper";
  wrapper.className = "chatbot-wrapper hidden";
  wrapper.innerHTML = `
    <div class="chatbot-header">
      <span>FarmSathi Chatbot</span>
      <button type="button" class="chatbot-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="chatbot-body" id="chatbotMessages" aria-live="polite"></div>
    <form id="chatbotForm" class="chatbot-form">
      <input
        id="chatbotInput"
        type="text"
        placeholder="Type your question here..."
        required
        autocomplete="off"
      />
      <button type="submit" class="btn btn-primary">Send</button>
    </form>
  `;

  document.body.appendChild(button);
  document.body.appendChild(wrapper);

  return { button, wrapper };
}

function appendMessage(text, sender) {
  const container = document.getElementById("chatbotMessages");
  if (!container) return;
  const msg = document.createElement("div");
  msg.className = `chatbot-message chatbot-${sender}`;
  // Preserve line breaks and format text better
  msg.innerHTML = text.replace(/\n/g, '<br>');
  container.appendChild(msg);
  // Smooth scroll to bottom
  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth'
  });
}

function setOpenState(isOpen) {
  const wrapper = document.getElementById("chatbotWrapper");
  if (!wrapper) return;
  if (isOpen) {
    wrapper.classList.remove("hidden");
  } else {
    wrapper.classList.add("hidden");
  }
  try {
    localStorage.setItem(CHATBOT_OPEN_KEY, isOpen ? "1" : "0");
  } catch {
    // ignore
  }
}

function getOpenState() {
  try {
    return localStorage.getItem(CHATBOT_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function initChatbotWidget() {
  if (!window.FarmSathiAPI || !window.FarmSathiAPI.postChatbot) {
    // app.js not yet loaded; delay a bit
    setTimeout(initChatbotWidget, 300);
    return;
  }

  const { button, wrapper } = createChatbotElements();

  const initialOpen = getOpenState();
  if (initialOpen) {
    wrapper.classList.remove("hidden");
  }
  
  // Add welcome message if chat is empty
  const messages = document.getElementById("chatbotMessages");
  if (messages && messages.children.length === 0) {
    appendMessage("Hello! I'm your FarmSathi assistant. I can help you with crop recommendations, fertilizer advice, and disease detection. How can I assist you today?", "bot");
  }

  button.addEventListener("click", () => {
    const isHidden = wrapper.classList.contains("hidden");
    setOpenState(isHidden);
    // Add welcome message if opening for first time and chat is empty
    if (isHidden) {
      setTimeout(() => {
        const messages = document.getElementById("chatbotMessages");
        if (messages && messages.children.length === 0) {
          appendMessage("Hello! I'm your FarmSathi assistant. I can help you with crop recommendations, fertilizer advice, and disease detection. How can I assist you today?", "bot");
        }
      }, 100);
    }
  });

  wrapper
    .querySelector(".chatbot-close")
    .addEventListener("click", () => setOpenState(false));

  const form = document.getElementById("chatbotForm");
  const input = document.getElementById("chatbotInput");
  const api = window.FarmSathiAPI;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    appendMessage(query, "user");
    input.value = "";
    appendMessage("Thinking...", "typing");

    try {
      const reply = await api.postChatbot(query);
      const messages = document.getElementById("chatbotMessages");
      if (messages && messages.lastChild) {
        messages.lastChild.remove();
      }
      // Handle both string and object responses
      const replyText = typeof reply === 'string' ? reply : (reply.response || reply.message || JSON.stringify(reply));
      appendMessage(replyText || "No response received.", "bot");
    } catch (err) {
      const messages = document.getElementById("chatbotMessages");
      if (messages && messages.lastChild) {
        messages.lastChild.remove();
      }
      const errorMsg = err.message || "Sorry, something went wrong. Please try again.";
      appendMessage(`Error: ${errorMsg}`, "bot");
      // Also log to console for debugging
      console.error("Chatbot error:", err);
    }
  });
}

document.addEventListener("DOMContentLoaded", initChatbotWidget);



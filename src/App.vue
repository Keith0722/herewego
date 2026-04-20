<template>
  <div class="app-container">
    <h1>🚌 Bus Seating Manager</h1>
    
    <BusLayout />

    <div class="ai-chat-container">
      <h3>🤖 AI Booking Assistant</h3>
      
      <div class="chat-window">
        <div v-for="(msg, index) in chatHistory" :key="index" :class="['chat-bubble', msg.role]">
          <strong>{{ msg.role === 'user' ? 'You' : 'AI' }}:</strong> {{ msg.text }}
        </div>
        <div v-if="isTyping" class="chat-bubble ai typing">AI is thinking...</div>
      </div>

      <div class="chat-input-area">
        <input 
          v-model="userInput" 
          @keyup.enter="sendMessage" 
          placeholder="Type your message here..." 
        />
        <button @click="sendMessage" :disabled="isTyping">
          Send
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import './style.css'; 

// Import the new layout component we just created
import BusLayout from './components/BusLayout.vue';

// --- AI Chat Logic (Unchanged) ---
const chatHistory = ref([
  { role: 'ai', text: 'Hello! I am your AI assistant. How can I help you manage the buses today?' }
]);
const userInput = ref('');
const isTyping = ref(false);

const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const currentMessage = userInput.value;
  chatHistory.value.push({ role: 'user', text: currentMessage });
  userInput.value = ''; 
  isTyping.value = true;

  try {
    const response = await fetch('http://192.168.122.128:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: currentMessage })
    });

    const data = await response.json();
    chatHistory.value.push({ role: 'ai', text: data.reply });
  } catch (error) {
    console.error("Chat error:", error);
    chatHistory.value.push({ role: 'ai', text: 'System Error: Could not reach the AI brain.' });
  } finally {
    isTyping.value = false;
  }
};
</script>
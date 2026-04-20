<template>
  <div class="app-container">
    <h1>🚌 Fleet Scheduling & Booking Admin</h1>
    
    <div class="dashboard">
      
      <div class="schedule-panel">
        <h3>📅 Schedule New Trip</h3>
        <div class="form-row">
          <select v-model="newTrip.destination">
            <option value="" disabled>Select Destination...</option>
            <option v-for="dest in destinations" :key="dest" :value="dest">{{ dest }}</option>
          </select>
          
          <select v-model="newTrip.busClass">
            <option value="classB">Class B</option>
            <option value="classC">Class C</option>
          </select>
        </div>

        <div class="form-row">
          <input type="date" v-model="newTrip.date" :min="todayDate" />
          <select v-model="newTrip.shift">
            <option value="morning">Morning Shift (08:00 AM)</option>
            <option value="night">Night Shift (09:00 PM)</option>
          </select>
        </div>
        
        <button class="add-trip-btn" @click="scheduleTrip">+ Schedule Trip</button>
      </div>

      <div class="active-trips-panel">
        <h3>🛣️ Active Trips</h3>
        <div v-if="trips.length === 0" class="no-trips">No trips scheduled.</div>
        
        <div class="trip-grid">
          <div 
            v-for="trip in trips" 
            :key="trip._id || trip.id" 
            :class="['trip-card', { active: activeTrip && (activeTrip._id === trip._id || activeTrip.id === trip.id) }]"
            @click="selectTrip(trip)"
          >
            <div class="trip-header">
              <strong>{{ trip.destination }}</strong>
              <span class="badge">{{ trip.busClass.toUpperCase() }}</span>
            </div>
            <div class="trip-details">
              <span>📅 {{ formatDate(trip.date) }}</span>
              <span>⏰ {{ trip.shift === 'morning' ? '08:00 AM' : '09:00 PM' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <hr class="divider" />

    <div v-if="activeTrip" class="layout-section">
      <h2 class="layout-title">
        Managing Seats: {{ activeTrip.destination }} on {{ formatDate(activeTrip.date) }} ({{ activeTrip.shift }})
      </h2>
      
      <BusLayout :key="activeTrip._id || activeTrip.id" />
    </div>
    <div v-else class="empty-state">
      <p>👈 Select a trip from the dashboard above to manage seating.</p>
    </div>

    <hr class="divider" />

    <div class="ai-chat-container">
      <h3>🤖 AI Booking Assistant</h3>
      <div class="chat-window">
        <div v-for="(msg, index) in chatHistory" :key="index" :class="['chat-bubble', msg.role]">
          <strong>{{ msg.role === 'user' ? 'You' : 'AI' }}:</strong> {{ msg.text }}
        </div>
        <div v-if="isTyping" class="chat-bubble ai typing">AI is thinking...</div>
      </div>
      <div class="chat-input-area">
        <input v-model="userInput" @keyup.enter="sendMessage" placeholder="Type your message here..." />
        <button @click="sendMessage" :disabled="isTyping">Send</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BusLayout from './components/BusLayout.vue';
import './style.css'; 

const destinations = ["Ilocos", "Pampanga", "Zambales", "Baguio", "Apari", "La Union", "Nueva Ecija", "Tugegarao", "Laog", "Pangasinan"];
const todayDate = new Date().toISOString().split('T')[0];

const newTrip = ref({ destination: '', busClass: 'classB', date: todayDate, shift: 'morning' });

// Start with an empty list. We will let the database fill it!
const trips = ref([]); 
const activeTrip = ref(null);

// ==========================================
// THE BACKEND CONNECTION
// ==========================================

// 1. Fetch real trips from MongoDB when the app starts
onMounted(async () => {
  try {
    const response = await fetch('http://192.168.122.128:3000/api/trips');
    trips.value = await response.json();
  } catch (error) {
    console.error("Failed to load fleet schedule from database:", error);
  }
});

// 2. Save new trips permanently to MongoDB
const scheduleTrip = async () => {
  if (!newTrip.value.destination || !newTrip.value.date) {
    alert("Please select a destination and date.");
    return;
  }
  
  try {
    const response = await fetch('http://192.168.122.128:3000/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrip.value)
    });
    
    // The backend sends back the newly saved trip (which now has a real MongoDB _id)
    const savedTrip = await response.json();
    
    // Push the real database object to the screen
    trips.value.push(savedTrip); 
    newTrip.value.destination = ''; // Reset the dropdown
  } catch (error) {
    console.error("Failed to schedule trip:", error);
  }
};

// ==========================================

const selectTrip = (trip) => {
  activeTrip.value = trip;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- AI CHAT LOGIC (Disabled for now) ---
const chatHistory = ref([{ role: 'ai', text: 'Hello! I am your AI assistant. How can I help you manage the fleet today?' }]);
const userInput = ref('');
const isTyping = ref(false);

const sendMessage = async () => {
  if (!userInput.value.trim()) return;
  chatHistory.value.push({ role: 'user', text: userInput.value });
  userInput.value = ''; 
};
</script>

<style scoped>
.dashboard { display: flex; gap: 20px; width: 100%; max-width: 1000px; margin: 0 auto; }
.schedule-panel { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #ddd; }
.schedule-panel h3 { margin-top: 0; margin-bottom: 15px; color: #333; }
.form-row { display: flex; gap: 10px; margin-bottom: 15px; }
.form-row select, .form-row input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
.add-trip-btn { width: 100%; padding: 12px; background-color: #27ae60; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.2s; }
.add-trip-btn:hover { background-color: #219653; }
.active-trips-panel { flex: 2; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #ddd; }
.active-trips-panel h3 { margin-top: 0; color: #333; }
.trip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; max-height: 200px; overflow-y: auto; }
.trip-card { border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s ease; background: #fafafa; }
.trip-card:hover { border-color: #4a90e2; transform: translateY(-2px); }
.trip-card.active { border-color: #4a90e2; background-color: #eaf3fc; box-shadow: 0 4px 8px rgba(74, 144, 226, 0.2); }
.trip-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 1.1rem; }
.badge { background: #333; color: white; font-size: 0.7rem; padding: 3px 6px; border-radius: 4px; }
.trip-details { display: flex; flex-direction: column; font-size: 0.85rem; color: #666; gap: 4px; }
.divider { margin: 30px 0; border: none; border-top: 2px dashed #ccc; }
.layout-section { display: flex; flex-direction: column; align-items: center; }
.layout-title { margin-bottom: 10px; color: #2c3e50; }
.empty-state { text-align: center; color: #7f8c8d; font-size: 1.2rem; padding: 40px; }
</style>
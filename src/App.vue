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
            <option value="classA">Class A</option>
            <option value="classB">Class B</option>
          </select>
        </div>

        <div class="form-row">
          <input type="date" v-model="newTrip.date" :min="todayDate" />
          <select v-model="newTrip.shift">
            <option value="morning">Morning Shift (08:00 AM)</option>
            <option value="night">Night Shift (09:00 PM)</option>
          </select>
        </div>

        <div class="form-row">
          <select v-model="newTrip.numberOfBuses">
            <option :value="1">1 Bus</option>
            <option :value="2">2 Buses</option>
            <option :value="3">3 Buses</option>
            <option :value="4">4 Buses (Max)</option>
          </select>
        </div>
        
        <button class="add-trip-btn" @click="scheduleTrip">+ Schedule Trip(s)</button>
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
              <strong>{{ trip.destination }} (Bus {{ trip.busNumber || 1 }})</strong>
              <div class="header-actions">
                <span class="badge">{{ trip.busClass }}</span>
                <button class="delete-trip-btn" @click.stop="deleteTrip(trip._id || trip.id)" title="Delete Trip">🗑️</button>
              </div>
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
  Managing Seats: {{ activeTrip.destination }} - {{ activeTrip.busClass }} (Bus {{ activeTrip.busNumber || 1 }}) on {{ formatDate(activeTrip.date) }}
</h2>
      
      <BusLayout :key="activeTrip._id || activeTrip.id" :activeTrip="activeTrip" />
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

const newTrip = ref({ destination: '', busClass: 'ClassA', date: todayDate, shift: 'morning', numberOfBuses: 1 });

const trips = ref([]); 
const activeTrip = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('http://192.168.122.129:3000/api/trips');
    if (response.ok) {
      trips.value = await response.json();
    }
  } catch (error) {
    console.error("Failed to load trips from DB:", error);
  }
});

const scheduleTrip = async () => {
  if (!newTrip.value.destination || !newTrip.value.date) {
    alert("Please select a destination and date.");
    return;
  }
  
  try {
    const response = await fetch('http://192.168.122.129:3000/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrip.value)
    });
    
    if (response.ok) {
      const savedTrips = await response.json();
      trips.value.push(...savedTrips); 
      newTrip.value.destination = ''; 
      newTrip.value.numberOfBuses = 1;
    } else {
      const err = await response.text();
      alert("Server Error: " + err);
    }
  } catch (error) {
    alert("Network Error! Could not reach Ubuntu. Is Node running? Error: " + error.message);
  }
};

const selectTrip = (trip) => {
  activeTrip.value = trip;
};

// NEW: DELETE LOGIC
const deleteTrip = async (tripId) => {
  if (!confirm("Are you sure you want to permanently delete this trip and all its bookings?")) {
    return;
  }

  try {
    const response = await fetch(`http://192.168.122.129:3000/api/trips/${tripId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      
      trips.value = trips.value.filter(t => (t._id || t.id) !== tripId);
      
      
      if (activeTrip.value && (activeTrip.value._id === tripId || activeTrip.value.id === tripId)) {
        activeTrip.value = null;
      }
    } else {
      alert("Failed to delete trip. Server responded with an error.");
    }
  } catch (error) {
    console.error("Error deleting trip:", error);
    alert("Network Error! Could not delete the trip.");
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- AI CHAT LOGIC ---
const chatHistory = ref([{ role: 'ai', text: 'Hello! I am your AI assistant. How can I help you manage the fleet today?' }]);
const userInput = ref('');
const isTyping = ref(false);

const sendMessage = async () => {
  if (!userInput.value.trim()) return;
  const currentMessage = userInput.value;
  chatHistory.value.push({ role: 'user', text: currentMessage });
  userInput.value = ''; 
  isTyping.value = true;

  try {
    
    const currentTripId = activeTrip.value ? (activeTrip.value._id || activeTrip.value.id) : null;

    const response = await fetch('http://192.168.122.129:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: currentMessage, 
        activeTripId: currentTripId // Send the spatial context!
      })
    });
    const data = await response.json();
    chatHistory.value.push({ role: 'ai', text: data.reply });

    // 2. IF THE AI BOOKED A SEAT, INSTANTLY REFRESH THE SCREEN
    if (data.refreshNeeded) {
      const refreshResponse = await fetch('http://192.168.122.129:3000/api/trips');
      if (refreshResponse.ok) {
        trips.value = await refreshResponse.json();
       
        activeTrip.value = trips.value.find(t => (t._id || t.id) === currentTripId);
      }
    }

  } catch (error) {
    chatHistory.value.push({ role: 'ai', text: 'System Error: Could not reach the AI brain.' });
  } finally {
    isTyping.value = false;
  }
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
.header-actions { display: flex; align-items: center; gap: 8px; }
.badge { background: #333; color: white; font-size: 0.7rem; padding: 3px 6px; border-radius: 4px; }
.delete-trip-btn { background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.6; transition: 0.2s; padding: 0; }
.delete-trip-btn:hover { opacity: 1; transform: scale(1.2); }
.trip-details { display: flex; flex-direction: column; font-size: 0.85rem; color: #666; gap: 4px; }
.divider { margin: 30px 0; border: none; border-top: 2px dashed #ccc; }
.layout-section { display: flex; flex-direction: column; align-items: center; }
.layout-title { margin-bottom: 10px; color: #2c3e50; }
.empty-state { text-align: center; color: #7f8c8d; font-size: 1.2rem; padding: 40px; }
</style>


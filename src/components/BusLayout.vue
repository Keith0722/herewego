<template>
  <div class="bus-container">
    <h2>Select a Seat to Add Details</h2>
    
    <div class="bus-body">
      <div class="row-front">
        <div class="seat driver disabled">Driver</div>
        <div class="seat guide" :class="seatClass('guide')" @click="openModal('guide')">Guide</div>
      </div>

      <div class="cabin">
        <div v-for="row in standardRows" :key="row" class="row-standard">
          <div class="seat" :class="seatClass(`${row}A`)" @click="openModal(`${row}A`)">{{ row }}A</div>
          <div class="seat" :class="seatClass(`${row}B`)" @click="openModal(`${row}B`)">{{ row }}B</div>
          
          <div class="aisle"></div> 
          
          <div class="seat" :class="seatClass(`${row}C`)" @click="openModal(`${row}C`)">{{ row }}C</div>
          <div class="seat" :class="seatClass(`${row}D`)" @click="openModal(`${row}D`)">{{ row }}D</div>
        </div>
      </div>

      <div class="row-back">
        <div v-for="seatNum in 5" :key="`back-${seatNum}`" 
             class="seat" 
             :class="seatClass(`Back-${seatNum}`)" 
             @click="openModal(`Back-${seatNum}`)">
          B{{ seatNum }}
        </div>
      </div>
    </div>

    <div class="summary" v-if="bookedSeatsList.length > 0">
      <p><strong>Booked Seats ({{ bookedSeatsList.length }}):</strong></p>
      <ul style="list-style-type: none; padding: 0; margin-top: 10px;">
        <li v-for="seat in bookedSeatsList" :key="seat.id" class="summary-item">
          <span>✅ {{ seat.text }}</span>
          <button @click="cancelBooking(seat.id)" class="cancel-btn" title="Cancel Booking">❌</button>
        </li>
      </ul>
    </div>

    <div v-if="activeSeat" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Seat #{{ activeSeat.id }} Details</h3>
        
        <div class="form-group">
          <label>Passenger Name</label>
          <input type="text" v-model="activeSeat.passengerName" placeholder="Enter name..." />
        </div>

        <div class="form-group">
          <label>Age</label>
          <input 
            type="number" 
            v-model="activeSeat.passengerAge" 
            min="0" 
            @input="activeSeat.passengerAge = activeSeat.passengerAge < 0 ? 0 : activeSeat.passengerAge"
            placeholder="Enter age..."/>
        </div>

        <div class="form-group">
          <label>Gender</label>
          <select v-model="activeSeat.passengerGender">
            <option value="" disabled>Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

       <div class="form-group">
          <label>Status</label>
          <select v-model="activeSeat.status">
            <option :value="0">Available</option>
            <option :value="2">Booked</option>
            <option :value="3">Unavailable (Broken)</option>
          </select>
        </div>

        <button @click="closeModal" class="save-btn">Save & Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps(['activeTrip']);
const standardRows = Array.from({ length: 8 }, (_, i) => i + 1);

const seatsData = ref({});
const activeSeat = ref(null);

const loadSeats = () => {
  if (props.activeTrip && props.activeTrip.seats) {
    const initialData = {};
    props.activeTrip.seats.forEach(seat => {
      initialData[seat.id] = seat;
    });
    seatsData.value = initialData;
  } else {
    seatsData.value = {};
  }
};

onMounted(loadSeats);
watch(() => props.activeTrip, loadSeats, { deep: true });

const openModal = (seatId) => {
  if (!seatsData.value[seatId]) {
    seatsData.value[seatId] = {
      id: seatId,
      status: 0, 
      passengerName: '',
      passengerAge: null,
      passengerGender: ''
    };
  }
  activeSeat.value = seatsData.value[seatId];
};

const closeModal = async () => {
  if (activeSeat.value.passengerName && activeSeat.value.status === 0) {
    activeSeat.value.status = 2;
  }
  
  seatsData.value = { ...seatsData.value }; 
  activeSeat.value = null; 

  try {
    const tripId = props.activeTrip._id || props.activeTrip.id;
    await fetch(`http://192.168.122.128:3000/api/trips/${tripId}/seats`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: Object.values(seatsData.value) })
    });
  } catch (error) {
    console.error("Failed to sync seats with database:", error);
  }
};

// NEW: Instantly cancel a booking and update the database
const cancelBooking = async (seatId) => {
  if (confirm(`Are you sure you want to cancel the booking for Seat ${seatId}?`)) {
    // Reset the seat to totally empty and available
    seatsData.value[seatId] = {
      id: seatId,
      status: 0,
      passengerName: '',
      passengerAge: null,
      passengerGender: ''
    };
    
    // Force UI to redraw
    seatsData.value = { ...seatsData.value };

    // Send the cleared data to the database
    try {
      const tripId = props.activeTrip._id || props.activeTrip.id;
      await fetch(`http://192.168.122.128:3000/api/trips/${tripId}/seats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats: Object.values(seatsData.value) })
      });
    } catch (error) {
      console.error("Failed to delete booking from database:", error);
    }
  }
};

const seatClass = (seatId) => {
  const seat = seatsData.value[seatId];
  if (!seat) return ''; 
  if (seat.status === 2) return 'booked'; 
  if (seat.status === 3) return 'unavailable'; 
  return '';
};

// UPDATED: Now includes Gender and formats data perfectly for the cancel button
const bookedSeatsList = computed(() => {
  return Object.values(seatsData.value)
    .filter(seat => seat.status === 2)
    .map(seat => {
      const genderLabel = seat.passengerGender ? ` | ${seat.passengerGender}` : '';
      return {
        id: seat.id,
        text: `${seat.id}: ${seat.passengerName || 'Unnamed'} (${seat.passengerAge || 'N/A'} yrs${genderLabel})`
      };
    });
});
</script>

<style scoped>
.bus-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Arial, sans-serif;
  margin-top: 20px;
}

.bus-body {
  background-color: #f0f0f0;
  border: 4px solid #333;
  border-radius: 20px 20px 10px 10px;
  padding: 30px 20px;
  width: 350px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.seat {
  width: 45px;
  height: 45px;
  background-color: #ddd;
  border: 2px solid #aaa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seat:hover:not(.disabled) {
  background-color: #c0d8f0;
  border-color: #4a90e2;
}

.seat.booked {
  background-color: #27ae60;
  color: white;
  border-color: #1e8449;
}

.seat.unavailable {
  background-color: #e74c3c;
  border-color: #c0392b;
  color: white;
  cursor: not-allowed;
}

.seat.disabled {
  background-color: #555;
  border-color: #333;
  color: #fff;
  cursor: not-allowed;
}

.row-front {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.cabin {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 15px;
}

.row-standard { display: flex; justify-content: space-between; }
.aisle { width: 40px; }
.row-back { display: flex; justify-content: space-between; margin-top: 20px; }

.summary {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: left;
  width: 350px;
}

/* NEW STYLES FOR THE CANCEL BUTTON */
.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px dashed #eee;
}

.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.6;
  transition: 0.2s;
}

.cancel-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.modal-content h3 {
  margin-top: 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.form-group input, .form-group select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.save-btn {
  width: 100%;
  padding: 10px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 10px;
}

.save-btn:hover { background-color: #357abd; }
</style>
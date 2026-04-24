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

    <div class="summary" v-if="Object.keys(groupedSeats).length > 0">
      <div class="summary-header">
        <p><strong>Booking Manifest</strong></p>
        <p class="revenue">Bus Total: ₱{{ totalRevenue.toFixed(2) }}</p>
      </div>

      <div class="groups-container">
        <div v-for="(group, groupName) in groupedSeats" :key="groupName" class="group-section">
          <div class="group-header">
            <h4>{{ groupName === 'Individual Bookings' ? '🧑 Individual Bookings' : `👨‍👩‍👧‍👦 Group: ${groupName}` }}</h4>
            <span class="group-total">Subtotal: ₱{{ group.total.toFixed(2) }}</span>
          </div>
          
          <ul style="list-style-type: none; padding: 0; margin-top: 5px;">
            <li v-for="seat in group.seats" :key="seat.id" class="summary-item">
              <span class="seat-info">
                <strong>{{ seat.id }}</strong>: {{ seat.passengerName || 'Unnamed' }} 
                <span class="seat-meta">({{ seat.passengerAge || 'N/A' }} yrs <span v-if="seat.passengerGender">| {{ seat.passengerGender }}</span>)</span>
              </span>
              <div class="seat-actions">
                <span class="seat-fare">₱{{ seat.fare ? seat.fare.toFixed(2) : '0.00' }}</span>
                <button @click="cancelBooking(seat.id)" class="cancel-btn" title="Cancel Booking">❌</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="activeSeat" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Seat #{{ activeSeat.id }} Details</h3>
        
        <div class="form-group group-highlight">
          <label>Group/Family Name (Optional)</label>
          <input type="text" v-model="activeSeat.groupName" placeholder="e.g. Smith Family" />
          <small>Leave blank for individual bookings</small>
        </div>

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

        <div class="fare-display">
          <span>Ticket Price: <strong>₱{{ calculatedFare.toFixed(2) }}</strong></span>
          <span v-if="activeSeat.passengerAge >= 60" class="discount-badge senior">Senior (20% Off)</span>
          <span v-else-if="activeSeat.passengerAge !== null && activeSeat.passengerAge <= 12" class="discount-badge child">Child (15% Off)</span>
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

const fareMatrix = {
  "Ilocos": { "Class A": 750, "Class B": 450 },
  "Pampanga": { "Class A": 500, "Class B": 400 },
  "Zambales": { "Class A": 450, "Class B": 390 },
  "Baguio": { "Class A": 585, "Class B": 485 },
  "Apari": { "Class A": 1300, "Class B": 975 },
  "La Union": { "Class A": 850, "Class B": 750 },
  "Nueva Ecija": { "Class A": 900, "Class B": 875 },
  "Tugegarao": { "Class A": 850, "Class B": 750 },
  "Laog": { "Class A": 900, "Class B": 875 },
  "Pangasinan": { "Class A": 250, "Class B": 700 }
};

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
      passengerGender: '',
      fare: 0,
      groupName: '' // Add default group name
    };
  }
  activeSeat.value = seatsData.value[seatId];
};

const calculatedFare = computed(() => {
  if (!activeSeat.value || !props.activeTrip) return 0;

  const dest = props.activeTrip.destination;
  const shift = props.activeTrip.shift || 'morning'; // Fallback to morning just in case
  const origin = props.activeTrip.origin || 'Cubao'; // Fallback to Cubao
  let busClass = props.activeTrip.busClass;

  // Safety net for old class names
  if (busClass === 'classA') busClass = 'Class A';
  if (busClass === 'classB') busClass = 'Class B';
  if (busClass === 'classC') busClass = 'Class B'; 

  // --- THE 3D SUPER MATRIX (Base prices from Cubao) ---
  const superMatrix = {
    "Pampanga":   { morning: { "Class A": 500, "Class B": 400 },   night: { "Class A": 1250 } }, 
    "Zambales":   { morning: { "Class A": 450, "Class B": 390 },   night: { "Class A": 1200 } },
    "Pangasinan": { morning: { "Class A": 250, "Class B": 700 },   night: { "Class A": 1000 } },
    "Baguio":     { morning: { "Class A": 585, "Class B": 485 },   night: { "Class A": 1500 } },
    "Nueva Ecija":{ morning: { "Class A": 900, "Class B": 875 },   night: { "Class A": 1800 } },
    "La Union":   { morning: { "Class A": 850, "Class B": 750 },   night: { "Class A": 1700 } },
    "Ilocos":     { morning: { "Class A": 750, "Class B": 450 },   night: { "Class A": 1650 } },
    "Laog":       { morning: { "Class A": 900, "Class B": 875 },   night: { "Class A": 1850 } },
    "Tugegarao":  { morning: { "Class A": 850, "Class B": 750 },   night: { "Class A": 1750 } },
    "Apari":      { morning: { "Class A": 1300, "Class B": 975 },  night: { "Class A": 2200 } }
  };

  console.log(`Calculating Fare For: [${origin}] ➔ [${dest}] | [${shift}] | [${busClass}]`);

  // 1. Get the base fare from the matrix
  let baseFare = 0;
  if (superMatrix[dest] && superMatrix[dest][shift] && superMatrix[dest][shift][busClass]) {
    baseFare = superMatrix[dest][shift][busClass];
  } else {
    console.error("⚠️ MATRIX ERROR: Missing price for this combination!");
    return 0;
  }

  // 2. Apply Origin Surcharges (Pasay +50, PITX +100)
  if (origin === 'Pasay') baseFare += 50;
  if (origin === 'PITX') baseFare += 100;

  // 3. Apply Age Discounts
  let finalFare = baseFare;
  const age = activeSeat.value.passengerAge;
  
  if (age !== null && age !== '') {
    if (age >= 60) {
      finalFare = baseFare * 0.80; // 20% off for Seniors
    } else if (age <= 12) {
      finalFare = baseFare * 0.85; // 15% off for Children
    }
  }
  
  return finalFare;
});

const closeModal = async () => {
  if (activeSeat.value.passengerName && activeSeat.value.status === 0) {
    activeSeat.value.status = 2;
  }
  
  if (activeSeat.value.status === 2) {
    activeSeat.value.fare = calculatedFare.value;
  }
  
  seatsData.value = { ...seatsData.value }; 
  activeSeat.value = null; 

  try {
    const tripId = props.activeTrip._id || props.activeTrip.id;
    
    // ADD THIS TRAP RIGHT HERE:
    console.log("THE ID I AM SENDING IS:", tripId);
    console.log("THE FULL URL IS:", `http://192.168.122.129:3000/api/trips/${tripId}/seats`);

    await fetch(`http://192.168.122.129:3000/api/trips/${tripId}/seats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats: Object.values(seatsData.value) })
    });
} catch (error) {
    console.error("Failed to sync seats with database:", error);
}
};

const cancelBooking = async (seatId) => {
  if (confirm(`Are you sure you want to cancel the booking for Seat ${seatId}?`)) {
    seatsData.value[seatId] = {
      id: seatId,
      status: 0,
      passengerName: '',
      passengerAge: null,
      passengerGender: '',
      fare: 0,
      groupName: ''
    };
    
    seatsData.value = { ...seatsData.value };

    try {
      const tripId = props.activeTrip._id || props.activeTrip.id;
      await fetch(`http://192.168.122.129:3000/api/trips/${tripId}/seats`, {
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

const totalRevenue = computed(() => {
  return Object.values(seatsData.value)
    .filter(seat => seat.status === 2)
    .reduce((sum, seat) => sum + (seat.fare || 0), 0);
});

// NEW LOGIC: This sorts the seats into groups and calculates subtotals!
const groupedSeats = computed(() => {
  const groups = {};
  
  Object.values(seatsData.value)
    .filter(seat => seat.status === 2)
    .forEach(seat => {
      // If no group name is provided, dump them into an 'Individual Bookings' category
      const gName = seat.groupName ? seat.groupName.trim() : 'Individual Bookings';
      
      if (!groups[gName]) {
        groups[gName] = { seats: [], total: 0 };
      }
      
      groups[gName].seats.push(seat);
      groups[gName].total += (seat.fare || 0);
    });
    
  return groups;
});
</script>

<style scoped>
.bus-container { display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; margin-top: 20px; }
.bus-body { background-color: #f0f0f0; border: 4px solid #333; border-radius: 20px 20px 10px 10px; padding: 30px 20px; width: 350px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
.seat { width: 45px; height: 45px; background-color: #ddd; border: 2px solid #aaa; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; }
.seat:hover:not(.disabled) { background-color: #c0d8f0; border-color: #4a90e2; }
.seat.booked { background-color: #27ae60; color: white; border-color: #1e8449; }
.seat.unavailable { background-color: #e74c3c; border-color: #c0392b; color: white; cursor: not-allowed; }
.seat.disabled { background-color: #555; border-color: #333; color: #fff; cursor: not-allowed; }
.row-front { display: flex; justify-content: space-between; margin-bottom: 30px; }
.cabin { display: flex; flex-direction: column; gap: 15px; margin-bottom: 15px; }
.row-standard { display: flex; justify-content: space-between; }
.aisle { width: 40px; }
.row-back { display: flex; justify-content: space-between; margin-top: 20px; }

/* RE-ENGINEERED SUMMARY BOX STYLES */
.summary { margin-top: 20px; padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 8px; text-align: left; width: 350px; }
.summary-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;}
.summary-header p { margin: 0; }
.revenue { font-size: 1.1rem; font-weight: bold; color: #27ae60; }

.group-section { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin-bottom: 15px; }
.group-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4a90e2; padding-bottom: 5px; margin-bottom: 10px; }
.group-header h4 { margin: 0; color: #333; font-size: 0.95rem; }
.group-total { font-weight: bold; color: #4a90e2; font-size: 0.95rem; }

.summary-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px dashed #eee; font-size: 0.9rem; }
.seat-meta { color: #777; font-size: 0.8rem; }
.seat-actions { display: flex; align-items: center; gap: 10px; }
.seat-fare { font-weight: bold; color: #555; }
.cancel-btn { background: none; border: none; cursor: pointer; font-size: 0.8rem; opacity: 0.6; transition: 0.2s; padding: 2px; }
.cancel-btn:hover { opacity: 1; transform: scale(1.2); }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 25px; border-radius: 12px; width: 320px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
.modal-content h3 { margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
.form-group { margin-bottom: 15px; display: flex; flex-direction: column; text-align: left; }
.form-group label { font-size: 0.9rem; font-weight: bold; margin-bottom: 5px; color: #333; }
.form-group input, .form-group select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
.form-group small { font-size: 0.75rem; color: #888; margin-top: 3px; }

.group-highlight { background-color: #eaf3fc; padding: 10px; border-radius: 6px; border-left: 4px solid #4a90e2; margin-bottom: 20px;}

.save-btn { width: 100%; padding: 10px; background-color: #4a90e2; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; margin-top: 10px; }
.save-btn:hover { background-color: #357abd; }
.fare-display { margin: 15px 0; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #4a90e2; display: flex; justify-content: space-between; align-items: center; }
.discount-badge { font-size: 0.75rem; font-weight: bold; padding: 4px 8px; border-radius: 12px; color: white; }
.discount-badge.senior { background-color: #9b59b6; }
.discount-badge.child { background-color: #f39c12; }
</style>
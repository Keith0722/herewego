<template>
  <div class="bus-container" :class="'print-mode-' + printMode">
    
    <div class="lasso-bar" :class="{ 'visible': selectedSeatIds.length > 0 }">
      <span>🎯 {{ selectedSeatIds.length }} Seat(s) Selected</span>
      <button @click="openGroupModal" class="lasso-btn">🤠 Book Group</button>
      <button @click="selectedSeatIds = []" class="lasso-cancel">Clear</button>
    </div>

    <h2 v-if="selectedSeatIds.length === 0">Select a Seat to Add Details</h2>
    <h2 v-else style="color: transparent;">Spacer</h2>
    
    <div class="bus-body">
      <div class="row-front">
        <div class="seat driver disabled">Driver</div>
        <div class="seat guide" :class="seatClass('guide')" @click="handleSeatClick('guide')">Guide</div>
      </div>

      <div v-if="isSleeperTrip" class="layout-wrapper">
        <div class="cabin sleeper-cabin">
          <div v-for="row in sleeperRows" :key="'sleeper-'+row" class="row-sleeper">
            <div class="seat bed" :class="seatClass(`${row}A`)" @click="handleSeatClick(`${row}A`)">{{ row }}A</div>
            <div class="sleeper-aisle"></div> 
            <div class="seat bed" :class="seatClass(`${row}B`)" @click="handleSeatClick(`${row}B`)">{{ row }}B</div>
            <div class="sleeper-aisle"></div> 
            <div class="seat bed" :class="seatClass(`${row}C`)" @click="handleSeatClick(`${row}C`)">{{ row }}C</div>
          </div>
        </div>
      </div>

      <div v-else class="layout-wrapper">
        <div class="cabin">
          <div v-for="row in standardRows" :key="'std-'+row" class="row-standard">
            <div class="seat" :class="seatClass(`${row}A`)" @click="handleSeatClick(`${row}A`)">{{ row }}A</div>
            <div class="seat" :class="seatClass(`${row}B`)" @click="handleSeatClick(`${row}B`)">{{ row }}B</div>
            
            <div class="aisle"></div> 
            
            <div class="seat" :class="seatClass(`${row}C`)" @click="handleSeatClick(`${row}C`)">{{ row }}C</div>
            <div class="seat" :class="seatClass(`${row}D`)" @click="handleSeatClick(`${row}D`)">{{ row }}D</div>
          </div>
        </div>

        <div class="row-back">
          <div v-for="seatNum in 5" :key="`back-${seatNum}`" 
               class="seat" 
               :class="seatClass(`Back-${seatNum}`)" 
               @click="handleSeatClick(`Back-${seatNum}`)">
            B{{ seatNum }}
          </div>
        </div>
      </div>
    </div>

    <div class="summary" v-if="Object.keys(groupedSeats).length > 0">
      <div class="summary-header">
        <p><strong>Booking Manifest</strong></p>
        <div class="header-right">
          <p class="revenue">Bus Total: ₱{{ totalRevenue.toFixed(2) }}</p>
          <button @click="printManifest" class="print-btn">🖨️ Print Manifest</button>
        </div>
      </div>

      <div class="groups-container">
        <div v-for="(group, groupName) in groupedSeats" :key="groupName" class="group-section">
          
          <div class="group-header">
            <h4>{{ groupName === 'Individual Bookings' ? '🧑 Individual Bookings' : `👨‍👩‍👧‍👦 Group: ${groupName}` }}</h4>
            <div class="group-actions">
              <span class="group-total">Subtotal: ₱{{ group.total.toFixed(2) }}</span>
              <button v-if="groupName !== 'Individual Bookings'" @click="printGroupTicket(groupName, group)" class="ticket-btn">🧾 Print Group Ticket</button>
            </div>
          </div>
          
          <ul style="list-style-type: none; padding: 0; margin-top: 5px;">
            <li v-for="seat in group.seats" :key="seat.id" class="summary-item">
              <span class="seat-info">
                <strong>{{ seat.id }}</strong>: {{ seat.passengerName || 'Unnamed' }} 
                <span class="seat-meta">({{ seat.passengerAge || 'N/A' }} yrs <span v-if="seat.passengerGender">| {{ seat.passengerGender }}</span>)</span>
              </span>
              
              <div class="seat-actions">
                <span class="seat-fare">₱{{ seat.fare ? seat.fare.toFixed(2) : '0.00' }}</span>
                <button @click="printSingleTicket(seat)" class="action-icon" title="Print Ticket">🧾</button>
                <button @click="cancelBooking(seat.id)" class="action-icon" title="Cancel Booking">❌</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="activeSeat" class="modal-overlay" @click.self="closeSingleModal">
      <div class="modal-content">
        <h3>Edit Seat #{{ activeSeat.id }} Details</h3>
        <div class="form-group group-highlight">
          <label>Group/Family Name</label>
          <input type="text" v-model="activeSeat.groupName" placeholder="e.g. Smith Family" />
        </div>
        <div class="form-group">
          <label>Passenger Name</label>
          <input type="text" v-model="activeSeat.passengerName" placeholder="Enter name..." />
        </div>
        <div class="form-group">
          <label>Age</label>
          <input type="number" v-model="activeSeat.passengerAge" min="0" placeholder="Enter age..."/>
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
        <button @click="closeSingleModal" class="save-btn">Save Changes</button>
      </div>
    </div>

    <div v-if="isGroupModalOpen" class="modal-overlay" @click.self="closeGroupModal">
      <div class="modal-content group-modal">
        <h3>🤠 Book {{ groupForm.passengers.length }} Seats</h3>
        <div class="form-group group-highlight">
          <label>Master Group/Family Name</label>
          <input type="text" v-model="groupForm.groupName" placeholder="e.g. Smith Family" />
        </div>
        <div class="passenger-list-scroll">
          <div v-for="(pass, index) in groupForm.passengers" :key="pass.seatId" class="passenger-mini-card">
            <h4>Seat {{ pass.seatId }}</h4>
            <div class="mini-form-row">
              <input type="text" v-model="pass.passengerName" placeholder="Name" class="mini-input name-input"/>
              <input type="number" v-model="pass.passengerAge" placeholder="Age" class="mini-input age-input"/>
              <select v-model="pass.passengerGender" class="mini-input gender-input">
                <option value="" disabled>Gender</option>
                <option value="Male">M</option>
                <option value="Female">F</option>
              </select>
            </div>
            <div class="mini-fare">Fare: ₱{{ calculateFare(pass.passengerAge).toFixed(2) }}</div>
          </div>
        </div>
        <button @click="saveGroupBooking" class="save-btn lasso-save">Confirm All Bookings</button>
      </div>
    </div>

    <div class="thermal-ticket-container" v-if="ticketData">
      <div class="thermal-ticket">
        <div class="t-header">
          <h2>🚍 LOTUS TRANSIT</h2>
          <p>Official Boarding Pass</p>
          <div class="dash-line"></div>
        </div>
        
        <div class="t-info">
          <p><strong>Ticket ID:</strong> {{ ticketData.ticketId }}</p>
          <p><strong>Date:</strong> {{ ticketData.date }}</p>
          <p><strong>Time:</strong> {{ ticketData.time }}</p>
          <p><strong>Route:</strong> {{ activeTrip?.origin || 'Cubao' }} ➔ {{ activeTrip?.destination }}</p>
          <p><strong>Class:</strong> {{ activeTrip?.busClass }} ({{ activeTrip?.shift }})</p>
          <div class="dash-line"></div>
        </div>

        <div class="t-passengers">
          <p class="t-group-name" v-if="ticketData.isGroup">Group: {{ ticketData.name }}</p>
          <div v-for="seat in ticketData.seats" :key="seat.id" class="t-row">
            <span class="t-seat">[{{ seat.id }}]</span>
            <span class="t-name">{{ seat.passengerName }}</span>
            <span class="t-fare">₱{{ seat.fare?.toFixed(2) }}</span>
          </div>
          <div class="dash-line"></div>
        </div>

        <div class="t-total">
          <h3>TOTAL: ₱{{ ticketData.total.toFixed(2) }}</h3>
        </div>

        <div class="t-footer">
          <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=LOTUS-ID:${ticketData.ticketId}|Route:${activeTrip?.destination}`" alt="QR Code" class="qr-code" />
          <p>Please present this ticket<br>or scan the QR code to board.</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps(['activeTrip']);
const standardRows = Array.from({ length: 8 }, (_, i) => i + 1);
const sleeperRows = Array.from({ length: 10 }, (_, i) => i + 1); 

const seatsData = ref({});
const activeSeat = ref(null);
const selectedSeatIds = ref([]);
const isGroupModalOpen = ref(false);
const groupForm = ref({ groupName: '', passengers: [] });

// DUAL MODE PRINTING STATE
const printMode = ref('manifest'); 
const ticketData = ref(null);

const isSleeperTrip = computed(() => {
  if (!props.activeTrip) return false;
  return props.activeTrip.shift === 'night';
});

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
  selectedSeatIds.value = []; 
};

onMounted(loadSeats);
watch(() => props.activeTrip, loadSeats, { deep: true });

const calculateFare = (age) => {
  if (!props.activeTrip) return 0;
  const dest = props.activeTrip.destination;
  const shift = props.activeTrip.shift || 'morning'; 
  const origin = props.activeTrip.origin || 'Cubao'; 
  let busClass = props.activeTrip.busClass;

  if (busClass === 'classA') busClass = 'Class A';
  if (busClass === 'classB') busClass = 'Class B';
  if (busClass === 'classC') busClass = 'Class B'; 

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

  let baseFare = superMatrix[dest]?.[shift]?.[busClass] || 0;
  if (origin === 'Pasay') baseFare += 50;
  if (origin === 'PITX') baseFare += 100;

  if (age !== null && age !== '' && age >= 0) {
    if (age >= 60) return baseFare * 0.80; 
    if (age <= 12) return baseFare * 0.85; 
  }
  return baseFare;
};

const handleSeatClick = (seatId) => {
  const seat = seatsData.value[seatId];
  if (seat && (seat.status === 2 || seat.status === 3)) {
    activeSeat.value = { ...seat }; 
  } else {
    if (selectedSeatIds.value.includes(seatId)) {
      selectedSeatIds.value = selectedSeatIds.value.filter(id => id !== seatId); 
    } else {
      selectedSeatIds.value.push(seatId); 
    }
  }
};

const openGroupModal = () => {
  groupForm.value.groupName = '';
  groupForm.value.passengers = selectedSeatIds.value.map(id => ({
    seatId: id,
    passengerName: '',
    passengerAge: null,
    passengerGender: ''
  }));
  isGroupModalOpen.value = true;
};

const saveGroupBooking = async () => {
  groupForm.value.passengers.forEach(pass => {
    if (pass.passengerName) {
      seatsData.value[pass.seatId] = {
        id: pass.seatId,
        status: 2,
        passengerName: pass.passengerName,
        passengerAge: pass.passengerAge,
        passengerGender: pass.passengerGender,
        groupName: groupForm.value.groupName,
        fare: calculateFare(pass.passengerAge)
      };
    }
  });

  seatsData.value = { ...seatsData.value }; 
  closeGroupModal();
  await syncDatabase();
};

const closeGroupModal = () => {
  isGroupModalOpen.value = false;
  selectedSeatIds.value = []; 
};

const closeSingleModal = async () => {
  if (activeSeat.value) {
    activeSeat.value.fare = calculateFare(activeSeat.value.passengerAge);
    seatsData.value[activeSeat.value.id] = activeSeat.value;
    seatsData.value = { ...seatsData.value }; 
  }
  activeSeat.value = null; 
  await syncDatabase();
};

const cancelBooking = async (seatId) => {
  if (confirm(`Cancel the booking for Seat ${seatId}?`)) {
    seatsData.value[seatId] = { id: seatId, status: 0, passengerName: '', passengerAge: null, passengerGender: '', fare: 0, groupName: '' };
    seatsData.value = { ...seatsData.value };
    await syncDatabase();
  }
};

const syncDatabase = async () => {
  try {
    const tripId = props.activeTrip._id || props.activeTrip.id;
    await fetch(`http://192.168.122.129:3000/api/trips/${tripId}/seats`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: Object.values(seatsData.value) })
    });
  } catch (error) {
    console.error("Sync failed:", error);
  }
};

const seatClass = (seatId) => {
  const seat = seatsData.value[seatId];
  if (selectedSeatIds.value.includes(seatId)) return 'lasso-selected';
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

const groupedSeats = computed(() => {
  const groups = {};
  Object.values(seatsData.value)
    .filter(seat => seat.status === 2)
    .forEach(seat => {
      const gName = seat.groupName ? seat.groupName.trim() : 'Individual Bookings';
      if (!groups[gName]) groups[gName] = { seats: [], total: 0 };
      groups[gName].seats.push(seat);
      groups[gName].total += (seat.fare || 0);
    });
  return groups;
});

// --- NEW TICKET GENERATOR LOGIC ---
// This creates a random unique 8-character ID for the ticket!
const generateTicketId = () => {
  return 'LTS-' + Math.random().toString(36).substr(2, 8).toUpperCase();
};

const printManifest = () => {
  printMode.value = 'manifest';
  setTimeout(() => window.print(), 100);
};

const printGroupTicket = (groupName, group) => {
  printMode.value = 'ticket';
  ticketData.value = { 
    isGroup: true, 
    name: groupName, 
    seats: group.seats, 
    total: group.total,
    ticketId: generateTicketId(),
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  };
  setTimeout(() => window.print(), 100);
};

const printSingleTicket = (seat) => {
  printMode.value = 'ticket';
  ticketData.value = { 
    isGroup: false, 
    name: seat.passengerName, 
    seats: [seat], 
    total: seat.fare || 0,
    ticketId: generateTicketId(),
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  };
  setTimeout(() => window.print(), 100);
};
</script>

<style scoped>
.bus-container { display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; margin-top: 20px; position: relative;}
.lasso-bar { position: absolute; top: -15px; background: #eaf3fc; border: 2px solid #4a90e2; padding: 10px 20px; border-radius: 30px; display: flex; align-items: center; gap: 15px; font-weight: bold; color: #333; opacity: 0; pointer-events: none; transform: translateY(10px); transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(74, 144, 226, 0.2); z-index: 10; }
.lasso-bar.visible { opacity: 1; pointer-events: all; transform: translateY(0); }
.lasso-btn { background: #4a90e2; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.2s;}
.lasso-btn:hover { background: #357abd; transform: scale(1.05);}
.lasso-cancel { background: transparent; border: none; color: #e74c3c; cursor: pointer; font-size: 0.9rem; text-decoration: underline;}
.seat.lasso-selected { background-color: #4a90e2 !important; border-color: #2c3e50 !important; color: white !important; transform: scale(1.1); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }

.bus-body { background-color: #f0f0f0; border: 4px solid #333; border-radius: 20px 20px 10px 10px; padding: 30px 20px; width: 350px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); margin-top: 10px;}
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
.row-sleeper { display: flex; justify-content: space-between; margin-bottom: 5px; }
.sleeper-aisle { width: 25px; } 
.seat.bed { width: 45px; height: 65px; border-radius: 8px; box-shadow: inset 0 12px 0 rgba(255, 255, 255, 0.7), 0 2px 4px rgba(0,0,0,0.1); background-color: #e2e8f0; border-color: #cbd5e1; }
.seat.bed.booked { box-shadow: inset 0 12px 0 rgba(255, 255, 255, 0.4), 0 2px 4px rgba(0,0,0,0.1); background-color: #27ae60; border-color: #1e8449; }

.summary { margin-top: 20px; padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 8px; text-align: left; width: 350px; }
.summary-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;}
.summary-header p { margin: 0; }
.revenue { font-size: 1.1rem; font-weight: bold; color: #27ae60; }
.header-right { display: flex; align-items: center; gap: 15px; }
.print-btn { background: #333; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; transition: 0.2s;}
.print-btn:hover { background: #555; }

.group-section { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin-bottom: 15px; }
.group-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4a90e2; padding-bottom: 5px; margin-bottom: 10px; }
.group-header h4 { margin: 0; color: #333; font-size: 0.95rem; }
.group-actions { display: flex; align-items: center; gap: 10px; }
.group-total { font-weight: bold; color: #4a90e2; font-size: 0.95rem; }
.ticket-btn { background: #9b59b6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: 0.2s;}
.ticket-btn:hover { background: #8e44ad; }

.summary-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px dashed #eee; font-size: 0.9rem; }
.seat-meta { color: #777; font-size: 0.8rem; }
.seat-actions { display: flex; align-items: center; gap: 10px; }
.seat-fare { font-weight: bold; color: #555; }
.action-icon { background: none; border: none; cursor: pointer; font-size: 0.9rem; opacity: 0.6; transition: 0.2s; padding: 2px; }
.action-icon:hover { opacity: 1; transform: scale(1.2); }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 25px; border-radius: 12px; width: 320px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
.modal-content h3 { margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
.form-group { margin-bottom: 15px; display: flex; flex-direction: column; text-align: left; }
.form-group label { font-size: 0.9rem; font-weight: bold; margin-bottom: 5px; color: #333; }
.form-group input, .form-group select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
.group-highlight { background-color: #eaf3fc; padding: 10px; border-radius: 6px; border-left: 4px solid #4a90e2; margin-bottom: 20px;}
.save-btn { width: 100%; padding: 10px; background-color: #4a90e2; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; margin-top: 10px; }
.save-btn:hover { background: #357abd; }

.group-modal { width: 700px !important; max-width: 95vw; } 
.passenger-list-scroll { max-height: 500px; overflow-y: auto; padding-right: 15px; margin-bottom: 20px;}
.passenger-mini-card { background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 12px;}
.passenger-mini-card h4 { margin: 0 0 10px 0; color: #2c3e50; font-size: 1rem;}
.mini-form-row { display: flex; gap: 15px; }
.mini-input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;}
.name-input { flex: 2; }
.age-input { flex: 1; min-width: 80px; }
.gender-input { flex: 1; }
.mini-fare { text-align: right; font-size: 0.95rem; font-weight: bold; color: #27ae60; margin-top: 10px;}
.lasso-save { background-color: #27ae60; font-size: 1.1rem; padding: 12px; }
.lasso-save:hover { background-color: #219653; }

/* --- THERMAL TICKET STYLES (Hidden on screen) --- */
.thermal-ticket-container { display: none; }
.qr-code { display: block; margin: 10px auto; width: 120px; height: 120px; }
</style>
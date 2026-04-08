import { ref, onMounted } from 'vue';

export function useBusBooking() {
  const MAX_PER_BUS = 16;
  
  const activeSeat = ref(null);

  const buses = ref([
    Array.from({ length: MAX_PER_BUS }, (_, i) => ({
      id: crypto.randomUUID(),
      number: i + 1,
      status: 0,
      passengerName: '',   
      passengerAge: '',    
      passengerGender: ''  
    }))
  ]);

  
  onMounted(async () => {
    try {
      const response = await fetch('http://192.168.122.128:3000/api/buses');
      if (response.ok) {
        const data = await response.json();
        // If the database has saved buses, map them to match Vue's array-of-arrays structure
        if (data.length > 0) {
          buses.value = data.map(bus => bus.seats);
        }
      }
    } catch (error) {
      console.error("Couldn't connect to VM database:", error);
    }
  });

  
  const saveToDatabase = async () => {
    try {
      await fetch('http://192.168.122.128:3000/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buses.value)
      });
      console.log('Successfully saved to MongoDB!');
    } catch (error) {
      console.error("Couldn't save to VM database:", error);
    }
  };

  const addSeat = () => {
    const availableBus = buses.value.find(bus => bus.length < MAX_PER_BUS);

    if (availableBus) {
      availableBus.push({
        id: crypto.randomUUID(),
        number: availableBus.length + 1,
        status: 0,
        passengerName: '',
        passengerAge: '',
        passengerGender: ''
      });
    } else {
      buses.value.push([{
        id: crypto.randomUUID(),
        number: 1,
        status: 0,
        passengerName: '',
        passengerAge: '',
        passengerGender: ''
      }]);
    }
    saveToDatabase(); 
  };

  const removeSeat = (busIndex, seatId) => {
    buses.value[busIndex] = buses.value[busIndex].filter(s => s.id !== seatId);
    
    buses.value[busIndex].forEach((seat, index) => {
      seat.number = index + 1;
    });

    if (buses.value[busIndex].length === 0 && buses.value.length > 1) {
      buses.value.splice(busIndex, 1);
    }
    saveToDatabase(); 
  };

  const removeBus = (busIndex) => {
    buses.value.splice(busIndex, 1);
    saveToDatabase(); 
  };

  const openModal = (seat) => {
    activeSeat.value = seat;
  };

  const closeModal = () => {
    activeSeat.value = null;
    saveToDatabase(); 
  };

  return { buses, addSeat, removeSeat, removeBus, activeSeat, openModal, closeModal };
}
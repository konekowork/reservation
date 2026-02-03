import { useState, useEffect } from 'react';
import { Calendar, Clock, Euro, MapPin, Info, ArrowLeft, Users, Briefcase } from 'lucide-react';

function App() {
  // État pour gérer le type de réservation sélectionné
  const [bookingType, setBookingType] = useState<'coworking' | 'meeting_room' | null>(null);

  // Fonction pour revenir à la sélection
  const handleBackToSelection = () => {
    setBookingType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {!bookingType && <SelectionPage onSelect={setBookingType} />}
      {bookingType === 'coworking' && <BookingForm type="coworking" onBack={handleBackToSelection} />}
      {bookingType === 'meeting_room' && <BookingForm type="meeting_room" onBack={handleBackToSelection} />}
    </div>
  );
}

// ========================================
// PAGE DE SÉLECTION (Écran 1)
// ========================================
function SelectionPage({ onSelect }: { onSelect: (type: 'coworking' | 'meeting_room') => void }) {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-16 h-16 text-slate-700" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-3">Koneko Work</h1>
          <p className="text-xl text-slate-600">Choisissez votre type de réservation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Carte Coworking */}
          <button
            onClick={() => onSelect('coworking')}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 group-hover:bg-blue-200 transition-colors">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Espace Coworking</h2>
            <p className="text-slate-600 mb-6 text-lg">
              Réservez une place dans notre espace de travail collaboratif
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-slate-700">
                <span className="text-blue-600 mr-2">•</span>
                <span>À partir de 6€</span>
              </li>
              <li className="flex items-start text-slate-700">
                <span className="text-blue-600 mr-2">•</span>
                <span>Tarification flexible à la minute</span>
              </li>
              <li className="flex items-start text-slate-700">
                <span className="text-blue-600 mr-2">•</span>
                <span>Offre matinale : 3h pour 14€</span>
              </li>
              <li className="flex items-start text-slate-700">
                <span className="text-blue-600 mr-2">•</span>
                <span>Forfait journée : 32€ max</span>
              </li>
            </ul>
            <div className="inline-flex items-center text-blue-600 font-semibold text-lg group-hover:translate-x-2 transition-transform">
              Réserver une place
              <span className="ml-2">→</span>
            </div>
          </button>

          {/* Carte Salle de Réunion */}
          <button
            onClick={() => onSelect('meeting_room')}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6 group-hover:bg-purple-200 transition-colors">
              <Briefcase className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Salle de Réunion</h2>
            <p className="text-slate-600 mb-6 text-lg">
              Privatisez notre salle pour vos réunions et événements
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-slate-700">
                <span className="text-purple-600 mr-2">•</span>
                <span>5€ par tranche de 10 minutes</span>
              </li>
              <li className="flex items-start text-slate-700">
                <span className="text-purple-600 mr-2">•</span>
                <span>1h = 30€ | 2h = 60€ | 3h = 90€</span>
              </li>
              <li className="flex items-start text-slate-700">
                <span className="text-purple-600 mr-2">•</span>
                <span>Forfait 4h : 100€</span>
              </li>
              <li className="flex items-start text-slate-700">
                <span className="text-purple-600 mr-2">•</span>
                <span>Maximum journalier : 200€</span>
              </li>
            </ul>
            <div className="inline-flex items-center text-purple-600 font-semibold text-lg group-hover:translate-x-2 transition-transform">
              Réserver la salle
              <span className="ml-2">→</span>
            </div>
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Vos données sont sécurisées et ne seront utilisées que pour votre réservation
        </p>
      </div>
    </div>
  );
}

// ========================================
// COMPOSANT CALENDRIER SALLE DE RÉUNION
// ========================================
function MeetingRoomCalendar({ onSelectSlot }: { onSelectSlot: (date: string, startTime: string, endTime: string) => void }) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  // Réservations fictives pour démonstration (à remplacer par données Supabase plus tard)
  const mockBookings = [
    { date: '2026-02-03', startTime: '09:00', endTime: '11:00' },
    { date: '2026-02-03', startTime: '14:00', endTime: '16:00' },
    { date: '2026-02-04', startTime: '10:00', endTime: '12:00' },
    { date: '2026-02-05', startTime: '09:00', endTime: '13:00' },
  ];

  // Générer les créneaux horaires (9h-19h en semaine, 10h-18h samedi)
  const generateTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const slots = [];
    
    // Dimanche = fermé
    if (dayOfWeek === 0) return [];
    
    const startHour = dayOfWeek === 6 ? 10 : 9;
    const endHour = dayOfWeek === 6 ? 18 : 19;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  };

  // Vérifier si un créneau est réservé
  const isSlotBooked = (date: string, time: string) => {
    return mockBookings.some(booking => {
      if (booking.date !== date) return false;
      
      const slotMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
      const startMinutes = parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1]);
      const endMinutes = parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1]);
      
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
  };

  // Générer la semaine en cours
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Lundi = début de semaine
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      week.push(day);
    }
    
    setWeekDates(week);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        <Calendar className="w-6 h-6 mr-2 text-purple-600" />
        Disponibilités de la salle de réunion
      </h2>

      {/* Navigation semaine */}
      <div className="mb-6 flex items-center justify-between">
        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm">
          ← Semaine précédente
        </button>
        <span className="font-semibold text-slate-700 text-sm">
          {weekDates.length > 0 && `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`}
        </span>
        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm">
          Semaine suivante →
        </button>
      </div>

      {/* Grille calendrier */}
      <div className="grid grid-cols-7 gap-2">
        {/* En-têtes des jours */}
        {weekDates.map((date, index) => {
          const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
          const isSunday = date.getDay() === 0;
          
          return (
            <div
              key={index}
              className={`text-center p-3 rounded-lg font-semibold ${
                isToday ? 'bg-purple-100 text-purple-700' : 'bg-slate-50 text-slate-700'
              } ${isSunday ? 'opacity-50' : ''}`}
            >
              <div className="text-xs uppercase">{getDayName(date).slice(0, 3)}</div>
              <div className="text-lg">{date.getDate()}</div>
            </div>
          );
        })}

        {/* Créneaux horaires */}
        {weekDates.map((date, dayIndex) => {
          const dateString = date.toISOString().split('T')[0];
          const timeSlots = generateTimeSlots(date);
          const isSunday = date.getDay() === 0;

          return (
            <div key={dayIndex} className="space-y-1">
              {isSunday ? (
                <div className="text-center text-xs text-slate-400 py-8">Fermé</div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-4">Pas de créneaux</div>
              ) : (
                timeSlots.map((time, timeIndex) => {
                  const isBooked = isSlotBooked(dateString, time);
                  const isPast = new Date(`${dateString}T${time}`) < new Date();

                  return (
                    <button
                      key={timeIndex}
                      onClick={() => !isBooked && !isPast && onSelectSlot(dateString, time, `${parseInt(time.split(':')[0]) + 1}:00`)}
                      disabled={isBooked || isPast}
                      className={`w-full text-xs p-2 rounded transition-all ${
                        isBooked
                          ? 'bg-red-100 text-red-700 cursor-not-allowed line-through'
                          : isPast
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 hover:scale-105 cursor-pointer'
                      }`}
                      title={isBooked ? 'Réservé' : isPast ? 'Passé' : 'Disponible'}
                    >
                      {time}
                      {isBooked && <span className="block text-[10px]">Réservé</span>}
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
          <span className="text-slate-600">Disponible</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
          <span className="text-slate-600">Réservé</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded mr-2"></div>
          <span className="text-slate-600">Passé</span>
        </div>
      </div>
    </div>
  );
}

// ========================================
// FORMULAIRE DE RÉSERVATION (Écran 2)
// ========================================
function BookingForm({ type, onBack }: { type: 'coworking' | 'meeting_room'; onBack: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bookingDate: '',
    arrivalTime: '',
    departureTime: '',
  });
  const [cost, setCost] = useState(0);
  const [duration, setDuration] = useState(0);
  const [priceDetail, setPriceDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [timeError, setTimeError] = useState('');
  
  // État pour gérer le mode d'affichage calendrier (salle de réunion uniquement)
  const [showCalendar, setShowCalendar] = useState(type === 'meeting_room');

  const handleSlotSelection = (date: string, startTime: string, endTime: string) => {
    setFormData({
      ...formData,
      bookingDate: date,
      arrivalTime: startTime,
      departureTime: endTime,
    });
    setShowCalendar(false);
  };

  useEffect(() => {
    calculateCost();
  }, [formData.arrivalTime, formData.departureTime, formData.bookingDate, type]);

  const isWithinOpeningHours = (date: string, startTime: string, endTime: string) => {
    if (!date || !startTime || !endTime) return { valid: false, error: '' };

    const dayOfWeek = new Date(date).getDay();
    
    if (dayOfWeek === 0) {
      return { valid: false, error: 'Le coworking est fermé le dimanche.' };
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (startMinutes < 9 * 60 || endMinutes > 19 * 60) {
        return { valid: false, error: 'Horaires d\'ouverture lundi-vendredi : 9h00 - 19h00.' };
      }
    }
    
    if (dayOfWeek === 6) {
      if (startMinutes < 10 * 60 || endMinutes > 18 * 60) {
        return { valid: false, error: 'Horaires d\'ouverture samedi : 10h00 - 18h00.' };
      }
    }

    return { valid: true, error: '' };
  };

  const calculateCost = () => {
    setTimeError('');

    if (formData.arrivalTime && formData.departureTime && formData.bookingDate) {
      const [arrivalHours, arrivalMinutes] = formData.arrivalTime.split(':').map(Number);
      const [departureHours, departureMinutes] = formData.departureTime.split(':').map(Number);

      const arrivalInMinutes = arrivalHours * 60 + arrivalMinutes;
      const departureInMinutes = departureHours * 60 + departureMinutes;

      if (departureInMinutes <= arrivalInMinutes) {
        setCost(0);
        setDuration(0);
        setPriceDetail('');
        setTimeError('L\'heure de départ doit être après l\'heure d\'arrivée.');
        return;
      }

      const hoursCheck = isWithinOpeningHours(formData.bookingDate, formData.arrivalTime, formData.departureTime);
      if (!hoursCheck.valid) {
        setCost(0);
        setDuration(0);
        setPriceDetail('');
        setTimeError(hoursCheck.error);
        return;
      }

      const durationInMinutes = departureInMinutes - arrivalInMinutes;
      const durationInHours = durationInMinutes / 60;
      setDuration(durationInHours);

      let calculatedCost = 0;
      let detail = '';

      // ==========================================
      // TARIFICATION SELON LE TYPE
      // ==========================================

      if (type === 'coworking') {
        // LOGIQUE COWORKING
        const MORNING_START = 9 * 60;
        const MORNING_END = 12 * 60 + 30;
        const MORNING_CAP = 14;
        const MIN_PRICE = 6;
        const FORFAIT_4H = 20;
        const EXTRA_HOUR_RATE = 3;
        const MAX_PRICE = 32;

        const isMorningSlot = arrivalInMinutes >= MORNING_START && departureInMinutes <= MORNING_END;
        const isWithin3Hours = durationInHours <= 3;

        if (isMorningSlot && isWithin3Hours) {
          const roundedMinutes = Math.floor(durationInMinutes / 10) * 10;
          calculatedCost = roundedMinutes / 10;

          if (calculatedCost < MIN_PRICE) {
            calculatedCost = MIN_PRICE;
          }

          if (calculatedCost > MORNING_CAP) {
            calculatedCost = MORNING_CAP;
          }

          if (durationInHours === 3) {
            detail = 'Offre matinale : 3h avant 12h30';
          } else {
            detail = `Offre matinale : ${roundedMinutes} min (max 14€)`;
          }
        } else if (durationInHours < 4) {
          if (durationInHours >= 3) {
            const roundedMinutes = Math.floor(durationInMinutes / 30) * 30;
            const roundedHours = roundedMinutes / 60;
            
            if (roundedHours === 3.0) {
              calculatedCost = 18;
              detail = 'Tarif 3h';
            } else if (roundedHours === 3.5) {
              calculatedCost = 19;
              detail = 'Tarif 3h30';
            }
          } else {
            const roundedMinutes = Math.floor(durationInMinutes / 10) * 10;
            calculatedCost = roundedMinutes / 10;

            if (calculatedCost < MIN_PRICE) {
              calculatedCost = MIN_PRICE;
              detail = 'Tarif minimum';
            } else {
              const hours = Math.floor(roundedMinutes / 60);
              const remainingMinutes = roundedMinutes % 60;
              detail = `${hours}h${remainingMinutes > 0 ? remainingMinutes : ''} × 1€/10min`;
            }
          }
        } else if (durationInHours === 4) {
          calculatedCost = FORFAIT_4H;
          detail = 'Forfait 4h';
        } else {
          const extraMinutes = durationInMinutes - (4 * 60);
          const roundedExtraMinutes = Math.floor(extraMinutes / 30) * 30;
          const extraHours = roundedExtraMinutes / 60;
          const extraCost = extraHours * EXTRA_HOUR_RATE;
          
          calculatedCost = FORFAIT_4H + extraCost;
          
          if (roundedExtraMinutes > 0) {
            detail = `Forfait 4h (20€) + ${extraHours.toFixed(1)}h sup. × 3€/h`;
          } else {
            detail = 'Forfait 4h';
          }
        }

        if (calculatedCost > MAX_PRICE) {
          calculatedCost = MAX_PRICE;
          detail = 'Tarif maximum journalier';
        }
} else {
  // LOGIQUE SALLE DE RÉUNION
  const RATE_PER_10MIN = 5;
  const FORFAIT_3H = 90;
  const FORFAIT_3H30 = 95;
  const FORFAIT_4H = 100;
  const MAX_PRICE = 200;
  const MAX_PRICE_THRESHOLD = 7 * 60 + 20;

  const roundedMinutes = Math.floor(durationInMinutes / 10) * 10;
  const roundedHours = roundedMinutes / 60;

  if (durationInMinutes >= MAX_PRICE_THRESHOLD) {
    calculatedCost = MAX_PRICE;
    detail = 'Tarif maximum journalier';
  }
  else if (roundedHours === 4.0) {
    calculatedCost = FORFAIT_4H;
    detail = 'Forfait 4h';
  }
  else if (roundedMinutes >= 180 && roundedMinutes < 240) {
    const rounded30Min = Math.floor(roundedMinutes / 30) * 30;
    const roundedHours30 = rounded30Min / 60;
    
    if (roundedHours30 === 3.0) {
      calculatedCost = FORFAIT_3H;
      detail = 'Forfait 3h';
    } else if (roundedHours30 === 3.5) {
      calculatedCost = FORFAIT_3H30;
      detail = 'Forfait 3h30';
    }
  }
  else if (roundedMinutes > 240) {
    const extraMinutes = roundedMinutes - 240;
    const extraCost = (extraMinutes / 10) * RATE_PER_10MIN;
    calculatedCost = FORFAIT_4H + extraCost;
    
    const extraHours = Math.floor(extraMinutes / 60);
    const extraMins = extraMinutes % 60;
    if (extraHours > 0) {
      detail = `Forfait 4h (100€) + ${extraHours}h${extraMins > 0 ? extraMins : ''} × 5€/10min`;
    } else {
      detail = `Forfait 4h (100€) + ${extraMins}min × 5€/10min`;
    }
  }
  else {
    calculatedCost = (roundedMinutes / 10) * RATE_PER_10MIN;
    
    const hours = Math.floor(roundedMinutes / 60);
    const remainingMinutes = roundedMinutes % 60;
    
    if (roundedMinutes >= 60) {
      detail = `${hours}h${remainingMinutes > 0 ? remainingMinutes : ''} × 5€/10min`;
    } else {
      detail = `${roundedMinutes} min × 5€/10min`;
    }
  }
}

      setCost(calculatedCost);
      setPriceDetail(detail);
    } else {
      setCost(0);
      setDuration(0);
      setPriceDetail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (timeError) {
      setMessage({ type: 'error', text: timeError });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            bookingDate: formData.bookingDate,
            arrivalTime: formData.arrivalTime,
            departureTime: formData.departureTime,
            duration: duration,
            cost: cost,
            priceDetail: priceDetail,
            bookingType: type,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la réservation');
      }

      setMessage({ type: 'success', text: 'Réservation confirmée avec succès !' });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        bookingDate: '',
        arrivalTime: '',
        departureTime: '',
      });
      setCost(0);
      setDuration(0);
      setPriceDetail('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la réservation. Veuillez réessayer.' });
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.bookingDate &&
      formData.arrivalTime &&
      formData.departureTime &&
      cost > 0 &&
      !timeError
    );
  };

  const pricingInfo = type === 'coworking' ? (
    <ul className="space-y-1">
      <li>• 1€ par tranche de 10 minutes</li>
      <li>• Prix minimum : 6€</li>
      <li>• Forfait 3h : 18€ | Forfait 3h30 : 19€</li>
      <li>• Forfait 4h : 20€</li>
      <li>• Au-delà de 4h : +3€/h (par tranches de 30 min)</li>
      <li>• Offre matinale (9h-12h30, max 3h) : plafond 14€</li>
      <li>• Maximum journalier : 32€</li>
    </ul>
  ) : (
    <ul className="space-y-1">
      <li>• 5€ par tranche de 10 minutes (arrondi inférieur)</li>
      <li>• 1h = 30€ | 2h = 60€</li>
      <li>• Forfait 3h : 90€ | Forfait 3h30 : 95€ | Forfait 4h : 100€</li>
      <li>• Au-delà de 4h : +5€ par tranche de 10 min</li>
      <li>• Maximum journalier : 200€ (dès 7h20)</li>
      <li>• Équipements et services inclus</li>
    </ul>
  );

  const pageTitle = type === 'coworking' ? 'Réservation Coworking' : 'Réservation Salle de Réunion';
  const headerColor = type === 'coworking' ? 'text-blue-600' : 'text-purple-600';
  const buttonColor = type === 'coworking' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-purple-600 hover:bg-purple-700';

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à la sélection
        </button>

        {/* Afficher calendrier pour salle de réunion */}
        {type === 'meeting_room' && showCalendar ? (
          <>
            <MeetingRoomCalendar onSelectSlot={handleSlotSelection} />
            <button
              onClick={() => setShowCalendar(false)}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg transition-colors"
            >
              Ou saisir manuellement les horaires →
            </button>
          </>
        ) : (
          <>
            {/* Bouton pour revenir au calendrier (salle de réunion uniquement) */}
            {type === 'meeting_room' && (
              <button
                onClick={() => setShowCalendar(true)}
                className="mb-4 flex items-center text-purple-600 hover:text-purple-700 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Voir le calendrier des disponibilités
              </button>
            )}

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {type === 'coworking' ? (
                <Users className="w-12 h-12 text-blue-600" />
              ) : (
                <Briefcase className="w-12 h-12 text-purple-600" />
              )}
            </div>
            <h1 className={`text-4xl font-bold mb-2 ${headerColor}`}>{pageTitle}</h1>
            <p className="text-slate-600">Complétez le formulaire pour réserver</p>
          </div>

          {/* Info tarifs */}
          <div className={`${type === 'coworking' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border rounded-xl p-4 mb-6`}>
            <div className="flex items-start">
              <Info className={`w-5 h-5 ${type === 'coworking' ? 'text-blue-600' : 'text-purple-600'} mr-2 mt-0.5 flex-shrink-0`} />
              <div className={`text-sm ${type === 'coworking' ? 'text-blue-800' : 'text-purple-800'}`}>
                <p className="font-semibold mb-1">Nos tarifs :</p>
                {pricingInfo}
                <p className="mt-2 font-semibold">Horaires :</p>
                <p>Lun-Ven : 9h-19h | Sam : 10h-18h | Dim : Fermé</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                    placeholder="Jean"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  placeholder="jean.dupont@exemple.fr"
                />
              </div>

              <div>
                <label htmlFor="bookingDate" className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de réservation
                </label>
                <input
                  type="date"
                  id="bookingDate"
                  required
                  value={formData.bookingDate}
                  onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="arrivalTime" className="block text-sm font-medium text-slate-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Heure d'arrivée
                  </label>
                  <input
                    type="time"
                    id="arrivalTime"
                    required
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="departureTime" className="block text-sm font-medium text-slate-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Heure de départ
                  </label>
                  <input
                    type="time"
                    id="departureTime"
                    required
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {timeError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                  {timeError}
                </div>
              )}

              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Euro className="w-6 h-6 text-slate-700 mr-2" />
                    <span className="text-lg font-medium text-slate-700">Coût estimé</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {cost.toFixed(2)} €
                  </div>
                </div>
                {duration > 0 && (
                  <p className="text-sm text-slate-600">
                    Durée : {duration.toFixed(1)}h
                  </p>
                )}
                {priceDetail && (
                  <p className="text-sm text-slate-600 mt-1">
                    {priceDetail}
                  </p>
                )}
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className={`w-full ${buttonColor} text-white py-4 px-6 rounded-lg font-semibold text-lg disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                {isSubmitting ? 'Réservation en cours...' : 'Réserver'}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Vos données sont sécurisées et ne seront utilisées que pour votre réservation
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default App;

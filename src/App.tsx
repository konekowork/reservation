import { useState, useEffect } from 'react';
import { Calendar, Clock, Euro, MapPin, Info } from 'lucide-react';

function App() {
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

  useEffect(() => {
    calculateCost();
  }, [formData.arrivalTime, formData.departureTime, formData.bookingDate]);

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

      // ==========================================
      // LOGIQUE TARIFAIRE COMPLÈTE
      // ==========================================
      
      let calculatedCost = 0;
      let detail = '';

      // Constantes tarifaires
      const MORNING_START = 9 * 60;     // 9h00 en minutes
      const MORNING_END = 12 * 60 + 30; // 12h30 en minutes
      const MORNING_CAP = 14;           // Plafond offre matinale : 14€
      const HOURLY_RATE = 6;            // Tarif horaire : 6€/h
      const MIN_PRICE = 6;              // Prix minimum : 6€
      const FORFAIT_4H = 20;            // Forfait 4h : 20€
      const EXTRA_HOUR_RATE = 3;        // Heures sup. : 3€/h
      const MAX_PRICE = 32;             // Plafond max : 32€

      // 1️⃣ OFFRE MATINALE (9h → 12h30)
      // Si la réservation est entièrement dans le créneau matinal ET ≤ 3h
      const isMorningSlot = arrivalInMinutes >= MORNING_START && departureInMinutes <= MORNING_END;
      const isWithin3Hours = durationInHours <= 3;

      if (isMorningSlot && isWithin3Hours) {
        // Arrondir aux 10 min inférieures
        const roundedMinutes = Math.floor(durationInMinutes / 10) * 10;
        calculatedCost = roundedMinutes / 10; // 1€ par tranche de 10 min

        // Appliquer le minimum 6€
        if (calculatedCost < MIN_PRICE) {
          calculatedCost = MIN_PRICE;
        }

        // Plafonner à 14€ pour l'offre matinale
        if (calculatedCost > MORNING_CAP) {
          calculatedCost = MORNING_CAP;
        }

        if (durationInHours === 3) {
          detail = 'Offre matinale : 3h avant 12h30';
        } else {
          detail = `Offre matinale : ${roundedMinutes} min (max 14€)`;
        }
      } 
      // 2️⃣ TARIFICATION STANDARD (< 4h, hors offre matinale)
else if (durationInHours < 4) {
  // NOUVELLE RÈGLE : Gestion spécifique pour 3h ≤ durée < 4h
  if (durationInHours >= 3) {
    // Arrondir aux 30 min inférieures pour cette tranche
    const roundedMinutes = Math.floor(durationInMinutes / 30) * 30;
    const roundedHours = roundedMinutes / 60;
    
    if (roundedHours === 3.0) {
      // De 3h00 à 3h29 → 18€
      calculatedCost = 18;
      detail = 'Tarif 3h';
    } else if (roundedHours === 3.5) {
      // De 3h30 à 3h59 → 19€
      calculatedCost = 19;
      detail = 'Tarif 3h30';
    }
  } else {
    // Tarification normale pour < 3h (arrondi aux 10 min inférieures)
    const roundedMinutes = Math.floor(durationInMinutes / 10) * 10;
    calculatedCost = roundedMinutes / 10; // 1€ par tranche de 10 min

    // Appliquer le minimum 6€
    if (calculatedCost < MIN_PRICE) {
      calculatedCost = MIN_PRICE;
      detail = 'Tarif minimum';
    } else {
      const hours = Math.floor(roundedMinutes / 60);
      const remainingMinutes = roundedMinutes % 60;
      detail = `${hours}h${remainingMinutes > 0 ? remainingMinutes : ''} × 1€/10min`;
    }
  }
}
      // 3️⃣ FORFAIT 4H EXACT
      else if (durationInHours === 4) {
        calculatedCost = FORFAIT_4H;
        detail = 'Forfait 4h';
      }
      // 4️⃣ FORFAIT 4H + HEURES SUPPLÉMENTAIRES (> 4h)
      else {
        const extraMinutes = durationInMinutes - (4 * 60);
        
        // Arrondir les heures supplémentaires aux 30 min inférieures
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

      // 5️⃣ PLAFOND MAXIMUM (32€)
      if (calculatedCost > MAX_PRICE) {
        calculatedCost = MAX_PRICE;
        detail = 'Tarif maximum journalier';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-12 h-12 text-slate-700" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Coworking Space</h1>
          <p className="text-slate-600">Réservez votre espace de travail</p>
        </div>

        {/* Info tarifs */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Nos tarifs :</p>
              <ul className="space-y-1">
                <li>• 1€ par tranche de 10 minutes</li>
                <li>• Prix minimum : 6€</li>
                <li>• Forfait 4h : 20€</li>
                <li>• Au-delà de 4h : +3€/h (par tranches de 30 min)</li>
                <li>• Offre matinale (9h-12h30, max 3h) : plafond 14€</li>
                <li>• Maximum journalier : 32€</li>
              </ul>
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
              className="w-full bg-slate-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? 'Réservation en cours...' : 'Réserver'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Vos données sont sécurisées et ne seront utilisées que pour votre réservation
        </p>
      </div>
    </div>
  );
}

export default App;

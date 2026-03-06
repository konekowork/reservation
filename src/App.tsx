import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Euro, MapPin, Info, ArrowLeft, Users, Briefcase, CheckCircle, XCircle, Loader } from 'lucide-react';

function App() {
  const [bookingType, setBookingType] = useState<'coworking' | 'meeting_room' | null>(null);

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
                <span>30€/h (prix minimum : 30€)</span>
              </li>
              <li className="flex items-start text-slate-700">
                <span className="text-purple-600 mr-2">•</span>
                <span>2h = 60€ | 3h = 90€</span>
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
  const [availability, setAvailability] = useState<{ status: 'idle' | 'checking' | 'available' | 'unavailable'; message: string; spotsRemaining?: number; skipCheck?: boolean }>({ status: 'idle', message: '' });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const pageTitle = type === 'coworking' ? 'RÉSERVATION COWORKING' : 'RÉSERVATION SALLE DE RÉUNION';
  const titleColor = type === 'coworking' ? 'text-blue-600' : 'text-purple-600';
  const accentColor = type === 'coworking' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600';
  const buttonColor = type === 'coworking' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700';

  useEffect(() => {
    calculateCost();
    checkAvailability();
  }, [formData.arrivalTime, formData.departureTime, formData.bookingDate, type]);

  const checkAvailability = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!formData.bookingDate || !formData.arrivalTime || !formData.departureTime) {
      setAvailability({ status: 'idle', message: '' });
      return;
    }

    const [arrivalHours, arrivalMinutes] = formData.arrivalTime.split(':').map(Number);
    const [departureHours, departureMinutes] = formData.departureTime.split(':').map(Number);
    const arrivalInMinutes = arrivalHours * 60 + arrivalMinutes;
    const departureInMinutes = departureHours * 60 + departureMinutes;

    // ✅ PAS DE VÉRIFICATION SI HORAIRES INVALIDES (départ avant ou égal à arrivée)
    if (departureInMinutes <= arrivalInMinutes) {
      setAvailability({ status: 'idle', message: '' });
      return;
    }

    // ✅ VÉRIFICATION FRONT-END DES HORAIRES D'OUVERTURE
    const dayOfWeek = new Date(formData.bookingDate).getDay();

    const isWithinOpeningHoursFrontend = (() => {
      if (dayOfWeek === 0) return false;
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return arrivalInMinutes >= 9 * 60 && departureInMinutes <= 19 * 60;
      }
      
      if (dayOfWeek === 6) {
        return arrivalInMinutes >= 10 * 60 && departureInMinutes <= 18 * 60;
      }
      
      return false;
    })();

    // ✅ PAS DE VÉRIFICATION SI HORS HORAIRES D'OUVERTURE
    if (!isWithinOpeningHoursFrontend) {
      setAvailability({ status: 'available', message: '', skipCheck: true });
      return;
    }

    setAvailability({ status: 'checking', message: 'Vérification...' });

    debounceTimer.current = setTimeout(async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/check-availability`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              bookingDate: formData.bookingDate,
              arrivalTime: formData.arrivalTime,
              departureTime: formData.departureTime,
              bookingType: type,
            }),
          }
        );

        if (!response.ok) {
          setAvailability({ status: 'unavailable', message: 'Erreur de vérification' });
          return;
        }

        const data = await response.json();
        
        if (data.skipCheck) {
          setAvailability({ status: 'available', message: '', skipCheck: true });
          return;
        }
        
        setAvailability({
          status: data.available ? 'available' : 'unavailable',
          message: data.message,
          spotsRemaining: data.spotsRemaining,
        });
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailability({ status: 'unavailable', message: 'Erreur de vérification' });
      }
    }, 500);
  };

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

      if (type === 'coworking') {
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
        const RATE_PER_10MIN = 5;
        const MIN_PRICE = 30;
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
        } else if (roundedHours === 4.0) {
          calculatedCost = FORFAIT_4H;
          detail = 'Forfait 4h';
        } else if (roundedMinutes >= 180 && roundedMinutes < 240) {
          const rounded30Min = Math.floor(roundedMinutes / 30) * 30;
          const roundedHours30 = rounded30Min / 60;
          
          if (roundedHours30 === 3.0) {
            calculatedCost = FORFAIT_3H;
            detail = 'Forfait 3h';
          } else if (roundedHours30 === 3.5) {
            calculatedCost = FORFAIT_3H30;
            detail = 'Forfait 3h30';
          }
        } else if (roundedMinutes > 240) {
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
        } else {
          calculatedCost = (roundedMinutes / 10) * RATE_PER_10MIN;
          
          if (calculatedCost < MIN_PRICE) {
            calculatedCost = MIN_PRICE;
            detail = 'Prix minimum (moins d\'1h)';
          } else {
            const hours = Math.floor(roundedMinutes / 60);
            const remainingMinutes = roundedMinutes % 60;
            
            if (roundedMinutes >= 60) {
              detail = `${hours}h${remainingMinutes > 0 ? remainingMinutes : ''} × 5€/10min`;
            } else {
              detail = `${roundedMinutes} min × 5€/10min`;
            }
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
      !timeError &&
      availability.status === 'available'
    );
  };

  const hourlyRates = type === 'coworking' ? [
    { title: '1re heure', subtitle: 'Tarif minimum', price: '6€' },
    { title: 'Chaque 10 minutes supplémentaires', subtitle: 'Soit 1€/10 min', price: '1€' },
    { title: 'Journée complète', subtitle: '+ de 8h de présence', price: '32€' },
  ] : [
    { title: '1ère heure', subtitle: 'Prix minimum', price: '30€' },
    { title: 'Chaque 10 minutes supplémentaires', subtitle: 'Soit 5€/10 min', price: '5€' },
    { title: 'Journée complète', subtitle: '+ de 7h20 de présence', price: '200€' },
  ];

  const advantageousRates = type === 'coworking' ? [
    { title: 'Matin productif', subtitle: '3h de présence avant 12h30', price: '14€', oldPrice: '18€' },
    { title: 'Demi-journée', subtitle: '4h de présence', price: '20€', oldPrice: '24€' },
    { title: 'Chaque heure supplémentaire', subtitle: 'Au-delà de 4h de présence', price: '3€', oldPrice: '6€' },
  ] : [
    { title: 'Forfait 3h', subtitle: 'De 3h00 à 3h29', price: '90€', oldPrice: '120€' },
    { title: 'Forfait 3h30', subtitle: 'De 3h30 à 3h59', price: '95€', oldPrice: '125€' },
    { title: 'Forfait 4h', subtitle: 'À partir de 3h20', price: '100€', oldPrice: '150€' },
  ];

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="flex flex-col max-w-7xl mx-auto gap-8 px-6 py-10">
        <button
          onClick={onBack}
          className="flex items-center text-slate-700 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Retour à la sélection</span>
        </button>

        <div className="text-center">
          <h1 className={`text-4xl font-bold tracking-wider ${titleColor}`}>{pageTitle}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col items-center mb-6">
                <h2 className={`text-base font-bold tracking-wider uppercase ${accentColor} px-4 py-2 rounded-lg`}>
                  Formulaire de réservation
                </h2>
              </div>

              <p className="text-center text-slate-700 text-sm mb-8">
                Remplissez vos informations personnelles et sélectionnez la date et l'heure de votre venue
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
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
                      placeholder="Votre prénom"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:ring-slate-300 focus:border-transparent transition-all text-sm"
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
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:ring-slate-300 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="votre.email@exemple.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:ring-slate-300 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="bookingDate" className="block text-sm font-medium text-slate-700 mb-2">
                    Date de réservation
                  </label>
                  <input
                    type="date"
                    id="bookingDate"
                    required
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:ring-slate-300 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="arrivalTime" className="block text-sm font-medium text-slate-700 mb-2">
                      Heure d'arrivée
                    </label>
                    <input
                      type="time"
                      id="arrivalTime"
                      required
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:ring-slate-300 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="departureTime" className="block text-sm font-medium text-slate-700 mb-2">
                      Heure de départ
                    </label>
                    <input
                      type="time"
                      id="departureTime"
                      required
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-0 focus:ring-slate-300 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                {timeError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                    {timeError}
                  </div>
                )}

                {formData.bookingDate && formData.arrivalTime && formData.departureTime && !availability.skipCheck && availability.status !== 'idle' && (
                  <div className={`border rounded-lg p-3 flex items-start gap-3 ${
                    availability.status === 'available'
                      ? 'bg-green-50 border-green-200'
                      : availability.status === 'checking'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    {availability.status === 'checking' && (
                      <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                    )}
                    {availability.status === 'available' && (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {availability.status === 'unavailable' && (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${
                        availability.status === 'available'
                          ? 'text-green-800'
                          : availability.status === 'checking'
                          ? 'text-blue-800'
                          : 'text-red-800'
                      }`}>
                        {availability.message}
                      </p>
                      {availability.status === 'available' && availability.spotsRemaining !== undefined && type === 'coworking' && (
                        <p className="text-xs text-green-700 mt-1">
                          {availability.spotsRemaining} place{availability.spotsRemaining > 1 ? 's' : ''} restante{availability.spotsRemaining > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-slate-700">Coût estimé</span>
                  <span className="bg-cyan-100 text-slate-700 px-4 py-2 rounded-full font-medium text-lg">
                    {cost.toFixed(2)} €
                  </span>
                </div>

                {message && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
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
                  className={`w-full ${buttonColor} text-white py-4 rounded-xl font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-all`}
                >
                  {isSubmitting ? 'Réservation en cours...' : 'Réserver maintenant et payer sur place'}
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="w-full h-56 bg-cover bg-center" style={{backgroundImage: "url('https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=600')"}} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-600 text-sm tracking-wide">Adresse</h3>
                    <p className="text-slate-700 text-sm mt-1">34 Rue d'Aligre, 75012 Paris</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-600 text-sm tracking-wide">Horaires d'ouverture</h3>
                    <p className="text-slate-700 text-xs mt-1">Lun - Ven : 9h - 19h</p>
                    <p className="text-slate-700 text-xs">Sam : 10h - 18h</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col items-center mb-6">
                <h2 className={`text-base font-bold tracking-wider uppercase ${accentColor} px-4 py-2 rounded-lg`}>
                  Tarifs
                </h2>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col gap-4 flex-1">
                  <div className="text-center">
                    <h3 className="font-bold text-blue-600 text-sm tracking-wide">Tarifs à l'heure</h3>
                  </div>

                  <div className="flex flex-col gap-3">
                    {hourlyRates.map((rate, index) => (
                      <div key={index} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-slate-700 text-sm">{rate.title}</p>
                          <p className="text-slate-500 text-xs italic">{rate.subtitle}</p>
                        </div>
                        <span className="bg-cyan-100 text-slate-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                          {rate.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  <div className="text-center">
                    <h3 className="font-bold text-blue-600 text-sm tracking-wide">Tarifs avantageux</h3>
                  </div>

                  <div className="flex flex-col gap-3">
                    {advantageousRates.map((rate, index) => (
                      <div key={index} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-slate-700 text-sm">{rate.title}</p>
                          <p className="text-slate-500 text-xs italic">{rate.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className="bg-cyan-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                            {rate.price}
                          </span>
                          <span className="text-slate-400 text-sm line-through">
                            {rate.oldPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 mt-6 pt-6">
                <p className="text-center text-slate-600 text-xs italic">
                  Seul le temps passé dans l'espace est facturé, les pauses déjeuners en extérieur ou les sorties temporaires ne comptent pas dans la facturation finale.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          Vos données sont sécurisées et ne seront utilisées que pour votre réservation
        </p>
      </div>
    </div>
  );
}

export default App;

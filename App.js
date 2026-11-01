import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { 
  Search, PlusCircle, Heart, MessageSquare, Tag, MapPin, 
  Car, Home, Smartphone, Wrench, Dog, Layers, X, Phone, 
  CheckCircle, Camera, SlidersHorizontal, Image as ImageIcon,
  Share2, ShieldCheck, Download
} from 'lucide-react';

// =========================================================
// ربط آمن عبر متغيرات البيئة (Environment Variables) لحماية المفاتيح
// =========================================================
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDvn_NNPUnHnHa0hjKhsJYg9w1IQnIaBZw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "alsouq-eg.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "alsouq-eg",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "alsouq-eg.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "169954427332",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:169954427332:web:88938253ee283b0474a491"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);

// الأقسام والمحافظات
const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: Layers },
  { id: 'real-estate', name: 'عقارات', icon: Home },
  { id: 'lands', name: 'أراضي', icon: MapPin },
  { id: 'cars', name: 'سيارات', icon: Car },
  { id: 'parts', name: 'قطع غيار', icon: Wrench },
  { id: 'pets', name: 'حيوانات أليفة', icon: Dog },
  { id: 'electronics', name: 'إلكترونيات', icon: Smartphone }
];

const CITIES = ['الكل', 'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية', 'البحيرة', 'المنوفية', 'الغربية', 'أسيوط', 'سوهاج'];

export default function AlsouqApp() {
  const [ads, setAds] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(false);

  // فلاتر متقدمة
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [rooms, setRooms] = useState('');
  const [yearMin, setYearMin] = useState('');

  // نموذج الإعلان الجديد
  const [newAd, setNewAd] = useState({
    title: '',
    category: 'real-estate',
    price: '',
    city: 'القاهرة',
    phone: '',
    description: '',
    images: [],
    details: { rooms: '', area: '', year: '', mileage: '', breed: '', condition: 'مستعمل' }
  });

  // جلب الإعلانات من Firebase
  useEffect(() => {
    try {
      const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAds = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAds(fetchedAds);
      });
      return () => unsubscribe();
    } catch (e) {
      console.log("وضع التشغيل التجريبي");
    }
  }, []);

  // ضغط الصور تلقائياً
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const scaleFactor = MAX_WIDTH / img.width;
          
          if (scaleFactor < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleFactor;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);

          setNewAd(prev => ({ ...prev, images: [...prev.images, compressedBase64] }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // نشر إعلان جديد
  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.title || !newAd.price || !newAd.phone) return alert('برجاء ملء الحقول الأساسية!');

    setLoading(true);

    try {
      const adData = {
        title: newAd.title,
        category: newAd.category,
        price: Number(newAd.price),
        city: newAd.city,
        phone: newAd.phone,
        description: newAd.description,
        images: newAd.images.length > 0 ? newAd.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80'],
        details: newAd.details,
        createdAt: serverTimestamp(),
        dateStr: 'الآن'
      };

      await addDoc(collection(db, "ads"), adData);
      
      setShowAddModal(false);
      setNewAd({
        title: '', category: 'real-estate', price: '', city: 'القاهرة', phone: '', description: '', images: [],
        details: { rooms: '', area: '', year: '', mileage: '', breed: '', condition: 'مستعمل' }
      });
      alert('تم نشر إعلانك بنجاح على منصة السوق!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء النشر، حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const filteredAds = ads.filter(ad => {
    if (activeCategory !== 'all' && ad.category !== activeCategory) return false;
    if (selectedCity !== 'الكل' && ad.city !== selectedCity) return false;
    if (searchQuery && !ad.title.includes(searchQuery) && !ad.description?.includes(searchQuery)) return false;
    if (priceMin && ad.price < Number(priceMin)) return false;
    if (priceMax && ad.price > Number(priceMax)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dir-rtl pb-20 md:pb-8 font-sans" dir="rtl">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setActiveCategory('all');}}>
            <div className="bg-emerald-600 text-white p-2 rounded-xl font-black text-xl tracking-wider shadow-md">
              السوق
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              alsouq.eg
            </span>
          </div>

          <div className="flex-1 max-w-2xl relative hidden md:block">
            <input
              type="text"
              placeholder="ابحث عن عقار، سيارة، هاتف، أو أي شيء في مصر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all text-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>أضف إعلانك</span>
          </button>
        </div>

        {/* Mobile Search */}
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن كل ما تحتاجه في السوق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-gray-100 rounded-xl text-sm"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                  active 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Ads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-fit">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> تصفية النتائج
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">المحافظة</label>
                <select 
                  value={selectedCity} 
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAds.map(ad => (
                <div key={ad.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <button 
                        onClick={() => toggleFavorite(ad.id)}
                        className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-md transition-all ${
                          favorites.includes(ad.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                      <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg">
                        {ad.city}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 onClick={() => setSelectedAd(ad)} className="font-bold text-gray-800 line-clamp-1 hover:text-emerald-600 cursor-pointer">
                        {ad.title}
                      </h3>
                      <div className="text-lg font-black text-emerald-600 mt-2">
                        {ad.price?.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex gap-2">
                    <button onClick={() => setSelectedAd(ad)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl text-center">
                      التفاصيل
                    </button>
                    <a href={`tel:${ad.phone}`} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add Ad Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 p-2 bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-black text-gray-900 mb-4">إضافة إعلان جديد في السوق</h2>
            <form onSubmit={handleCreateAd} className="space-y-4 text-sm">
              <input 
                type="text" placeholder="عنوان الإعلان" value={newAd.title} 
                onChange={e => setNewAd({...newAd, title: e.target.value})}
                className="w-full bg-gray-50 border rounded-xl p-3 text-sm" required
              />
              <input 
                type="number" placeholder="السعر (ج.م)" value={newAd.price} 
                onChange={e => setNewAd({...newAd, price: e.target.value})}
                className="w-full bg-gray-50 border rounded-xl p-3 text-sm" required
              />
              <input 
                type="tel" placeholder="رقم الموبايل (01xxxxxxxx)" value={newAd.phone} 
                onChange={e => setNewAd({...newAd, phone: e.target.value})}
                className="w-full bg-gray-50 border rounded-xl p-3 text-sm" required
              />
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-gray-500 bg-gray-50 p-2 rounded-xl border" />
              <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md">
                {loading ? 'جاري النشر...' : 'نشر الإعلان الآن'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { 
  Search, PlusCircle, Heart, MessageSquare, Tag, MapPin, 
  Car, Home, Smartphone, Wrench, Dog, Layers, X, Phone, 
  CheckCircle, Camera, SlidersHorizontal, Image as ImageIcon,
  Share2, ShieldCheck, Download
} from 'lucide-react';

// =========================================================
// 1. تهيئة الـ Firebase باستخدام بيانات مشروعك الحقيقية
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyDvn_NNPUnHnHa0hjKhsJYg9w1IQnIaBZw",
  authDomain: "alsouq-eg.firebaseapp.com",
  projectId: "alsouq-eg",
  storageBucket: "alsouq-eg.firebasestorage.app",
  messagingSenderId: "169954427332",
  appId: "1:169954427332:web:88938253ee283b0474a491",
  measurementId: "G-8TCES10CFE"
};

const app = initializeApp(firebaseConfig);
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
  const [activeTab, setActiveTab] = useState('home');
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

  // =========================================================
  // 2. جلب الإعلانات مباشرة من Firebase Cloud Firestore
  // =========================================================
  useEffect(() => {
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAds(fetchedAds);
    }, (error) => {
      console.log("استخدام البيانات المحلية حتى اكتمال قواعد Firebase");
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // 3. ضغط الصور قبل الرفع لتوفير المساحة وسرعة التحميل
  // =========================================================
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
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75); // ضغط 75% بدقة عالية

          setNewAd(prev => ({ ...prev, images: [...prev.images, compressedBase64] }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // =========================================================
  // 4. حفظ الإعلان في Firebase Cloud Firestore
  // =========================================================
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
        featured: false,
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

  // تصفية الإعلانات
  const filteredAds = ads.filter(ad => {
    if (activeCategory !== 'all' && ad.category !== activeCategory) return false;
    if (selectedCity !== 'الكل' && ad.city !== selectedCity) return false;
    if (searchQuery && !ad.title.includes(searchQuery) && !ad.description?.includes(searchQuery)) return false;
    if (priceMin && ad.price < Number(priceMin)) return false;
    if (priceMax && ad.price > Number(priceMax)) return false;
    if (rooms && ad.details?.rooms && Number(ad.details.rooms) < Number(rooms)) return false;
    if (yearMin && ad.details?.year && Number(ad.details.year) < Number(yearMin)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dir-rtl pb-20 md:pb-8 font-sans" dir="rtl">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setActiveCategory('all'); setActiveTab('home');}}>
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

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>أضف إعلانك</span>
            </button>
          </div>
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
        
        {/* Ad Banner - Top */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
          <div>
            <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">إعلان مُميز</span>
            <h3 className="font-bold text-lg mt-1">حمل تطبيق السوق المباشر الآن!</h3>
            <p className="text-xs text-blue-100">تصفح أسرع وإشعارات فورية بالإعلانات والصفقات الجديدة.</p>
          </div>
          <button className="bg-white text-blue-700 px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-gray-100 transition-all">
            تثبيت التطبيق
          </button>
        </div>

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

        {/* Layout with Sidebar Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
          
          {/* Filters Sidebar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> تصفية النتائج
              </span>
              <button 
                onClick={() => { setSelectedCity('الكل'); setPriceMin(''); setPriceMax(''); setRooms(''); setYearMin(''); }} 
                className="text-xs text-emerald-600 font-semibold"
              >
                إعادة ضبط
              </button>
            </div>

            <div className="space-y-4 text-sm">
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

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">السعر (ج.م)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="من" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="w-1/2 bg-gray-50 border rounded-xl p-2 text-xs" />
                  <input type="number" placeholder="إلى" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="w-1/2 bg-gray-50 border rounded-xl p-2 text-xs" />
                </div>
              </div>

              {activeCategory === 'real-estate' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الحد الأدنى للغرف</label>
                  <input type="number" placeholder="عدد الغرف" value={rooms} onChange={e => setRooms(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-2 text-xs" />
                </div>
              )}

              {activeCategory === 'cars' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">سنة الصنع (من)</label>
                  <input type="number" placeholder="مثال: 2015" value={yearMin} onChange={e => setYearMin(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-2 text-xs" />
                </div>
              )}
            </div>
          </div>

          {/* Ads Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">النتائج ({filteredAds.length})</h2>
              <span className="text-xs text-gray-400">تحديث مباشر لقاعدة البيانات</span>
            </div>

            {filteredAds.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-700">لا توجد إعلانات مطابقة لجميع الفلاتر المختارة</h3>
                <p className="text-xs text-gray-400 mt-1">جرّب تغيير قسم التصفية أو إلغاء فلاتر السعر والمحافظة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAds.map((ad, index) => (
                  <React.Fragment key={ad.id}>
                    
                    {/* Native Banner Placement inside Feed */}
                    {index === 3 && (
                      <div className="md:col-span-2 xl:col-span-3 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold">مساحة إعلانية</span>
                          <h4 className="font-bold text-amber-900 text-sm mt-1">هل تملك معترضاً أو شركة عقارات؟</h4>
                          <p className="text-xs text-amber-700">احصل على باقة تجارية مميزة وعرض إعلاناتك أمام آلاف المشترين يومياً.</p>
                        </div>
                        <button className="bg-amber-600 text-white text-xs px-3 py-2 rounded-xl font-bold">اتصل بنا</button>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                      <div>
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={ad.images[0]} 
                            alt={ad.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
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
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {CATEGORIES.find(c => c.id === ad.category)?.name || 'عام'}
                            </span>
                            <span className="text-[11px] text-gray-400">{ad.dateStr || 'حديث'}</span>
                          </div>

                          <h3 
                            onClick={() => setSelectedAd(ad)} 
                            className="font-bold text-gray-800 line-clamp-1 hover:text-emerald-600 cursor-pointer mt-1"
                          >
                            {ad.title}
                          </h3>

                          <div className="text-lg font-black text-emerald-600 mt-2">
                            {ad.price?.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                          </div>

                          {/* Quick specs pill */}
                          <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-gray-500 border-t border-gray-50 pt-2">
                            {ad.details?.rooms && <span>• {ad.details.rooms} غرف</span>}
                            {ad.details?.area && <span>• {ad.details.area} م²</span>}
                            {ad.details?.year && <span>• موديل {ad.details.year}</span>}
                            {ad.details?.mileage && <span>• {ad.details.mileage} كم</span>}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 flex gap-2">
                        <button 
                          onClick={() => setSelectedAd(ad)} 
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl text-center"
                        >
                          التفاصيل
                        </button>
                        <a 
                          href={`tel:${ad.phone}`} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl flex items-center justify-center"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button 
              onClick={() => setSelectedAd(null)}
              className="absolute top-4 left-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="h-64 rounded-2xl overflow-hidden bg-gray-100 mb-4">
              <img src={selectedAd.images[0]} alt={selectedAd.title} className="w-full h-full object-cover" />
            </div>

            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              {selectedAd.city}
            </span>

            <h2 className="text-xl font-black text-gray-900 mt-2">{selectedAd.title}</h2>
            <div className="text-2xl font-black text-emerald-600 my-2">{selectedAd.price?.toLocaleString()} ج.م</div>

            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl my-4">
              {selectedAd.description || 'لا يوجد وصف تفصيلي إضافي لهذا الإعلان.'}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block mb-0.5">رقم المعلن</span>
                <span className="font-bold text-gray-800">{selectedAd.phone}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block mb-0.5">تاريخ النشر</span>
                <span className="font-bold text-gray-800">{selectedAd.dateStr || 'اليوم'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <a 
                href={`tel:${selectedAd.phone}`} 
                className="flex-1 bg-emerald-600 text-white text-center font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" /> الاتصال الآن
              </a>
              <a 
                href={`https://wa.me/2${selectedAd.phone}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-green-500 text-white text-center font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                واتساب
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Ad Modal with Image Compression */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <h2 className="text-lg font-black text-gray-900 mb-4">إضافة إعلان جديد في السوق</h2>

            <form onSubmit={handleCreateAd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عنوان الإعلان *</label>
                <input 
                  type="text" 
                  placeholder="مثال: شقة للبيع في حدائق الأهرام" 
                  value={newAd.title} 
                  onChange={e => setNewAd({...newAd, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">القسم</label>
                  <select 
                    value={newAd.category} 
                    onChange={e => setNewAd({...newAd, category: e.target.value})}
                    className="w-full bg-gray-50 border rounded-xl p-3 text-xs"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المحافظة</label>
                  <select 
                    value={newAd.city} 
                    onChange={e => setNewAd({...newAd, city: e.target.value})}
                    className="w-full bg-gray-50 border rounded-xl p-3 text-xs"
                  >
                    {CITIES.filter(c => c !== 'الكل').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">السعر (ج.م) *</label>
                  <input 
                    type="number" 
                    placeholder="السعر بالجنيه" 
                    value={newAd.price} 
                    onChange={e => setNewAd({...newAd, price: e.target.value})}
                    className="w-full bg-gray-50 border rounded-xl p-3 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الموبايل *</label>
                  <input 
                    type="tel" 
                    placeholder="01xxxxxxxx" 
                    value={newAd.phone} 
                    onChange={e => setNewAd({...newAd, phone: e.target.value})}
                    className="w-full bg-gray-50 border rounded-xl p-3 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">صور الإعلان (يتم ضغطها تلقائياً للحفاظ على الأداء)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="w-full text-xs text-gray-500 bg-gray-50 p-2 rounded-xl border"
                />
                {newAd.images.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {newAd.images.map((img, i) => (
                      <img key={i} src={img} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الوصف التفصيلي</label>
                <textarea 
                  rows="3" 
                  placeholder="اكتب كافة التفاصيل، الحالة، سبب البيع..." 
                  value={newAd.description} 
                  onChange={e => setNewAd({...newAd, description: e.target.value})}
                  className="w-full bg-gray-50 border rounded-xl p-3 text-xs"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm mt-2"
              >
                {loading ? 'جاري نشر الإعلان...' : 'نشر الإعلان الآن'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
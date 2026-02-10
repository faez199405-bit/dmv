
import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, CartItem, OrderPayload } from './types';
import { API_URL, WHATSAPP_NO } from './constants';
import { MenuCard } from './components/MenuCard';
import { CartModal } from './components/CartModal';
import { getFoodRecommendation } from './services/geminiService';

// Data sokongan jika API tidak dapat dicapai
const MOCK_DATA_FALLBACK: Record<string, any[]> = {
  "Nasi & Lauk": [
    { id: "m1", menu: "Nasi Lemak Ayam Berempah", harga: 8.50, harga_asal: 9.50, stok: 15, status: "AKTIF", gambar: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=400" },
    { id: "m2", menu: "Nasi Kerabu Keramat", harga: 10.00, harga_asal: 12.00, stok: 10, status: "AKTIF", gambar: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400" }
  ],
  "Minuman": [
    { id: "m3", menu: "Teh Tarik Kaw", harga: 2.50, harga_asal: 3.00, stok: 50, status: "AKTIF", gambar: "https://images.unsplash.com/photo-1594631252845-29fc4586c567?auto=format&fit=crop&q=80&w=400" },
    { id: "m4", menu: "Sirap Bandung Muar", harga: 3.50, harga_asal: 4.00, stok: 30, status: "AKTIF", gambar: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400" }
  ],
  "Pencuci Mulut": [
    { id: "m5", menu: "Kuih Lapis Pelangi", harga: 4.00, harga_asal: 5.00, stok: 20, status: "AKTIF", gambar: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=400" }
  ]
};

const App: React.FC = () => {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const processMenuData = (data: Record<string, any[]>) => {
    const flatMenu: MenuItem[] = [];
    const cats = Object.keys(data);
    
    cats.forEach(cat => {
      data[cat].forEach((m: any) => {
        flatMenu.push({
          id: String(m.id),
          name: m.menu,
          price: Number(m.harga),
          originalPrice: Number(m.harga_asal),
          stok: Number(m.stok),
          status: m.status,
          img: m.gambar || `https://picsum.photos/seed/${m.id}/400/300`,
          cat: cat.toLowerCase(),
          originalCat: cat
        });
      });
    });

    setMenuData(flatMenu);
    setCategories(['Semua', ...cats]);
  };

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(`${API_URL}?action=all_menu`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Ralat HTTP! Status: ${res.status}`);
        
        const json = await res.json();
        if (json.status && json.data) {
          processMenuData(json.data);
          setIsOffline(false);
        } else {
          throw new Error("Format data tidak sah");
        }
      } catch (err) {
        console.warn("Gagal mengambil menu, menggunakan data simpanan:", err);
        processMenuData(MOCK_DATA_FALLBACK);
        setIsOffline(true);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredMenu = useMemo(() => {
    return menuData.filter(item => {
      const matchesCat = selectedCategory === 'Semua' || item.originalCat === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isActive = item.status === 'AKTIF';
      return matchesCat && matchesSearch && isActive;
    });
  }, [menuData, selectedCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.id === item.id);
    const inCartQty = existing ? existing.qty : 0;

    if (inCartQty >= item.stok) {
      alert("Maaf ya, stok untuk menu ini sudah habis!");
      return;
    }

    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
    
    setMenuData(prev => prev.map(m => m.id === item.id ? { ...m, stok: m.stok - 1 } : m));
  };

  const updateCartQty = (id: string, delta: number) => {
    const itemInCart = cart.find(c => c.id === id);
    const itemInMenu = menuData.find(m => m.id === id);
    if (!itemInCart || !itemInMenu) return;

    const newQty = itemInCart.qty + delta;

    if (delta > 0 && itemInMenu.stok <= 0) {
      alert("Alamak, stok tidak cukup lah!");
      return;
    }

    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== id));
    } else {
      setCart(cart.map(c => c.id === id ? { ...c, qty: newQty } : c));
    }

    setMenuData(prev => prev.map(m => m.id === id ? { ...m, stok: m.stok - delta } : m));
  };

  const handleCheckout = async (formData: any) => {
    setIsOrdering(true);
    const { nama, alamat, kawasan, pembayaran, grandTotal } = formData;
    
    const alamatLengkap = kawasan === 'WALK-IN' ? "AMBIL SENDIRI" : `${kawasan}, ${alamat}`;
    const bayaranLabel = pembayaran === 'CASH' ? 'Tunai (COD)' : 'DuitNow QR / Transfer';

    const payload: OrderPayload = {
      action: "create_order",
      pelanggan: nama,
      alamat: alamatLengkap,
      bayaran: bayaranLabel,
      jumlah: grandTotal,
      item: cart.map(i => ({
        menuId: i.id,
        nama: i.name,
        harga: i.price,
        harga_asal: i.originalPrice,
        qty: i.qty
      }))
    };

    try {
      if (!isOffline) {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        await res.json();
      }
    } catch (err) {
      console.log("Meneruskan pesanan melalui WhatsApp.");
    } finally {
      const waText = `*PESANAN ONLINE - DAPUR MOMMY*\n\n` +
        `Nama Pelanggan: ${nama}\n` +
        `Alamat/Kawasan: ${alamatLengkap}\n` +
        `Cara Bayaran: ${bayaranLabel}\n\n` +
        `*Senarai Pesanan:*\n` +
        cart.map(i => `- ${i.name} (x${i.qty}) ... RM ${(i.price * i.qty).toFixed(2)}`).join('\n') +
        `\n\n*JUMLAH BESAR: RM ${grandTotal.toFixed(2)}*\n\nTerima kasih kerana menyokong Dapur Mommy! ❤️`;

      window.location.href = `https://wa.me/${WHATSAPP_NO}?text=${encodeURIComponent(waText)}`;
      setCart([]);
      setIsCartOpen(false);
      setIsOrdering(false);
    }
  };

  const fetchAiTip = async () => {
    setIsAiLoading(true);
    const activeMenuNames = menuData.filter(m => m.stok > 0).slice(0, 10).map(m => m.name);
    const rec = await getFoodRecommendation(activeMenuNames);
    setRecommendation(rec || "Pilih menu Mommy hari ini, semuanya sedap!");
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-rose-600 text-white sticky top-0 z-50 px-5 py-4 shadow-xl shadow-rose-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Dapur Mommy</h1>
            {isOffline && (
              <span className="text-[10px] bg-amber-400 text-rose-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Mod Luar Talian (Demo)
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative bg-white/20 p-2.5 rounded-2xl active:scale-90 transition-transform"
          >
            <span className="text-2xl">🛒</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-rose-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-rose-600">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Cari makanan kegemaran anda..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 pl-11 pr-4 py-3 rounded-2xl outline-none focus:ring-2 ring-rose-300 transition-shadow"
          />
        </div>
      </header>

      {/* Categories */}
      <nav className="flex gap-2 p-5 overflow-x-auto no-scrollbar bg-rose-50/50">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 -translate-y-0.5' 
                : 'bg-white text-slate-500 border border-rose-100 hover:border-rose-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-24">
        {/* AI Suggestion Section */}
        <div className="bg-white rounded-[2rem] p-5 mb-8 border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/30 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">✨</span>
              <h4 className="font-extrabold text-rose-600 text-sm uppercase">Cadangan Mommy</h4>
            </div>
            {recommendation ? (
              <p className="text-slate-600 text-sm italic mb-3 leading-relaxed">"{recommendation}"</p>
            ) : (
              <p className="text-slate-400 text-sm mb-3">Tak tahu nak makan apa? Tanya Mommy!</p>
            )}
            <button 
              onClick={fetchAiTip}
              disabled={isAiLoading}
              className="text-[10px] font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors uppercase tracking-wider disabled:opacity-50"
            >
              {isAiLoading ? 'Mommy tengah fikir...' : 'Dapatkan Cadangan'}
            </button>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium">Tunggu jap, Mommy tengah susun menu...</p>
          </div>
        ) : filteredMenu.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMenu.map(item => (
              <MenuCard key={item.id} item={item} onAdd={addToCart} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">🍽️</span>
            <p className="text-slate-400 font-medium">Alamak, menu yang dicari tak jumpa pula.</p>
          </div>
        )}
      </main>

      {/* Cart Modal */}
      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQty={updateCartQty}
        onSubmit={handleCheckout}
        isLoading={isOrdering}
      />
      
      {/* Floating Cart (Bottom) for quick access */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 animate-bounce-in">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-rose-600 text-white p-4 rounded-2xl shadow-2xl shadow-rose-400 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white text-rose-600 font-black px-2.5 py-1 rounded-lg text-sm">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
              <span className="font-bold text-sm">Tengok Troli</span>
            </div>
            <span className="font-extrabold text-lg">
              RM {cart.reduce((a, b) => a + (b.price * b.qty), 0).toFixed(2)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;

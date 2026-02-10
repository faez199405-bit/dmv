
import React, { useState } from 'react';
import { CartItem, Kawasan, Bayaran } from '../types';
import { DELIVERY_FEES } from '../constants';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQty: (id: string, delta: number) => void;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}

export const CartModal: React.FC<CartModalProps> = ({ 
  isOpen, 
  onClose, 
  cart, 
  updateQty, 
  onSubmit,
  isLoading 
}) => {
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kawasan, setKawasan] = useState<Kawasan>('WALK-IN');
  const [pembayaran, setPembayaran] = useState<Bayaran>('CASH');

  if (!isOpen) return null;

  const subTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const deliveryFee = DELIVERY_FEES[kawasan];
  const grandTotal = subTotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    onSubmit({ nama, alamat, kawasan, pembayaran, grandTotal });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity">
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] max-h-[92vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-rose-600">Troli Anda</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl block mb-4">🛒</span>
              <p className="text-slate-500 font-medium">Troli anda masih kosong.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <p className="text-xs text-slate-500">RM {item.price.toFixed(2)} / unit</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl">
                    <button 
                      onClick={() => updateQty(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      −
                    </button>
                    <span className="font-bold w-6 text-center">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-rose-50/50 rounded-2xl p-4 space-y-2 mb-8">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Jumlah Makanan</span>
              <span className="font-semibold">RM {subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Kos Penghantaran</span>
              <span className="font-semibold">{kawasan === 'WALK-IN' ? 'Percuma' : `RM ${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-slate-800 pt-2 border-t border-rose-100">
              <span>Jumlah Keseluruhan</span>
              <span className="text-rose-600">RM {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">NAMA PENUH</label>
              <input 
                required
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Masukkan nama anda..."
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-400 outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ALAMAT PENGHANTARAN</label>
              <textarea 
                required={kawasan !== 'WALK-IN'}
                rows={2}
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
                placeholder={kawasan === 'WALK-IN' ? "Tidak diperlukan untuk ambil sendiri" : "Sila masukkan alamat lengkap anda..."}
                disabled={kawasan === 'WALK-IN'}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-400 outline-none transition-colors text-sm disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">KAWASAN</label>
                <select 
                  value={kawasan}
                  onChange={e => setKawasan(e.target.value as Kawasan)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-400 outline-none transition-colors text-sm"
                >
                  <option value="WALK-IN">Ambil Sendiri</option>
                  <option value="RESIDEN1">Residen 1 (+RM1)</option>
                  <option value="LAIN-LAIN">Lain-lain (+RM2)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">CARA BAYARAN</label>
                <select 
                  value={pembayaran}
                  onChange={e => setPembayaran(e.target.value as Bayaran)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-400 outline-none transition-colors text-sm"
                >
                  <option value="CASH">Tunai (COD)</option>
                  <option value="QR">DuitNow QR / Transfer</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || cart.length === 0}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Hantar Pesanan Sekarang</span>
                  <span className="text-xl">🚀</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

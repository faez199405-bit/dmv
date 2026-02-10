
import React from 'react';
import { MenuItem } from '../types';

interface MenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAdd }) => {
  const isSoldOut = item.stok <= 0;
  const isLowStock = item.stok > 0 && item.stok <= 3;

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-rose-100 overflow-hidden flex flex-col transition-all active:scale-95 ${isSoldOut ? 'opacity-60 grayscale' : ''}`}>
      <div className="relative pt-[75%] bg-slate-100 overflow-hidden">
        <img 
          src={item.img} 
          alt={item.name} 
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {isSoldOut && (
          <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
            HABIS
          </div>
        )}
        {isLowStock && !isSoldOut && (
          <div className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
            STOK {item.stok}
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800 text-sm md:text-base mb-1 line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </h3>
        <p className="text-[10px] text-slate-500 mb-3">
          {isSoldOut ? 'Sedang diulang kaji' : `Tersedia: ${item.stok} unit`}
        </p>
        
        <div className="mt-auto flex justify-between items-center">
          <span className="font-extrabold text-rose-600">RM {item.price.toFixed(2)}</span>
          <button 
            onClick={() => onAdd(item)}
            disabled={isSoldOut}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-md ${
              isSoldOut 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-90 shadow-rose-200'
            }`}
          >
            <span className="text-xl font-bold">+</span>
          </button>
        </div>
      </div>
    </div>
  );
};

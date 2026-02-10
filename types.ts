
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  stok: number;
  status: string;
  img: string;
  cat: string;
  originalCat: string;
}

export interface CartItem extends MenuItem {
  qty: number;
}

export interface OrderPayload {
  action: "create_order";
  pelanggan: string;
  alamat: string;
  bayaran: string;
  jumlah: number;
  item: {
    menuId: string;
    nama: string;
    harga: number;
    harga_asal: number;
    qty: number;
  }[];
}

export type Kawasan = "WALK-IN" | "RESIDEN1" | "LAIN-LAIN";
export type Bayaran = "CASH" | "QR";

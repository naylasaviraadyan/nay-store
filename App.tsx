/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ReceiptText, CheckCircle2, XCircle, Package, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Barang, Transaksi, runTests } from './models';

interface TestResults {
  unitTotal: boolean;
  unitInput: boolean;
  integration: boolean;
}

const AVAILABLE_PRODUCTS = [
  new Barang('p1', 'Beras 5kg', 65000),
  new Barang('p2', 'Minyak 2L', 38000),
  new Barang('p3', 'Gula 1kg', 14500),
  new Barang('p4', 'Telur 1kg', 28000),
  new Barang('p5', 'Kopi 200g', 12000),
  new Barang('p6', 'Susu UHT', 18500),
];

export default function App() {
  const [products, setProducts] = useState<Barang[]>(AVAILABLE_PRODUCTS);
  const [transaction, setTransaction] = useState<Transaksi>(new Transaksi('TX-' + Math.random().toString(36).substr(2, 9)));
  const [showReceipt, setShowReceipt] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTestLogs, setShowTestLogs] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Barang | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Manual product input state
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductImage, setNewProductImage] = useState<string | undefined>(undefined);
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    // Run tests on mount
    setTestResults(runTests());
  }, []);

  const openEditForm = (product: Barang) => {
    setEditingProduct(product);
    setNewProductName(product.nama);
    setNewProductPrice(product.harga.toString());
    setNewProductImage(product.gambar);
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingProduct(null);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductImage(undefined);
    setInputError('');
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    // Also remove from cart if present
    const newTx = new Transaksi(transaction.id);
    transaction.items.forEach(item => {
      if (item.barang.id !== productId) {
        newTx.tambahItem(item.barang, item.jumlah);
      }
    });
    setTransaction(newTx);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for local storage/base64
        setInputError('Ukuran gambar terlalu besar (maks 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddManualProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');

    if (!newProductName.trim()) {
      setInputError('Nama barang harus diisi');
      return;
    }

    const price = parseFloat(newProductPrice);
    if (isNaN(price) || price < 0) {
      setInputError('Harga tidak valid atau negatif');
      return;
    }

    try {
      if (editingProduct) {
        // Update existing
        setProducts(products.map(p =>
          p.id === editingProduct.id
            ? new Barang(p.id, newProductName, price, newProductImage)
            : p
        ));
      } else {
        // Create new
        const defaultImage = `https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=300&auto=format&fit=crop`;
        const newProduct = new Barang(
          'p-' + Math.random().toString(36).substr(2, 5),
          newProductName,
          price,
          newProductImage || defaultImage
        );
        setProducts([newProduct, ...products]);
      }
      closeForm();
    } catch (err: any) {
      setInputError(err.message);
    }
  };

  const addToCart = (barang: Barang) => {
    const newTx = new Transaksi(transaction.id);
    transaction.items.forEach(item => {
      newTx.tambahItem(item.barang, item.jumlah);
    });
    newTx.tambahItem(barang, 1);
    setTransaction(newTx);
  };

  const updateQuantity = (barangId: string, delta: number) => {
    const newTx = new Transaksi(transaction.id);
    transaction.items.forEach(item => {
      if (item.barang.id === barangId) {
        const newQty = item.jumlah + delta;
        if (newQty > 0) {
          newTx.tambahItem(item.barang, newQty);
        }
      } else {
        newTx.tambahItem(item.barang, item.jumlah);
      }
    });
    setTransaction(newTx);
  };

  const removeItem = (barangId: string) => {
    const newTx = new Transaksi(transaction.id);
    transaction.items.forEach(item => {
      if (item.barang.id !== barangId) {
        newTx.tambahItem(item.barang, item.jumlah);
      }
    });
    setTransaction(newTx);
  };

  const resetTransaction = () => {
    setTransaction(new Transaksi('TX-' + Math.random().toString(36).substr(2, 9)));
    setShowReceipt(false);
  };

  const handlePrintReceipt = () => {
    setToast("Struk Berhasil Dicetak! 🖨️");
    setTimeout(() => {
      setToast(null);
      resetTransaction();
    }, 2000);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-slate-800 font-sans p-0 md:p-0">
      <div className="max-w-[1280px] mx-auto min-h-screen flex flex-col shadow-2xl bg-white/30 backdrop-blur-sm">

        {/* Header Section */}
        <header className="bg-emerald-500 p-6 flex flex-col md:flex-row justify-between items-center shadow-md gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <ShoppingCart className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Nay Store</h1>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <div className="bg-emerald-400 text-white px-4 py-2 rounded-full text-xs font-bold border-2 border-emerald-300 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Cashier: Nayla
            </div>
            <div className="bg-white text-emerald-600 px-4 py-2 rounded-full text-xs font-black border-2 border-emerald-100 shadow-sm">
              {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </div>
            <button
              onClick={() => setShowTestLogs(true)}
              className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-black border-2 border-slate-700 shadow-sm flex items-center gap-2 hover:bg-black transition-colors"
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              SYSTEM STATUS
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row p-6 md:p-8 gap-8">

          {/* Left Column: Inventory & Selection */}
          <section className="flex-1 flex flex-col gap-6 w-full lg:w-3/5">

            {/* List Barang */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border-4 border-emerald-50 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center uppercase tracking-tight">
                  <span className="bg-yellow-400 w-2 h-8 mr-4 rounded-full" />
                  Data Barang
                </h2>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center gap-2 transition-transform"
                >
                  <Plus size={20} strokeWidth={3} />
                  Tambah Barang
                </motion.button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product, idx) => {
                  const themes = [
                    'bg-orange-50 border-orange-200 text-orange-600',
                    'bg-blue-50 border-blue-200 text-blue-600',
                    'bg-pink-50 border-pink-200 text-pink-600',
                    'bg-purple-50 border-purple-200 text-purple-600',
                    'bg-emerald-50 border-emerald-200 text-emerald-600',
                    'bg-yellow-50 border-yellow-200 text-yellow-600'
                  ];
                  const theme = themes[idx % themes.length];
                  const [bgColor, borderColor, textColor] = theme.split(' ');

                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -5 }}
                      className={`${bgColor} border-2 ${borderColor} p-0 rounded-3xl flex flex-col group transition-all overflow-hidden shadow-sm hover:shadow-md`}
                    >
                      {product.gambar ? (
                        <div className="h-40 overflow-hidden relative">
                          <img
                            src={product.gambar}
                            alt={product.nama}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                      ) : (
                        <div className="h-40 bg-slate-100 flex items-center justify-center text-slate-300">
                          <Package size={48} strokeWidth={1} />
                        </div>
                      )}
                      <div className="p-5 flex justify-between items-center">
                        <div>
                          <p className="font-black text-slate-700 leading-tight mb-1">{product.nama}</p>
                          <p className={`${textColor} font-bold text-sm tracking-wide`}>{formatCurrency(product.harga)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const cartItem = transaction.items.find(item => item.barang.id === product.id);
                            const quantity = cartItem ? cartItem.jumlah : 0;

                            return quantity > 0 ? (
                              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 mr-1">
                                <button
                                  onClick={() => updateQuantity(product.id, -1)}
                                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-red-500"
                                >
                                  <Minus size={12} strokeWidth={4} />
                                </button>
                                <span className="w-8 text-center text-xs font-black text-slate-800">{quantity}</span>
                                <button
                                  onClick={() => updateQuantity(product.id, 1)}
                                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-emerald-500"
                                >
                                  <Plus size={12} strokeWidth={4} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                className={`bg-slate-800 hover:bg-emerald-500 text-white p-2.5 rounded-xl shadow-md transition-transform active:scale-90 mr-1`}
                                title="Tambah ke Keranjang"
                              >
                                <Plus size={20} strokeWidth={3} />
                              </button>
                            );
                          })()}
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditForm(product)}
                              className="p-2 bg-blue-100/50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 bg-red-100/50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={14} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right Column: Struk/Receipt */}
          <section className="w-full lg:w-2/5 flex flex-col">
            <div className="bg-white rounded-t-[40px] p-8 shadow-2xl flex-1 relative flex flex-col border-x-4 border-emerald-50/50">
              {/* Serrated Top Edge Visual */}
              <div className="absolute -top-3 left-0 right-0 flex justify-around opacity-30 px-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-emerald-500 rounded-full" />
                ))}
              </div>

              <div className="text-center mb-8 pt-4">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">STRUK BELANJA</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 border-b-2 border-slate-100 pb-2 inline-block">
                  Nay Store #0283
                </p>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="border-y-2 border-dashed border-slate-200 py-6 space-y-4 overflow-y-auto max-h-[400px] pr-2">
                  <AnimatePresence mode='popLayout'>
                    {transaction.items.length === 0 ? (
                      <div className="text-center py-12 text-slate-300 italic font-medium">
                        Belum ada barang dipilih...
                      </div>
                    ) : (
                      transaction.items.map((item) => (
                        <motion.div
                          key={item.barang.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex justify-between items-start group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 text-sm">{item.barang.nama}</span>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">x{item.jumlah}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <button onClick={() => updateQuantity(item.barang.id, -1)} className="text-slate-300 hover:text-red-500"><Minus size={12} strokeWidth={4} /></button>
                              <button onClick={() => updateQuantity(item.barang.id, 1)} className="text-slate-300 hover:text-emerald-500"><Plus size={12} strokeWidth={4} /></button>
                              <button onClick={() => removeItem(item.barang.id)} className="text-slate-200 hover:text-red-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <span className="font-bold text-slate-700 text-sm pl-4">{formatCurrency(item.subtotal)}</span>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                <div className="py-6 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatCurrency(transaction.hitung_total())}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Tax (0%)</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-4 border-double border-slate-100">
                    <span className="text-emerald-600 font-black text-xl italic tracking-tighter">TOTAL</span>
                    <span className="text-emerald-600 font-black text-4xl tracking-tight">{formatCurrency(transaction.hitung_total())}</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    disabled={transaction.items.length === 0}
                    onClick={resetTransaction}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-black py-5 rounded-2xl transition-all transform active:scale-95 uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    disabled={transaction.items.length === 0}
                    onClick={() => setShowReceipt(true)}
                    className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase tracking-widest disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    Proses Pembayaran
                  </button>
                </div>
              </div>
            </div>

            {/* Foot of receipt visual */}
            <div className="bg-emerald-100/50 h-10 rounded-b-[40px] border-t-4 border-white border-dashed shadow-inner flex items-center justify-center">
              <div className="w-16 h-1 bg-emerald-200 rounded-full" />
            </div>
          </section>
        </main>

        <footer className="bg-white/50 backdrop-blur-md p-6 text-center border-t border-slate-200">
          <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase">
            &copy; {new Date().getFullYear()} Nay Store System - Secure Grocery Management v2.0
          </p>
        </footer>

        {/* Modal Struk */}
        <AnimatePresence>
          {showReceipt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, rotate: -2 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.9, rotate: 2 }}
                className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-8 border-white"
              >
                <div className="p-8 pb-4 flex-1">
                  <div className="bg-yellow-50/50 p-6 rounded-[2rem] border-2 border-dashed border-emerald-100">
                    <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-emerald-900 font-bold text-center">
                      {transaction.tampilkan_struk()}
                    </pre>
                  </div>
                </div>
                <div className="p-8 pt-2 flex flex-col gap-3">
                  <button
                    onClick={handlePrintReceipt}
                    className="w-full py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg"
                  >
                    Cetak Struk
                  </button>
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="w-full py-4 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Kembali
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal System Logs */}
        <AnimatePresence>
          {showTestLogs && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-4 border-slate-700 relative text-emerald-400 font-mono"
              >
                <button
                  onClick={() => setShowTestLogs(false)}
                  className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                >
                  <XCircle size={28} />
                </button>

                <h3 className="text-white font-bold mb-6 flex items-center border-b border-slate-800 pb-4 gap-3 text-lg">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping" />
                  System Validation Console
                </h3>

                {testResults && (
                  <div className="space-y-4 text-sm mt-4">
                    <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                      <span className="font-bold uppercase tracking-wider">Unit: Perhitungan Total</span>
                      <span className={`px-3 py-1 rounded font-black ${testResults.unitTotal ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
                        {testResults.unitTotal ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                      <span className="font-bold uppercase tracking-wider">Unit: Input Barang</span>
                      <span className={`px-3 py-1 rounded font-black ${testResults.unitInput ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
                        {testResults.unitInput ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-900/20 p-4 rounded-2xl border border-blue-900/30 italic text-blue-300">
                      <span className="font-bold uppercase tracking-wider">Integration: Toko Workflow</span>
                      <span className={`px-3 py-1 rounded font-black ${testResults.integration ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-300'}`}>
                        {testResults.integration ? 'PASS' : 'FAIL'}
                      </span>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col items-center gap-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Automated Security Audit</p>
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowTestLogs(false)}
                  className="w-full mt-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-xl active:scale-[0.98]"
                >
                  Close Console
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Tambah Barang */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-4 border-emerald-50 relative"
              >
                <button
                  onClick={closeForm}
                  className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <XCircle size={28} />
                </button>

                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center uppercase tracking-tight">
                  <span className="bg-yellow-400 w-2 h-8 mr-4 rounded-full" />
                  {editingProduct ? 'Edit Barang' : 'Tambah Barang'}
                </h2>

                <form onSubmit={handleAddManualProduct} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Barang</label>
                    <input
                      type="text"
                      placeholder="Contoh: Apel Malang 1kg"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Harga (Rp)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 15000"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Foto Barang</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer group-hover:border-emerald-400 transition-colors overflow-hidden"
                      >
                        {newProductImage ? (
                          <img src={newProductImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Package size={24} className="text-slate-300 mb-2" />
                            <span className="text-xs font-bold text-slate-400">Klik untuk pilih gambar</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {inputError && (
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse ml-2">
                      Error: {inputError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] mt-4"
                  >
                    {editingProduct ? 'Update Barang' : 'Simpan Barang'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl border-4 border-emerald-400 flex items-center gap-3"
            >
              <CheckCircle2 className="text-emerald-400" />
              <span className="font-black uppercase tracking-widest text-sm">{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

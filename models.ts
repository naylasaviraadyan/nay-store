/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Barang {
  id: string;
  nama: string;
  harga: number;
  gambar?: string;

  constructor(id: string, nama: string, harga: number, gambar?: string) {
    if (harga < 0) {
      throw new Error("Harga tidak boleh negatif");
    }
    this.id = id;
    this.nama = nama;
    this.harga = harga;
    this.gambar = gambar;
  }
}

export class ItemTransaksi {
  barang: Barang;
  jumlah: number;

  constructor(barang: Barang, jumlah: number) {
    if (jumlah <= 0) {
      throw new Error("Jumlah harus lebih dari 0");
    }
    this.barang = barang;
    this.jumlah = jumlah;
  }

  get subtotal(): number {
    return this.barang.harga * this.jumlah;
  }
}

export class Transaksi {
  id: string;
  items: ItemTransaksi[] = [];
  tanggal: Date;

  constructor(id: string) {
    this.id = id;
    this.tanggal = new Date();
  }

  tambahItem(barang: Barang, jumlah: number) {
    const existing = this.items.find((item) => item.barang.id === barang.id);
    if (existing) {
      existing.jumlah += jumlah;
    } else {
      this.items.push(new ItemTransaksi(barang, jumlah));
    }
  }

  hitung_total(): number {
    return this.items.reduce((acc, item) => acc + item.subtotal, 0);
  }

  tampilkan_struk(): string {
    const lines = [
      "=========================",
      "        NAY STORE        ",
      "=========================",
      `ID: ${this.id}`,
      `Tgl: ${this.tanggal.toLocaleString()}`,
      "-------------------------",
    ];

    this.items.forEach((item) => {
      const line = `${item.barang.nama.padEnd(12)} x${item.jumlah.toString().padEnd(3)} ${item.subtotal.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}`;
      lines.push(line);
    });

    lines.push("-------------------------");
    lines.push(`TOTAL: ${this.hitung_total().toLocaleString("id-ID", { style: "currency", currency: "IDR" })}`);
    lines.push("=========================");
    lines.push("   Terima Kasih!   ");

    return lines.join("\n");
  }
}

/**
 * Unit Test Suite
 */
export const runTests = () => {
  const results = {
    unitTotal: false,
    unitInput: false,
    integration: false,
  };

  // 1. Test Input Barang (Unit)
  try {
    const b1 = new Barang("1", "Apel", 5000);
    const b2 = new Barang("2", "Jeruk", -1000); // Should fail
    results.unitInput = false; // If it reaches here, it failed validation
  } catch (e) {
    results.unitInput = true; // Expected failure for negative price
  }

  // 2. Test Perhitungan Total (Unit)
  try {
    const b1 = new Barang("1", "Apel", 5000);
    const it = new ItemTransaksi(b1, 3);
    if (it.subtotal === 15000) {
      results.unitTotal = true;
    }
  } catch (e) {
    results.unitTotal = false;
  }

  // 3. Integration Test
  try {
    const tx = new Transaksi("TX001");
    const b1 = new Barang("1", "Apel", 5000);
    const b2 = new Barang("2", "Susu", 15000);

    tx.tambahItem(b1, 2); // 10000
    tx.tambahItem(b2, 1); // 15000

    const total = tx.hitung_total();
    const struk = tx.tampilkan_struk();

    if (total === 25000 && struk.includes("Apel") && struk.includes("Susu") && struk.includes("TOTAL:")) {
      results.integration = true;
    }
  } catch (e) {
    results.integration = false;
  }

  console.log("Unit Test Total Belanja:", results.unitTotal ? "PASS" : "FAIL");
  console.log("Unit Test Input Barang:", results.unitInput ? "PASS" : "FAIL");
  console.log("Integration Test Toko:", results.integration ? "PASS" : "FAIL");

  return results;
};

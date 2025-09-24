import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import Replicate from 'replicate';

// --- Inisialisasi Klien ---
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});
const client = new MongoClient(process.env.MONGODB_URI);
let cardsCollection;

// --- Koneksi ke MongoDB ---
async function connectToDb() {
    try {
        await client.connect();
        const database = client.db('digicard_db');
        cardsCollection = database.collection('cards');
        console.log('Berhasil terhubung ke MongoDB.');
    } catch (error) {
        console.error('Gagal terhubung ke MongoDB:', error);
        process.exit(1);
    }
}

// --- Fungsi Helper untuk Replicate API ---
async function callReplicateApi(prompt) {
    if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error("Replicate API Token belum diatur di .env");
    }
    try {
        const model = "ibm-granite/granite-3.3-8b-instruct";
        const input = {
            prompt: prompt,
            max_new_tokens: 256
        };

        const output = await replicate.run(model, { input });

        return Array.isArray(output) ? output.join('') : output;
    } catch (error) {
        console.error("Error saat memanggil Replicate API:", error);
        throw new Error("Gagal mendapatkan respons dari AI.");
    }
}

// --- Konfigurasi Express App ---
const app = express();
app.use(cors());
app.use(express.json());

// --- API Endpoints ---
// Endpoint processing teks dengan AI
app.post('/api/process-text', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Teks tidak boleh kosong." });
    }
    try {
        const prompt = `Anda adalah ahli pemilah kartu nama. Ekstrak nama, jabatan, perusahaan, nomor telepon, dan email dari teks berikut. Balas HANYA dengan objek JSON yang valid dengan kunci: "nama", "jabatan", "perusahaan", "nomorTelepon", "email". Jika sebuah field tidak ditemukan, gunakan string kosong. Teks: \n\n${text}`;
        const jsonString = await callReplicateApi(prompt);
        const cleanedJsonString = jsonString.replace(/```json\n?|\n?```/g, '').trim();
        const parsedData = JSON.parse(cleanedJsonString);
        res.json({ data: parsedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint email follow-up
app.post('/api/generate-email', async (req, res) => {
    const { card } = req.body;
    if (!card) {
        return res.status(400).json({ error: "Data kartu tidak boleh kosong." });
    }
    try {
        //const prompt = `Anda adalah asisten komunikasi profesional. Tulis email follow-up yang singkat dan profesional untuk ${card.nama}, seorang ${card.jabatan || 'profesional'} di ${card.perusahaan}. Sebutkan bahwa senang bertemu dengannya dan ingin tetap terhubung untuk peluang di masa depan. Buat email kurang dari 100 kata. Tanda tangani sebagai 'Hormat saya,'.`;
        const prompt = `Anda adalah seorang profesional yang hendak mengirim email follow-up. Tujuan Anda adalah untuk memperkuat koneksi dan membuka peluang di masa depan.
            **Tugas:**
            Tulis draf email yang akan dikirim ke ${card.nama}, yang menjabat sebagai ${card.jabatan || 'seorang profesional'} di ${card.perusahaan}.

            **Konteks (Asumsikan):**
            - Anda baru saja bertemu dengan mereka di sebuah acara (misalnya seminar, pameran, atau pertemuan bisnis).
            - Percakapan Anda berjalan dengan baik dan Anda ingin melanjutkan hubungan profesional.

            **Instruksi Email:**
            1.  **Subjek Email:** Buat subjek yang singkat, personal, dan jelas, contohnya: "Senang Bertemu di [Nama Acara]" atau "Melanjutkan Percakapan Kita".
            2.  **Paragraf Pembuka:** Sapa ${card.nama} secara personal dan sebutkan kembali di mana dan kapan Anda bertemu untuk menyegarkan ingatan mereka.
            3.  **Paragraf Isi:**
                -   Sebutkan secara spesifik satu hal menarik dari percakapan Anda dengan mereka. Ini menunjukkan bahwa Anda benar-benar mendengarkan. (Contoh: "Saya sangat tertarik dengan pandangan Anda mengenai...")
                -   Sampaikan tujuan Anda dengan jelas: ingin tetap terhubung untuk menjajaki potensi kolaborasi atau sekadar memperluas jaringan profesional.
            4.  **Paragraf Penutup (Ajakan Bertindak):**
                -   Usulkan langkah selanjutnya yang konkret namun tidak memaksa. Contoh: "Mungkin kita bisa melanjutkan diskusi ini sambil minum kopi lain waktu?" atau "Saya akan senang jika kita bisa terhubung di LinkedIn."
                -   Tutup dengan salam profesional seperti "Hormat saya," atau "Terima kasih,".

            **Batasan:**
            -   Gaya bahasa: Profesional, tulus, dan tidak bertele-tele.
            -   Panjang: Jaga agar email tetap singkat, idealnya di bawah 120 kata.`;
        const emailText = await callReplicateApi(prompt);
        res.json({ email: emailText });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD Endpoints ---
// GET
app.get('/api/cards', async (req, res) => {
    try {
        const cardsArray = await cardsCollection.find().sort({ tanggalDibuat: -1 }).toArray();
        const cards = cardsArray.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
        res.json({ cards });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data dari database.' });
    }
});

// POST
app.post('/api/cards', async (req, res) => {
    try {
        const { nama, perusahaan, ...rest } = req.body;
        if (!nama || !perusahaan) {
            return res.status(400).json({ error: "Nama dan perusahaan tidak boleh kosong." });
        }
        const newCardData = { nama, perusahaan, ...rest, tanggalDibuat: new Date().toISOString() };
        const result = await cardsCollection.insertOne(newCardData);
        const newCard = { id: result.insertedId, ...newCardData };
        res.status(201).json(newCard);
    } catch (error) {
        res.status(500).json({ error: 'Gagal menyimpan data ke database.' });
    }
});

// PUT (update)
app.put('/api/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { _id, ...updatedData } = req.body;
        const result = await cardsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Kartu tidak ditemukan.' });
        }
        res.json({ id, ...updatedData });
    } catch (error) {
        res.status(500).json({ error: 'Gagal memperbarui data di database.' });
    }
});

// DELETE
app.delete('/api/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await cardsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Kartu tidak ditemukan.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Gagal menghapus data dari database.' });
    }
});

// --- Jalankan Server ---
const PORT = process.env.PORT || 3000;
connectToDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
});

export default app;
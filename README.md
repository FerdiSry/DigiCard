<div align="center">
 <!-- <img src="https://www.google.com/search?q=https://placehold.co/150x150/7c3aed/ffffff%3Ftext%3DDAI" alt="Logo DigiCard AI" style="border-radius: 50%; width: 120px;"/> -->
 <h1 align="center">DigiCard AI</h1>
 <p>
  by Ferdi Suroyo x IBM Granite  |  
  <i>
    Pindai, Simpan, dan Terhubung.
  </i>
 </p>
 
 <p align="center">
   <a href="https://skillicons.dev">
     <img src="https://skillicons.dev/icons?i=nodejs,express,vercel,react,bootstrap" />
   </a>
 </p>
</div>


 <img width="1785" height="809" alt="image" src="https://github.com/user-attachments/assets/13fd6803-9a11-400d-bb5b-58b1eb022425" /><div align="center">
 <img width="1781" height="406" alt="image" src="https://github.com/user-attachments/assets/519d9fac-47a2-4825-ad02-29e5391bceac" /><div align="center">
 
 (Gambar di atas menunjukkan alur kerja: unggah gambar, data terisi otomatis oleh AI, dan kartu berhasil disimpan.)
 

 <div align="left"> 
 ✨ Fitur Utama
 Pemindaian & OCR: Unggah gambar kartu nama dan ekstrak teksnya secara otomatis menggunakan Tesseract.js.
 
 Pemilahan Cerdas dengan AI: Menggunakan model IBM Granite (via Replicate API) untuk mengidentifikasi dan menstrukturkan data (nama, jabatan, email, dll.) dari teks mentah.
 
 Manajemen Kontak (CRUD): Tambah, lihat, edit, dan hapus kartu nama yang sudah tersimpan.
 
 Pembuatan Email Follow-up: Hasilkan draf email profesional untuk kontak baru Anda dengan sekali klik.
 
 Pencarian Cepat: Cari dan temukan kontak dengan mudah berdasarkan nama atau perusahaan.
 
 Arsitektur Full-Stack: Dibangun dengan front-end React dan back-end Node.js (Express) untuk keamanan dan skalabilitas.
 
 🛠️ Tumpukan Teknologi
 Peran
 
 Teknologi
 
 Front-End
 
 React.js, Bootstrap 5, Tesseract.js
 
 Back-End
 
 Node.js, Express.js
 
 AI Model
 
 IBM Granite 3.3B Instruct via Replicate API
 
 Deployment
 
 Vercel
 
 🚀 Memulai
 Ikuti langkah-langkah berikut untuk menjalankan proyek ini di komputer lokal Anda.
 
 1. Prasyarat
 Node.js (v18 atau lebih tinggi)
 
 npm (biasanya terinstal bersama Node.js)
 
 Git
 
 2. Kloning Repository
 git clone [https://github.com/FerdiSry/DigiCard.AI.git](https://github.com/FerdiSry/DigiCard.AI.git)
 cd DigiCard.AI
 
 3. Instalasi Dependensi
 Proyek ini adalah monorepo, jadi Anda perlu menginstal dependensi di direktori utama dan di dalam folder frontend.
 
 Instal dependensi back-end
 npm install
 
 Pindah ke folder frontend dan instal dependensinya
 cd frontend
 npm install
 
 4. Konfigurasi Environment Variables
 Anda perlu menyediakan API token dari Replicate.
 
 Di dalam folder backend, buat file baru bernama .env.
 
 Isi file tersebut dengan token Anda:
 
 REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 
 5. Jalankan Aplikasi
 Kembali ke direktori utama dan jalankan server pengembangan.
 
 Kembali ke direktori utama
 cd ..
 
 Jalankan front-end dan back-end secara bersamaan
 npm run dev
 </div>

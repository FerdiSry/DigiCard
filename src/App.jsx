import React, { useState, useEffect, useMemo, Fragment } from 'react';

// --- Helper Components ---
const Icon = ({ path, className = "bi", width = "1em", height = "1em" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="currentColor" className={className} viewBox="0 0 16 16">
        <path d={path} />
    </svg>
);

const Toast = ({ message, type, onDismiss }) => {
    const bgClass = type === 'error' ? 'bg-danger' : 'bg-success';
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(), 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    return (
        <div className={`toast show position-fixed bottom-0 end-0 m-3 text-white ${bgClass} border-0`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex">
                <div className="toast-body">{message}</div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={onDismiss} aria-label="Close"></button>
            </div>
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={onClose}>
                <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <div className="modal-body">{children}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- Main Components ---
function OcrProcessor({ setFormData, showToast }) {
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [tesseract, setTesseract] = useState(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = () => {
            setTesseract(window.Tesseract);
        };
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, []);

    const handleImageUpload = async (event) => {
        const imageFile = event.target.files[0];
        if (!imageFile || !tesseract) return;
        
        setIsLoading(true);
        try {
            setStatusText('Mengekstrak teks dari gambar...');
            const worker = await tesseract.createWorker('eng');
            const { data: { text: rawText } } = await worker.recognize(imageFile);
            await worker.terminate();

            setStatusText('AI sedang memilah informasi...');
            const response = await fetch('/api/process-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: rawText }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Gagal memproses teks di server.' }));
                throw new Error(errorData.error);
            }
            const parsedData = await response.json();
            
            setFormData(prev => ({ ...prev, ...parsedData.data }));
            showToast('AI berhasil memilah kartu nama!');
        } catch (error) {
            console.error("Error during processing:", error);
            showToast(error.message || 'Gagal memproses gambar.', 'error');
        } finally {
            setIsLoading(false);
            setStatusText('');
            event.target.value = null;
        }
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="card-title h4 mb-3">Pindai & Biarkan AI Memilah</h2>
                <label htmlFor="file-upload" className={`btn btn-primary ${isLoading || !tesseract ? 'disabled' : ''}`}>
                    <Icon path="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" className="me-2" />
                    {tesseract ? 'Pilih Gambar Kartu Nama' : 'Memuat OCR...'}
                </label>
                <input id="file-upload" type="file" className="d-none" accept="image/*" onChange={handleImageUpload} disabled={isLoading || !tesseract} />
                
                {isLoading && (
                    <div className="mt-3">
                        <p className="mb-1">{statusText}</p>
                        <div className="progress">
                            <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CardForm({ currentCard, onSave, onCancel }) {
    const [formData, setFormData] = useState({ nama: '', jabatan: '', perusahaan: '', nomorTelepon: '', email: '' });
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        setFormData(currentCard || { nama: '', jabatan: '', perusahaan: '', nomorTelepon: '', email: '' });
        setValidated(false);
    }, [currentCard]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
        } else {
            onSave(formData);
            setFormData({ nama: '', jabatan: '', perusahaan: '', nomorTelepon: '', email: '' });
        }
        setValidated(true);
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body p-4">
                 <h2 className="card-title h4 mb-3">{formData.id ? 'Edit Kartu Nama' : 'Detail Kartu Nama'}</h2>
                <form noValidate validated={validated.toString()} onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="nama" className="form-label">Nama</label>
                            <input type="text" id="nama" name="nama" className="form-control" value={formData.nama} onChange={handleChange} required />
                            <div className="invalid-feedback">Nama tidak boleh kosong.</div>
                        </div>
                         <div className="col-md-6">
                            <label htmlFor="jabatan" className="form-label">Jabatan</label>
                            <input type="text" id="jabatan" name="jabatan" className="form-control" value={formData.jabatan} onChange={handleChange} />
                        </div>
                         <div className="col-md-6">
                            <label htmlFor="perusahaan" className="form-label">Perusahaan</label>
                            <input type="text" id="perusahaan" name="perusahaan" className="form-control" value={formData.perusahaan} onChange={handleChange} required />
                             <div className="invalid-feedback">Perusahaan tidak boleh kosong.</div>
                        </div>
                         <div className="col-md-6">
                            <label htmlFor="nomorTelepon" className="form-label">Nomor Telepon</label>
                            <input type="tel" id="nomorTelepon" name="nomorTelepon" className="form-control" value={formData.nomorTelepon} onChange={handleChange} required pattern="\+?[\d\s\-]{7,}" />
                            <div className="invalid-feedback">Format nomor telepon tidak valid.</div>
                        </div>
                        <div className="col-12">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input type="email" id="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                            <div className="invalid-feedback">Format email tidak valid.</div>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                        {formData.id && <button type="button" onClick={onCancel} className="btn btn-secondary me-2">Batal</button>}
                        <button type="submit" className="btn btn-primary">{formData.id ? 'Simpan Perubahan' : 'Tambah Kartu'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BusinessCard({ card, onEdit, onDelete, onGenerateEmail }) {
    return (
        <div className="card h-100 shadow-sm transition-shadow hover-shadow">
            <div className="card-header bg-primary text-white">
                <h3 className="h5 mb-0">{card.nama}</h3>
                <p className="mb-0 small">{card.jabatan || 'Tidak ada jabatan'}</p>
            </div>
            <div className="card-body d-flex flex-column">
                <p className="d-flex align-items-center mb-2"><Icon path="M16 12.5a.5.5 0 0 0-.5-.5h-15a.5.5 0 0 0 0 1h15a.5.5 0 0 0 .5-.5zM.5 10a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5zM.5 7.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5zm.5-3a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5zM.5 2a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5z" className="me-3 text-primary" />{card.perusahaan}</p>
                <p className="d-flex align-items-center mb-2"><Icon path="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547c.52-.13 1.071-.015 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" className="me-3 text-primary" />{card.nomorTelepon}</p>
                <p className="d-flex align-items-center"><Icon path="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z" className="me-3 text-primary"/>{card.email}</p>
            </div>
            <div className="card-footer bg-light d-flex justify-content-between align-items-center">
                <button onClick={() => onGenerateEmail(card)} className="btn btn-sm btn-link text-decoration-none">
                   <Icon path="M5 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm10.854-9.854a.5.5 0 0 0-.708-.708L13.5 1.793 12.146.439a.5.5 0 0 0-.708.708L12.793 2.5l-1.353 1.354a.5.5 0 0 0 .708.708L13.5 3.207l1.354 1.353a.5.5 0 0 0 .708-.708L14.207 2.5l1.647-1.646z" className="me-1"/>
                   Buat Email
                </button>
                <div>
                    <button onClick={() => onEdit(card)} className="btn btn-sm btn-outline-secondary me-1">Edit</button>
                    <button onClick={() => onDelete(card.id)} className="btn btn-sm btn-outline-danger">Hapus</button>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component ---
export default function App() {
    const [cards, setCards] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCard, setEditingCard] = useState(null);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [cardForEmail, setCardForEmail] = useState(null);
    const [ocrFormData, setOcrFormData] = useState(null);
    
    useEffect(() => {
        const fetchCards = async () => {
            try {
                const response = await fetch('/api/cards');
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Server tidak memberikan respons JSON.' }));
                    throw new Error(errorData.error || `Gagal memuat data: Status ${response.status}`);
                }

                const data = await response.json();
                setCards(data.cards || []);
            } catch (error) {
                console.error("Gagal memuat data kartu:", error);
                showToast(error.message, "error");
            }
        };
        fetchCards();
    }, []);
    

    const showToast = (message, type = 'success') => {
        setToast({ message, type, visible: true });
    };

    const handleSaveCard = async (cardData) => {
        const isUpdating = !!cardData.id;
        const url = isUpdating ? `/api/cards/${cardData.id}` : '/api/cards';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cardData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Gagal ${isUpdating ? 'memperbarui' : 'menyimpan'} kartu.`);
            }
            const savedCard = await response.json();
            
            if (isUpdating) {
                setCards(cards.map(card => card.id === savedCard.id ? savedCard : card));
                showToast('Kartu berhasil diperbarui!');
            } else {
                setCards([savedCard, ...cards]);
                showToast('Kartu berhasil ditambahkan!');
            }
            setEditingCard(null);
            setOcrFormData(null);
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleDeleteCard = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus kartu ini?')) {
             try {
                const response = await fetch(`/api/cards/${id}`, { method: 'DELETE' });
                if (response.status !== 204) {
                    const errorData = await response.json().catch(() => ({error: 'Gagal menghapus kartu.'}));
                    throw new Error(errorData.error);
                }
                setCards(cards.filter(card => card.id !== id));
                showToast('Kartu berhasil dihapus.');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
    };
    
    const handleGenerateEmail = async (card) => {
        setCardForEmail(card);
        setIsEmailModalOpen(true);
        setIsGeneratingEmail(true);
        setGeneratedEmail('');
        try {
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ card }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal membuat email.');
            }
            const data = await response.json();
            setGeneratedEmail(data.email);
        } catch (error) {
            setGeneratedEmail(`Gagal membuat email: ${error.message}`);
        } finally {
            setIsGeneratingEmail(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedEmail).then(() => {
            showToast('Email berhasil disalin!');
        }, (err) => {
            showToast('Gagal menyalin email.', 'error');
        });
    };

    const filteredCards = useMemo(() => {
        return cards.filter(card =>
            (card.nama && card.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (card.perusahaan && card.perusahaan.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [cards, searchTerm]);

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-4 py-md-5">
                {toast.visible && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />}
                
                <header className="text-center mb-5">
                    <h1 className="display-4 fw-bold">DigiCard AI</h1>
                    <h5 className="fw-medium  mt-4">by Ferdi Suroyo x IBM Granite</h5>
                    <p className="lead text-muted mt-2"><em>Pindai, Simpan, dan Terhubung.</em></p>
                </header>
                
                <main>
                    <div className="row justify-content-center">
                        <div className="col-lg-10 col-xl-8">
                            {editingCard ? (
                                <CardForm currentCard={editingCard} onSave={handleSaveCard} onCancel={() => setEditingCard(null)} />
                            ) : (
                                <Fragment>
                                    <OcrProcessor setFormData={setOcrFormData} showToast={showToast} />
                                    <CardForm currentCard={ocrFormData} onSave={handleSaveCard} />
                                </Fragment>
                            )}
                        </div>
                    </div>

                    <div className="mt-5">
                        <h2 className="text-center h3 mb-4">Koleksi Kartu Nama Anda</h2>
                        <div className="row justify-content-center">
                            <div className="col-md-8 col-lg-6">
                                 <input
                                    type="text"
                                    placeholder="Cari berdasarkan nama atau perusahaan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-control form-control-lg mb-4 shadow-sm"
                                />
                            </div>
                        </div>

                        {filteredCards.length > 0 ? (
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {filteredCards.map(card => (
                                    <div className="col" key={card.id}>
                                        <BusinessCard card={card} onEdit={setEditingCard} onDelete={handleDeleteCard} onGenerateEmail={handleGenerateEmail} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 px-3 bg-white rounded shadow-sm">
                                <p className="text-muted">Belum ada kartu nama.</p>
                            </div>
                        )}
                    </div>
                </main>

                <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title={`Email Follow-up untuk ${cardForEmail?.nama}`}>
                    {isGeneratingEmail ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3 text-muted">AI sedang menulis email...</p>
                        </div>
                    ) : (
                        <div>
                            <textarea
                                readOnly
                                value={generatedEmail}
                                className="form-control"
                                rows="8"
                            ></textarea>
                            <div className="d-flex justify-content-end mt-3">
                                <button onClick={copyToClipboard} className="btn btn-primary">Salin Teks</button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
}
